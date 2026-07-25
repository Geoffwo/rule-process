const fs = require('fs');
const path = require('path');
const {logInfo,logError, logDebug, logVerbose} = require('../utils/log');
const {validateLoadRuleFun, validateOutputNode, validatePaths} = require('../utils/validator');
const {readFileWithLimit} = require('../utils/ruleRead');
const {getEncNodeByExt,getRealEncodeByNode} = require('../utils/ruleExt2EncMap');
const {getOutputNodeDoc,getOutputNodeTemplate} = require('../utils/ruleWriter');
const {createHostDir} = require('../utils/hosting');

/**
 * 自动读取规则
 * @param {string} inputPath - 输入路径（文件或目录）
 * @param {string} outputPath - 输出路径（文件或目录）
 * @param {string} rulesPath - 模板规则文件路径
 */
async function generateBasic(inputPath, outputPath, rulesPath) {
    try {
        logDebug('校验所有路径地址开始');
        validatePaths(inputPath, outputPath, rulesPath);
        logDebug('校验所有路径地址结束', '\n');

        // 先加载规则模块，获取 mode 决定读取策略
        logInfo('模板导入开始');
        const ruleModule = loadRuleModule(rulesPath);
        logInfo('模板导入结束, 读取模式:', ruleModule.mode, '\n');

        logDebug('校验模板开始');
        validateLoadRuleFun(ruleModule.process);
        logDebug('校验模板结束', '\n');

        // 根据规则声明的 mode 决定输入读取方式
        logInfo('获取输入文件列表开始');
        const inputArray = getInputArray(inputPath, ruleModule.mode);
        logInfo('获取输入文件列表结束', '\n');

        logInfo('生成输出开始');
        await buildOutputArray(inputArray, ruleModule.process, outputPath);
        logInfo('生成输出结束', '\n');

        logInfo(`生成成功！`);
    } catch (error) {
        logError(`生成文件失败:`, error);
    }
}

function getInputArray(inputPath, mode = 'full') {
    // 同步获取输入路径的文件系统状态信息
    // 返回一个 fs.Stats 对象，包含文件/目录的元数据
    const stat = fs.statSync(inputPath);

    // 如果是文件，直接返回文件内容
    if (stat.isFile()) {
        const inputNode = loadInputNode(inputPath, false, mode);
        logInfo( '获取文件:',inputPath);
        return new Array(inputNode);
    }

    // 如果是目录，递归获取所有内容
    if (stat.isDirectory()) {
        return traverseDirectory(inputPath, mode);
    }

    logError(`无效的输入路径: ${inputPath}`);
}

function loadInputNode(inputPath, isDirectory = false, mode = 'full') {
    //path.parse(inputPath): root、dir、base、ext、name
    const parsedPath = path.parse(inputPath);
    const stat = fs.statSync(inputPath);
    const baseInputNode = {
        ...parsedPath,
        ...getEncNodeByExt(parsedPath.ext),//编码方式 和 标准化扩展名 normExt,encode
        path: inputPath,
        isDirectory,
        size:isDirectory?0:stat.size,//文件字节数
    }

    // stream 模式：不读取内容，挂载 createReadStream 工厂方法
    if (mode === 'stream') {
        return {
            ...baseInputNode,
            content: null,
            stream: (options = {}) => {//允许手动配置
                const defaults = baseInputNode.encode === 'buffer'
                    ? {} // 二进制模式不设 encoding 依旧是流
                    : { encoding: 'utf-8' };//非 buffer 模式（文本场景）→ 补上 encoding: 'utf-8'，自动转成 UTF-8 字符串，方便直接处理文本
                return fs.createReadStream(baseInputNode.path, { ...defaults, ...options });
            }
        }
    }

    // full 模式：原有行为，全量读取 content
    return {
        ...baseInputNode,
        content: isDirectory ? null : readFileWithLimit(baseInputNode)
    }
}

// 递归遍历目录的辅助函数
function traverseDirectory(dirPath, mode = 'full') {
    logInfo( '读取目录:',dirPath);
    const results = [];

    // 使用 withFileTypes 获取文件类型信息
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        logDebug( '读取目录内容:',fullPath);

        const isDirectory = entry.isDirectory();
        const inputNode = loadInputNode(fullPath, isDirectory, mode);

        // 先添加当前条目路径
        results.push(inputNode);

        // 如果是目录则递归处理
        if (isDirectory) {
            results.push(...traverseDirectory(fullPath, mode))
        }
    }

    return results;
}

