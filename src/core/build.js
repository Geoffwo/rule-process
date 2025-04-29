const fs = require('fs-extra');
const path = require('path');
const {logStep,logStepInfo} = require('../utils/log');
const {validateLoadRuleFun, validateOutputNode, validatePaths} = require('../utils/validator');
const {readFileWithLimit,getEncodeByExt} = require('../utils/readFile');
const { detectHostModule } = require('./hosting');

/**
 * 自动读取规则
 * @param {string} inputPath - 输入路径（文件或目录）
 * @param {string} outputPath - 输出路径（文件或目录）
 * @param {string} rulesPath - 模板规则文件路径
 */
function generateBasic(inputPath, outputPath, rulesPath) {

    try {
        logStep('路径地址校验开始');
        validatePaths(inputPath, outputPath, rulesPath);
        logStep('路径地址校验结束','\n');

        logStep('获取输入文件列表开始');
        const inputArray = getInputArray(inputPath);
        logStep('获取输入文件列表结束','\n');

        logStep('模板导入开始');
        const ruleFun = loadRuleFun(rulesPath);
        logStep('模板导入结束','\n');

        logStep('生成带目录结构的输出内容开始');
        const outputArray = buildOutputArray(inputArray, ruleFun, outputPath);
        logStep('生成带目录结构的输出内容结束','\n');

        logStep('处理所有输出节点开始');
        processOutputArray(outputArray);
        logStep('处理所有输出节点结束','\n');

        logStep( `生成成功！`);
    } catch (error) {
        logStep( `生成文件失败:`, error);
    }
}

function getInputArray(inputPath) {
    // 同步获取输入路径的文件系统状态信息
    // 返回一个 fs.Stats 对象，包含文件/目录的元数据
    const stat = fs.statSync(inputPath);

    // 如果是文件，直接返回文件内容
    if (stat.isFile()) {
        const inputNode = loadInputNode(inputPath);
        logStep( '获取文件:',inputPath);
        return new Array(inputNode);
    }

    // 如果是目录，递归获取所有内容
    if (stat.isDirectory()) {
        return traverseDirectory(inputPath);
    }

    throw new Error(`无效的输入路径: ${inputPath}`);
}

function loadInputNode(inputPath,isDirectory = false) {
    //path.parse(inputPath): root、dir、base、ext、name
    const parsedPath = path.parse(inputPath);
    const baseInputNode = {
        ...parsedPath,
        ...getEncodeByExt(parsedPath.ext),//编码方式 和 标准化扩展名 normExt,encode
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
    logStep( '读取目录:',dirPath);
    const results = [];

    // 使用 withFileTypes 获取文件类型信息
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        logStep( '读取目录内容:',fullPath);

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
    // 临时重写 Node.js 的 require 方法，实现依赖劫持
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    // 增加递归保护标志
    // let inDetectHostModule = false;
    Module.prototype.require = function(moduleName) {
        try {
            // 先尝试用原始 require（即 exe 内部依赖）
            return originalRequire.apply(this, arguments);
        } catch (e) {
            // 如果找不到模块（只处理 MODULE_NOT_FOUND 错误），则尝试用宿主环境依赖
            if (e.code === 'MODULE_NOT_FOUND') {
                // 传递原生 require，避免递归
                return detectHostModule(moduleName, originalRequire);
            }
            // 其它错误继续抛出
            throw e;
        }
    };
    logStep( 'require模块劫持，使用宿主环境依赖');

    // 加载 rule 文件，此时 rule 文件 require('xlsx') 会走上面的逻辑
    const ruleFun = validateLoadRuleFun(rulesPath);

    // 恢复原始 require 方法，避免影响后续模块加载
    Module.prototype.require = originalRequire;
    logStep( 'require模块恢复，使用软件本身依赖');

    return ruleFun
}

function buildOutputArray(inputArray, ruleFuc, outputPath) {
    const outputNodeTemplate = getOutputNodeTemplate(outputPath);
    logStepInfo( '导出对象数组,其中 node模板:\n',outputNodeTemplate,'\n');

    const outputArray = ruleFuc(inputArray,outputNodeTemplate);

    if (Array.isArray(outputArray)){
        logStep( '输出数组长度:',outputArray.length);
        const filter = outputArray.filter(info => validateOutputNode(info));
        logStep( 'node格式过滤后，输出数组长度:',filter.length);
        return filter;
    }

    return [];
}

function getOutputNodeTemplate(outputPath) {
    return {
        path: outputPath,//导出路径
        isDirectory: false,//是否是目录，布尔值 true/false
        content: '',//内容
        append: false, // 是否追加，布尔值 true/false
        ext:'js',//【可选】导出文件类型
    }
}

function processOutputArray(outputArray) {
    outputArray.forEach(node => {
        let fullPath = node.path;

        // 如果是文件节点，强制校验路径有效性
        if (!node.isDirectory) {
            // 自动处理目录型路径：当路径以目录分隔符结尾或没有扩展名时，添加默认文件名
            if (shouldAutoCreateFilename(fullPath)) {
                fullPath = path.join(fullPath, `result.${node.ext}`); // 默认文件名
                logStep(`自动修正文件路径为: ${fullPath}`)
            }
        }

        // 处理目录/文件创建
        if (node.isDirectory) {
            // 创建目录（recursive模式避免重复创建）
            ensureOutputDirectory(fullPath)
            logStep('创建目录: ',fullPath)
        } else {
            // 确保父目录存在
            const parentDir = path.dirname(fullPath);
            ensureOutputDirectory(parentDir)

            // 写入文件内容（根据规则覆盖或追加）
            writeFileContent(fullPath, node.content, node.append);
            logStep('创建文件: ',fullPath)
        }
    });
}

function shouldAutoCreateFilename(filePath) {
    // 情况1: 路径以目录分隔符结尾（如 ./output/ 或 C:\output\ ）
    const isDirectoryLike = filePath.endsWith(path.sep);

    // 情况2: 路径最后一段没有扩展名（如 ./output/data ）
    const lastSegment = path.basename(filePath);
    const hasNoExtension = !lastSegment.includes('.');

    // 满足任意情况则认为需要自动创建文件名
    return isDirectoryLike || hasNoExtension;
}

function ensureOutputDirectory(outputPath) {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
}

function writeFileContent(filePath, content = '', appendMode = false) {
    //默认覆盖为空
    if (appendMode) {
        fs.appendFileSync(filePath, content, 'utf8');//追加
    } else {
        fs.writeFileSync(filePath, content, 'utf8');//覆盖（默认）
    }
}

module.exports = {
    generateBasic
};

