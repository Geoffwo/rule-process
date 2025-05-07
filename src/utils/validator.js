const {logStep} = require("./log");

function validatePaths(...paths) {
    paths.forEach(path => {
        logStep( '校验地址:',path);
        if (typeof path !== 'string' || !path.trim()) {
            throw new Error(`路径参数无效: ${path}`);
        }
    });
}

function validateLoadRuleFun(ruleFun) {
    // 检查是否导出函数
    if (typeof ruleFun !== 'function') {
        throw new Error('规则文件必须导出一个函数');
    }

    return ruleFun;
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