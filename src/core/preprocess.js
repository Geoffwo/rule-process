const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { logStep } = require('../utils/log');
const { detectHostModule } = require('./hosting');

// 主函数：预处理依赖
function preprocessDependencies(rulesPath) {
    let installList = []; // 在函数顶部声明，初始化为空数组
    try {
        // 1. 读取规则文件内容
        const fileContent = fs.readFileSync(rulesPath, 'utf-8');
        logStep('规则文件读取成功');

        // 2. 提取所有 require 的模块名
        const dependencies = extractRequiredModules(fileContent);
        logStep('提取依赖模块:', dependencies.join(', '));

        // 3. 过滤需要安装的第三方模块
        installList = filterInstallableModules(dependencies);
        if (installList.length === 0) {
            logStep('无缺失依赖，跳过安装');
            return;
        }

        // 4. 批量安装缺失模块
        installModules(installList);
        logStep('依赖安装完成');

        // 5. 验证安装结果
        validateInstallation(installList);
        logStep('预处理成功，所有依赖已就绪');
    } catch (error) {
        logStep('预处理失败，请尝试手动安装:npm install -g ', installList.join(' '));
        process.exit(1);
    }
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
function installModules(modules) {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    logStep(`执行安装命令: npm install ${modules.join(' ')} `);

    const result = spawnSync(npmCmd, ['install', ...modules], {
        cwd: process.cwd(),
        stdio: 'inherit'
    });

    if (result.status !== 0) {
        throw new Error(`安装失败，退出码 ${result.status}`);
    }
}

// 工具函数：验证安装结果
function validateInstallation(modules) {
    modules.forEach(module => {
        const modulePath = path.join(process.cwd(), 'node_modules', module);
        if (!fs.existsSync(modulePath)) {
            throw new Error(`模块未正确安装: ${module}`);
        }
    });
}

module.exports = {
    preprocessDependencies
};