//处理导入模板逻辑 require劫持
function loadRuleModule(rulesPath){
    logInfo( '加载模板规则地址:',rulesPath);

    try{
        const ruleData = require(rulesPath)
        return {
            process: ruleData.process,
            mode: ruleData.mode || 'full' // 规则声明读取模式，默认 full
        }
    }catch (e){
        // 如果找不到模块（只处理 MODULE_NOT_FOUND 错误），则尝试用宿主环境依赖
        if (e.code === 'MODULE_NOT_FOUND') {
            logError('模块依赖缺失,请重新执行rule-process install添加依赖',e);
        }
        // 其它错误继续抛出
        logError(e);
    }
}

async function buildOutputArray(inputArray, ruleFun, outputPath) {
    const outputNodeDoc = getOutputNodeDoc(outputPath);
    logInfo('导出对象数组,其中 node模板:\n', outputNodeDoc, '\n');

    const outputNodeTemplate = getOutputNodeTemplate(outputPath);

    // 实时写入文件，但延迟打印日志，攒够一批再刷新
    const pendingLogs = [];
    const flushLogs = () => {
        if (pendingLogs.length === 0) return;
        // 统一刷新所有收集的日志
        pendingLogs.forEach(({ fn, args }) => fn(...args));
        pendingLogs.length = 0;//清空已打印的日志，释放内存
    };

    try {
        const outputResult  = await ruleFun(inputArray, outputNodeTemplate);

        // 处理 ruleFun 没有返回值的情况
        if (outputResult === undefined) {
            logInfo('规则函数未返回任何值，将自动退出'); // 假设存在 logWarn 日志函数
            return; // 终止后续逻辑执行
        }

        // 情况1：返回的是数组 → 全量模式
        if (Array.isArray(outputResult)) {
            logInfo('规则返回全量数组...');

            validateOutputNode(outputResult);
            processOutputArray(outputResult);
        } else {// 情况2：返回的是可迭代对象(异步/同步)（如 async generator/generator）→ 流式模式
            logInfo('检测到异步生成器，启用流式处理...');

            // 逐个消费生成器，单个节点出错不中断整体流程
            for await (const outputArray of outputResult) {
                // 流式模式下也要校验单个节点的合法性
                validateOutputNode(outputArray);
                processOutputArray(outputArray, pendingLogs);
                // 日志缓冲上限，超过则立即刷新
                if (pendingLogs.length >= 200) flushLogs();
            }
            // 剩余日志统一刷新
            flushLogs();
        }
    } catch (err) {
        flushLogs(pendingLogs); // 异常兜底
        logError(`规则文件异常: ${err.message}`);
    }
}

function processOutputArray(outputArray, logBuffer = null) {
    // 有 logBuffer 时日志推入缓冲区延迟打印，否则直接输出
    const emit = (fn, ...args) => {
        if (logBuffer) { logBuffer.push({ fn, args }); }
        else { fn(...args); }
    };

    emit(logDebug, '输出数组长度:', outputArray.length);
    try {
        outputArray.forEach(node => {
            // 获取模板默认值（传入当前 node.path 以便支持动态路径）
            const template = getOutputNodeTemplate(node.path);

            const mergedNode = Object.assign({}, template, node);// 合并主字段（用户优先，模板兜底）
            const mergedOption = Object.assign({}, template.option, node.option || {});// 合并 option 字段（深层合并，用户优先）

            // 判断 option 的encode字段是否存在
            // 如果为空，表示用户没有设置，使用自动匹配，如果不为空，使用用户设置的编码方式
            const encodeNode = getEncNodeByExt(mergedNode.normExt);
            if(!mergedOption.encode){
                mergedOption.encode = getRealEncodeByNode(encodeNode);
                emit(logVerbose, `[${encodeNode.normExt}]使用[${encodeNode.encode}]编码类型解析`)
            }


            const finalNode = Object.assign({}, mergedNode, { option: mergedOption });//合并最终的node

            let fullPath = finalNode.path;
            const fileName = finalNode.fileName;
            const normExt = finalNode.normExt;

            // 处理目录/文件创建
            if (finalNode.isDirectory) {
                // 创建目录（recursive模式避免重复创建）
                createHostDir(fullPath)
                emit(logInfo, '创建目录: ', fullPath)
            } else {
                fullPath = path.join(fullPath, `${fileName}.${normExt}`); // 默认文件名
                emit(logDebug, `自动拼接文件名: ${fileName}.${normExt}`)

                // 确保父目录存在
                const parentDir = path.dirname(fullPath);
                createHostDir(parentDir)

                // 写入文件内容（根据规则覆盖或追加）
                fs.writeFileSync(fullPath, finalNode.content, finalNode.option);
                emit(logInfo, '创建文件: ', fullPath)
            }
        });
    } catch (err) {
        logError(`处理输出节点异常: ${err.message}`);
    }
}

module.exports = {
    generateBasic
};

