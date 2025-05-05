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
        logStep( 'node节点返回格式不正确');
        return false;
    }

    const requiredFields = ['path', 'isDirectory', 'content', 'option'];

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


/**
 * 校验数组中每个对象的 path 字段是否有效
 * @param {Array} arr
 */
function validateOutputNode(arr) {
    if (!Array.isArray(arr))  throw new Error('输入必须为数组');

    validateArrayPathEmpty(arr);
    validateArrayPathIsOnlyDir(arr);


}

/**
 * 校验数组中是否存在 path 字段为空的对象
 * @param {Array} arr
 */
function validateArrayPathEmpty(arr) {
    const hasEmptyPath = arr.some(item => typeof item.path !== 'string' || !item.path.trim());
    if (hasEmptyPath) {
        throw new Error('数组中存在 path 字段为空的对象');
    }
}

/**
 * 校验数组中是否存在 path 字段不是仅为目录的对象
 * @param {Array} arr
 */
function validateArrayPathIsOnlyDir(arr) {
    const hasNotOnlyDir = arr.every(item => {
        const pathValue = item.path.trim();
        // 最后一段不能包含点号或以斜杠结尾
        const lastSegment = pathValue.split(/[/\\]/).filter(Boolean).pop();
        if (!lastSegment || lastSegment.includes('.')) return false;
        return true;
    });
    if (!hasNotOnlyDir) {
        throw new Error('数组中存在 path 字段[以斜杠结尾或包含文件名]的对象');
    }
}

module.exports = {
    validatePaths,
    validateOutputNode,
    validateLoadRuleFun
};