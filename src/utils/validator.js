const path = require("path");
const fs = require("fs");
const semver = require('semver');

const {logInfo,logError} = require("./log");

function validatePaths(...paths) {
    paths.forEach(path => {
        logInfo( '校验地址:',path);
        if (typeof path !== 'string' || !path.trim()) {
            logError(`路径参数无效: ${path}`);
        }
    });
}

function validateLoadRuleFun(ruleFun) {
    // 检查是否导出函数
    if (typeof ruleFun !== 'function') {
        logError('规则文件必须导出一个函数');
    }

    return ruleFun;
}


/**
 * 校验数组中每个对象的 path 字段是否有效
 * @param {Array} arr
 */
function validateOutputNode(arr) {
    if (!Array.isArray(arr))  logError('输入必须为数组');

    validateArrayPathEmpty(arr);
    validateArrayPathIsOnlyDir(arr);
    validateArrayContent(arr)

}

/**
 * 校验数组中是否存在 path 字段为空的对象
 * @param {Array} arr
 */
function validateArrayPathEmpty(arr) {
    const hasEmptyPath = arr.some(item => typeof item.path !== 'string' || !item.path.trim());
    if (hasEmptyPath) {
        logError('数组中存在 path 字段为空的对象');
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
        logError('数组中存在 path 字段[以斜杠结尾或包含文件名]的对象');
    }
}

/**
 * 校验数组中节点的 content 字段
 * @param {Array} arr - 输出节点数组
 */
function validateArrayContent(arr) {
    for (const node of arr) {
        // 跳过目录节点（不需要 content）
        if (node.isDirectory) {
            continue;
        }

        // 检查 content 是否存在
        if (node.content === undefined || node.content === null) {
            logError(`文件节点必须包含 content 字段: ${node.path}`);
        }

        // 校验 content 类型
        const isContentValid = Buffer.isBuffer(node.content) || typeof node.content === 'string';
        if (!isContentValid) {
            logError(
                `文件内容类型错误: ${node.path}\n` +
                `期望类型: Buffer 或 string\n` +
                `实际类型: ${typeof node.content}`
            );
        }
    }
}

function validateInstallModules(modules) {
    modules.forEach(module => {
        const modulePath = path.join(process.cwd(), 'node_modules', module);
        if (!fs.existsSync(modulePath)) {
            logError(`模块未正确安装: ${module}`);
        }
    });
}

function validatePlugin(plugin){
    // 验证必要字段
    if (!plugin.name || !plugin.version || !plugin.process) {
        logError('插件必须包含 name/version/process 字段');
    }

    // 验证版本格式
    if (!semver.valid(plugin.version)) {
        logError(`无效的版本号: ${plugin.version}`);
    }
}

module.exports = {
    validatePaths,
    validateOutputNode,
    validateLoadRuleFun,
    validateInstallModules,
    validatePlugin
};