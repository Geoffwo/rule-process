const fs = require('fs');
const { spawnSync } = require('child_process');
const { logInfo,logError, logWarn, logDebug} = require('../utils/log');
const { validateInstallModules,validateUninstallModules } = require('../utils/validator');
const { detectHostModule,detectHostDepend } = require('../utils/hosting');
const { astParseExportData } = require('../utils/ast');

// 主函数：预安装依赖
function preInstallModules(rulesPath) {
    let installList = []; // 在函数顶部声明，初始化为空数组
    try {
        // 1.读取文件
        const fileContent = fs.readFileSync(rulesPath, 'utf-8');
        logInfo('读取文件:',rulesPath);

        // 2.预提取当前页面所有第三方模块
        const extractModules = preExtractModules(fileContent);

        // 3.独立抽取的模块过滤方法
        const installModules = getFilteredInstallModules(extractModules)
        if (installModules.length === 0) {
            logWarn(`无缺失依赖，跳过 install`);
            return;
        }

        // 4.获取插件npm依赖的版本信息
        installList = installModulesVersion(fileContent,installModules);
        logDebug(`模块变更 install 版本:`, installList.join(', '));

        // 5.批量安装缺失模块
        processModules(installList,'install')
        logInfo('依赖处理完成');

        // 5.5 处理特定指令
        processExtraInfo(fileContent)

        // 6.验证安装结果
        validateInstallModules(installModules);
        logInfo('所有依赖已正确处理');
    } catch (error) {
        logError(`预处理失败，请尝试手动运行:npm install -g `, installList.join(' '));
    }
}

function processExtraInfo(fileContent){
    const plugin = astParseExportData(fileContent);
    if(plugin && plugin.command){//plugin.command是对象
        const commandArr = Object.keys(plugin.command);
        commandArr.forEach(command=>{
            const commandStr = plugin.command[command];
            processCommand(command,commandStr)
        })
        logInfo('特定指令处理完成');
    }
}

function preUninstallModules(rulesPath) {
    let installList = []; // 在函数顶部声明，初始化为空数组
    try {
        // 1.读取文件
        const fileContent = fs.readFileSync(rulesPath, 'utf-8');
        logInfo('读取文件:',rulesPath);

        // 2.预提取当前页面所有第三方模块
        const extractModules = preExtractModules(fileContent);

        // 3.独立抽取的模块过滤方法
        const installModules = getFilteredUninstallModules(extractModules)
        if (installModules.length === 0) {
            logWarn(`无缺失依赖，跳过 uninstall`);
            return;
        }

        // 4.获取插件npm依赖的版本信息
        installList = uninstallModulesDepend(fileContent,installModules);
        logDebug(`模块变更 uninstall 版本:`, installList.join(', '));

        // 5.批量安装缺失模块
        processModules(installList,'uninstall')
        logInfo('依赖处理完成');

        // 6.验证安装结果
        validateUninstallModules(installModules);
        logInfo('所有依赖已正确处理');
    } catch (error) {
        logError(`预处理失败，请尝试手动运行:npm ${action} -g `, installList.join(' '));
    }
}

// 独立抽取的模块过滤方法
function getFilteredInstallModules(extractModules) {
    return extractModules.filter(module => !detectHostModule(module,true));//不返回已安装的模块,检验全局插件
}

// 独立抽取的模块过滤方法
function getFilteredUninstallModules(extractModules) {
    return extractModules.filter(module => detectHostModule(module));//返回已安装的模块
}

function preInstallRuleModules(rulesPath){
    logInfo('预安装规则文件依赖开始');
    preInstallModules(rulesPath)
    logInfo('预安装规则文件依赖结束\n');
}

function preInstallPluginModules(rulesPath){
    logInfo('预安装插件依赖开始');
    preInstallModules(rulesPath)
    logInfo('预安装插件依赖结束\n');
}

function preUninstallPluginModules(rulesPath){
    logInfo('预卸载插件依赖开始');
    preUninstallModules(rulesPath,'uninstall')
    logInfo('预卸载插件依赖结束\n');
}
//预提取所有第三方模块
function preExtractModules(fileContent){

    // 1. 提取所有 require 的模块名
    const dependencies = extractRequiredModules(fileContent);
    logDebug('提取所有依赖模块:', dependencies.join(', '));

    // 2. 过滤需要的第三方模块
    const extractModules = filterInstallableModules(dependencies);
    logDebug('提取所有第三方模块:', extractModules.join(', '));

    return extractModules
}

function installModulesVersion(fileContent,extractModules){
    const plugin = astParseExportData(fileContent);

    return extractModules.map(item=>{
        const version = plugin.rely && plugin.rely[item];
        if (!version) {
            return `${item}@latest`; // 默认策略
        }
        return `${item}@${version}`;
    })
}

function uninstallModulesDepend(fileContent,extractModules){
    //排除系统依赖，不允许删除
    const depend = detectHostDepend();
    const modules = Object.keys(depend);//定义系统依赖
    return extractModules.map(item=>{
        if (!modules.includes(item)) {
            return item; // 默认策略
        }
        return null
    }).filter(Boolean)
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
function processCommand(command,commandStr) {
    logInfo(`执行命令: ${command} ${commandStr} `);

    const result = spawnSync(command, [commandStr], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.platform === 'win32', // Windows 必须启用 shell, shell 会自动移除引号
        windowsVerbatimArguments: process.platform === 'win32' // 保留参数原始格式 参数会原样传递，保留引号
    });

    if (result.status !== 0) {
        logError(`执行失败，退出码 ${result.status}`);
    }
}

// 工具函数：批量安装模块
function processModules(modules,param = 'install') {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    logInfo(`执行命令: npm ${param} ${modules.join(' ')} `);

    const result = spawnSync(npmCmd, [param, ...modules], {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.platform === 'win32', // Windows 必须启用 shell, shell 会自动移除引号
        windowsVerbatimArguments: process.platform === 'win32' // 保留参数原始格式 参数会原样传递，保留引号
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