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
        // 提取npm依赖
        installList = preExtractModules(rulesPath);
        if (installList.length === 0) {
            logWarn('无缺失依赖，跳过安装');
            return;
        }

        // 批量安装缺失模块
        processModules(installList,action)
        logInfo('依赖安装完成');

        // 验证安装结果
        validateModules(installList, action);
        logInfo('所有依赖已就绪');
    } catch (error) {
        logError(`预处理失败，请尝试手动安装:npm ${action} -g `, installList.join(' '));
    }
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
//预提取依赖
function preExtractModules(rulesPath){
    let installList = []; // 在函数顶部声明，初始化为空数组
    // 1. 读取规则文件内容
    const fileContent = fs.readFileSync(rulesPath, 'utf-8');
    logInfo('读取文件:',rulesPath);

    // 2. 提取所有 require 的模块名
    const dependencies = extractRequiredModules(fileContent);
    logDebug('提取依赖模块:', dependencies.join(', '));

    // 3. 过滤需要安装的第三方模块
    installList = filterInstallableModules(dependencies);

    return installList
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
            !module.startsWith('/') &&
            !detectHostModule(module) //检测已安装的模块
        );
    });
}

// 工具函数：批量安装模块
function processModules(modules,param = 'install') {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    logInfo(`执行安装命令: npm install ${modules.join(' ')} `);

    const result = spawnSync(npmCmd, [param, ...modules], {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        logError(`安装失败，退出码 ${result.status}`);
    }
}

module.exports = {
    preInstallRuleModules,
    preInstallPluginModules,
    preUninstallPluginModules
};