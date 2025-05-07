const fs = require('fs-extra');
const path = require('path');
const { spawnSync,spawn } = require('child_process');
const {logStep} = require('../utils/log');


// 新增函数：创建宿主机示例文件
async function createHostExamples() {
    // 宿主机示例目录路径
    const hostExampleDir= path.join(process.cwd(), './examples');

    // 源路径
    const sourcePath = path.join(__dirname, '../examples');

    // 调试信息（可选）
    logStep('资源来源路径:', sourcePath);
    logStep('虚拟文件系统检查:', await fs.pathExists(sourcePath));

    if (!(await fs.pathExists(sourcePath))) {
        throw new Error(`资源路径不存在，请检查打包配置: ${sourcePath}`);
    }

    try {
        // 强制创建目标目录
        await fs.ensureDir(hostExampleDir);

        // 同步复制目录（覆盖已存在文件）
        await copyVirtualDir(sourcePath, hostExampleDir);
        // await fs.copy(sourcePath , hostExampleDir, { overwrite: true });
        logStep(`示例文件已创建到：${hostExampleDir}\n`);
    } catch (error) {
        console.error('创建示例文件失败:', error.message);
        process.exit(1);
    }
}

async function copyVirtualDir(source, target) {
    const files = await fs.readdir(source);
    for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);
        const stats = await fs.stat(sourcePath);
        if (stats.isDirectory()) {
            await fs.ensureDir(targetPath);
            await copyVirtualDir(sourcePath, targetPath);
        } else {
            const content = await fs.readFile(sourcePath);
            await fs.outputFile(targetPath, content);
        }
    }
}

//检测宿主环境项目的node_modules
function detectHostModule(moduleName) {

    // 方案1: 优先检测宿主环境项目的node_modules
    const hostNodeModules = path.join(process.cwd(), 'node_modules');
    const hostModulePath = path.join(hostNodeModules, moduleName);
    if (fs.existsSync(hostModulePath)) {
        logStep(`检测到本地存在[${moduleName}]模块`)
        return true;
    }

    // 方案2: 检测全局安装的模块（可选）
    const globalPaths = require('module').globalPaths;
    for (const globalPath of globalPaths) {
        const globalModulePath = path.join(globalPath, moduleName);
        if (fs.existsSync(globalModulePath)) {
            logStep(`检测到全局存在[${moduleName}]模块`)
            return true;
        }
    }
}
module.exports = {
    createHostExamples,
    detectHostModule
};