const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { logInfo,logError, logWarn, logDebug} = require('../utils/log');
const { validateModules } = require('../utils/validator');
const { detectHostModule } = require('../utils/hosting');

// 主函数：预安装依赖
function preprocessModules(rulesPath, action = 'install') {
    let installList = []; // 在函数顶部声明，初始化为空数组
    try {
        // 预提取当前页面所有第三方模块
        const extractModules = preExtractModules(rulesPath);

        // 独立抽取的模块过滤方法
        installList = getFilteredModules(extractModules, action)
        if (installList.length === 0) {
            logWarn(`无缺失依赖，跳过 ${action}`);
            return;
        }

        // 批量安装缺失模块
        processModules(installList,action)
        logInfo('依赖处理完成');

        // 验证安装结果
        validateModules(installList, action);
        logInfo('所有依赖已正确处理');
    } catch (error) {
        logError(`预处理失败，请尝试手动运行:npm ${action} -g `, installList.join(' '));
    }
}

// 独立抽取的模块过滤方法
function getFilteredModules(extractModules, action) {
    if (action === 'install') {
        return extractModules.filter(module => !detectHostModule(module,true));//不返回已安装的模块,检验全局插件
    }
    if (action === 'uninstall') {
        return extractModules.filter(module => detectHostModule(module));//返回已安装的模块
    }
    // 非预期操作返回空数组
    return [];
}

function preInstallRuleModules(rulesPath){
    logInfo('预安装规则文件依赖开始');
    preprocessModules(rulesPath)
    logInfo('预安装规则文件依赖结束\n');
}

function preInstallPluginModules(rulesPath){
    logInfo('预安装插件依赖开始');
    preprocessModules(rulesPath)
    logInfo('预安装插件依赖结束\n');
}

function preUninstallPluginModules(rulesPath){
    logInfo('预卸载插件依赖开始');
    preprocessModules(rulesPath,'uninstall')
    logInfo('预卸载插件依赖结束\n');
}
//预提取所有第三方模块
function preExtractModules(rulesPath){
    // 1. 读取规则文件内容
    const fileContent = fs.readFileSync(rulesPath, 'utf-8');
    logInfo('读取文件:',rulesPath);

    // 2. 提取所有 require 的模块名
    const dependencies = extractRequiredModules(fileContent);
    logDebug('提取所有依赖模块:', dependencies.join(', '));

    // 过滤需要的第三方模块
    const extractModules = filterInstallableModules(dependencies);
    logDebug('提取所有第三方模块:', extractModules.join(', '));

    return extractModules
}

// 工具函数：提取 require 模块名
function extractRequiredModules(content) {
    // 正则表达式优化：匹配 require('module') 或 require("module")
    const regex = /require\(\s*['"]([^'"]+)\s*['"]\)/g;
    const modules = new Set();

    content.replace(regex, function(match, key) {
        modules.add(key);
    });

    return Array.from(modules);
}

// 工具函数：过滤需要安装的模块
function filterInstallableModules(modules) {
    const coreModules = new Set(require('module').builtinModules);
    return modules.filter(module => {
        // 过滤核心模块和相对路径
        return (
            !coreModules.has(module) &&
            !module.startsWith('.') &&
            !module.startsWith('/')
        );
    });
}

// 工具函数：批量安装模块
function processModules(modules,param = 'install') {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    logInfo(`执行命令: npm ${param} ${modules.join(' ')} `);

    const result = spawnSync(npmCmd, [param, ...modules], {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        logError(`执行失败，退出码 ${result.status}`);
    }
}

module.exports = {
    preInstallRuleModules,
    preInstallPluginModules,
    preUninstallPluginModules
};