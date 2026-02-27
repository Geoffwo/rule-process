const fs = require('fs');
const path = require('path');
const {logInfo,logError, logDebug} = require('../utils/log');
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

        logInfo('获取输入文件列表开始');
        const inputArray = getInputArray(inputPath);
        logInfo('获取输入文件列表结束', '\n');

        logInfo('模板导入开始');
        const ruleFun = loadRuleFun(rulesPath);
        logInfo('模板导入结束', '\n');

        logDebug('校验模板开始');
        validateLoadRuleFun(ruleFun);
        logDebug('校验模板结束', '\n');

        logInfo('生成输出开始');
        await buildOutputArray(inputArray, ruleFun, outputPath);
        logInfo('生成输出结束', '\n');

        logInfo(`生成成功！`);
    } catch (error) {
        logError(`生成文件失败:`, error);
    }
}

function getInputArray(inputPath) {
    // 同步获取输入路径的文件系统状态信息
    // 返回一个 fs.Stats 对象，包含文件/目录的元数据
    const stat = fs.statSync(inputPath);

    // 如果是文件，直接返回文件内容
    if (stat.isFile()) {
        const inputNode = loadInputNode(inputPath);
        logInfo( '获取文件:',inputPath);
        return new Array(inputNode);
    }

    // 如果是目录，递归获取所有内容
    if (stat.isDirectory()) {
        return traverseDirectory(inputPath);
    }

    logError(`无效的输入路径: ${inputPath}`);
}

function loadInputNode(inputPath,isDirectory = false) {
    //path.parse(inputPath): root、dir、base、ext、name
    const parsedPath = path.parse(inputPath);
    const baseInputNode = {
        ...parsedPath,
        ...getEncNodeByExt(parsedPath.ext),//编码方式 和 标准化扩展名 normExt,encode
        path: inputPath,
        isDirectory,
    }
    return {
        ...baseInputNode,
        content: isDirectory ? null : readFileWithLimit(baseInputNode)
    }
}

// 递归遍历目录的辅助函数
function traverseDirectory(dirPath) {
    logInfo( '读取目录:',dirPath);
    const results = [];

    // 使用 withFileTypes 获取文件类型信息
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        logDebug( '读取目录内容:',fullPath);

        const isDirectory = entry.isDirectory();
        const inputNode = loadInputNode(fullPath,isDirectory);

        // 先添加当前条目路径
        results.push(inputNode);

        // 如果是目录则递归处理
        if (isDirectory) {
            results.push(...traverseDirectory(fullPath))
        }
    }

    return results;
}

//处理导入模板逻辑 require劫持
function loadRuleFun(rulesPath){
    logInfo( '加载模板规则地址:',rulesPath);

    try{
        const ruleData = require(rulesPath)
        return ruleData.process
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
                processOutputArray(outputArray);
            }
        }
    } catch (err) {
        logError(`规则文件异常: ${err.message}`);
    }
}

function processOutputArray(outputArray) {
    logDebug( '输出数组长度:',outputArray.length);
    try {
        outputArray.forEach(node => {
            // 获取模板默认值（传入当前 node.path 以便支持动态路径）
            const template = getOutputNodeTemplate(node.path);

            const mergedNode = Object.assign({}, template, node);// 合并主字段（用户优先，模板兜底）
            const mergedOption = Object.assign({}, template.option, node.option || {});// 合并 option 字段（深层合并，用户优先）

            // 判断 option 的encode字段是否存在
            // 如果为空，表示用户没有设置，使用自动匹配，如果不为空，使用用户设置的编码方式
            const encodeNode = getEncNodeByExt(mergedNode.normExt);
            mergedOption.encode = mergedOption.encode ? mergedOption.encode : getRealEncodeByNode(encodeNode);

            const finalNode = Object.assign({}, mergedNode, { option: mergedOption });//合并最终的node

            let fullPath = finalNode.path;
            const fileName = finalNode.fileName;
            const normExt = finalNode.normExt;

            // 处理目录/文件创建
            if (finalNode.isDirectory) {
                // 创建目录（recursive模式避免重复创建）
                createHostDir(fullPath)
                logInfo('创建目录: ',fullPath)
            } else {
                fullPath = path.join(fullPath, `${fileName}.${normExt}`); // 默认文件名
                logDebug(`自动拼接文件名: ${fileName}.${normExt}`)

                // 确保父目录存在
                const parentDir = path.dirname(fullPath);
                createHostDir(parentDir)

                // 写入文件内容（根据规则覆盖或追加）
                fs.writeFileSync(fullPath, finalNode.content, finalNode.option);
                logInfo('创建文件: ',fullPath)
            }
        });
    } catch (err) {
        logError(`处理输出节点异常: ${err.message}`);
    }
}

module.exports = {
    generateBasic
};

