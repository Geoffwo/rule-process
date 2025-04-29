const {logStep} = require("./log");

function validatePaths(...paths) {
    paths.forEach(path => {
        logStep( '校验地址:',path);
        if (typeof path !== 'string' || !path.trim()) {
            throw new Error(`路径参数无效: ${path}`);
        }
    });
}

/**输出格式校验
 * {
 path: ***,
 isDirectory: false,
 content: readFileWithLimit(inputPath)
 append: true // 覆盖content
 }*/
function validateOutputNode(node) {
    // 首先检查node是否为对象
    if (typeof node !== 'object' || node === null || Array.isArray(node)) {
        return false;
    }

    const requiredFields = ['path', 'isDirectory', 'content', 'append'];

    // 检查必需字段是否存在
    for (const field of requiredFields) {
        if (!(field in node)) {
            return false;
        }
    }

    return true;
}

function validateLoadRuleFun(rulesPath) {
    logStep( '加载模板规则地址:',rulesPath);

    // 加载 rule 文件，此时 rule 文件 require('xlsx') 会走上面的逻辑
    const ruleFuc = require(rulesPath);

    // 检查是否导出函数
    if (typeof ruleFuc !== 'function') {
        throw new Error('规则文件必须导出一个函数');
    }

    return ruleFuc;
}

module.exports = {
    validatePaths,
    validateOutputNode,
    validateLoadRuleFun
};