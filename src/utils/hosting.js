const fs = require('fs');
const path = require('path');
const ini = require('ini');
const {logInfo,logError, logDebug} = require('./log');
const {globalPaths} = require("module");

// 新增配置文件加载函数
function loadHostConfig(pathUrl,baseConfig) {
    const configPath =  pathUrl || path.join(process.cwd(), './config.ini');
    const ext = path.extname(configPath).toLowerCase();

    if (!fs.existsSync(configPath)) {
        createHostConfig(baseConfig)
        return baseConfig
    }

    try {
        if (ext === '.js') {
            return require(configPath);
        } else if (ext === '.ini') {
            const content = fs.readFileSync(configPath, 'utf8');
            return ini.parse(content);
        } else {
            logError(`不支持的配置文件格式: ${ext}`);
        }
    } catch (error) {
        logError(`配置文件解析失败: ${error.message}`);
    }
}

async function createHostConfig(baseConfig) {
    // 宿主机示例目录路径
    const hostExampleDir= path.join(process.cwd(), './config.ini');

    const config={
        ...baseConfig
    }
    const iniContent = ini.stringify(config);//生成INI
    try {
        // 确保父目录存在
        const parentDir = path.dirname(hostExampleDir);
        createHostDir(parentDir)

        // 同步复制目录（覆盖已存在文件）
        fs.writeFileSync(hostExampleDir, iniContent);
        logInfo(`配置文件已创建到：${hostExampleDir}\n`);
    } catch (error) {
        logError('配置文件创建失败:', error.message);
    }
}

async function createHostRely(modeNameArray=[]) {
    for (let i = 0; i < modeNameArray.length; i++) {
        const item=modeNameArray[i]
        // 宿主机示例目录路径
        const hostExampleDir= path.join(process.cwd(), './node_modules/',item);
        console.log('hostExampleDir',hostExampleDir);

        // 源路径
        const sourcePath = path.join(__dirname, '../../node_modules/',item);
        console.log('sourcePath',sourcePath);

        const sourcePathExists = fs.existsSync(sourcePath)
        // 调试信息（可选）
        logDebug('依赖来源路径:', sourcePath);
        logDebug('虚拟文件系统检查:', sourcePathExists);

        if (!sourcePathExists) {
            logError(`依赖路径不存在，请检查打包配置: ${sourcePath}`);
        }

        try {
            // 确保父目录存在
            createHostDir(hostExampleDir)

            // 同步复制目录（覆盖已存在文件）
            await copyVirtualDir(sourcePath, hostExampleDir);
            logInfo(`依赖文件已创建到：${hostExampleDir}\n`);
        } catch (error) {
            logError('创建依赖文件失败:', error.message);
        }
    }
}

async function createHostPackage(packageObj) {
    // 宿主机示例目录路径
    const hostExampleDir= path.join(process.cwd(), './');

    // 2. 创建配置文件路径
    const configPath = path.join(hostExampleDir, 'package.json');

    // 同步复制目录（覆盖已存在文件）
    fs.writeFileSync(configPath, JSON.stringify(packageObj,null,2));
    logInfo(`配置文件已创建到：${hostExampleDir}\n`);
}


// 新增函数：创建宿主机示例文件
async function createHostExamples() {
    // 宿主机示例目录路径
    const hostExampleDir= path.join(process.cwd(), './examples');

    // 源路径
    const sourcePath = path.join(__dirname, '../examples');

    const sourcePathExists = fs.existsSync(sourcePath)
    // 调试信息（可选）
    logDebug('资源来源路径:', sourcePath);
    logDebug('虚拟文件系统检查:', sourcePathExists);

    if (!sourcePathExists) {
        logError(`资源路径不存在，请检查打包配置: ${sourcePath}`);
    }

    try {
        // 确保父目录存在
        createHostDir(hostExampleDir)

        // 同步复制目录（覆盖已存在文件）
        await copyVirtualDir(sourcePath, hostExampleDir);
        // await fs.copy(sourcePath , hostExampleDir, { overwrite: true });
        logInfo(`示例文件已创建到：${hostExampleDir}\n`);
    } catch (error) {
        logError('创建示例文件失败:', error.message);
    }
}

function copyVirtualDir(source, target) {
    // 读取目录内容（同步）
    const files = fs.readdirSync(source);

    for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        // 获取文件信息（同步）
        const stats = fs.statSync(sourcePath);

        if (stats.isDirectory()) {
            createHostDir(targetPath); // 假设这是同步方法

            // 递归拷贝子目录（同步）
            copyVirtualDir(sourcePath, targetPath);
        } else {
            // 读取文件内容（同步）
            const content = fs.readFileSync(sourcePath);

            // 写入文件（同步，自动创建目录）
            fs.writeFileSync(targetPath, content);
        }
    }
}

//检测宿主环境项目的node_modules
function detectHostModule(moduleName,isCheckGlobal = false) {

    // 方案1: 优先检测宿主环境项目的node_modules
    const hostNodeModules = path.join(process.cwd(), 'node_modules');
    const hostModulePath = path.join(hostNodeModules, moduleName);
    if (fs.existsSync(hostModulePath)) {
        logDebug(`检测到本地存在[${moduleName}]模块`)
        return true;
    }

    // 方案2: 检测全局安装的模块（可选）
    if(isCheckGlobal){
        for (const globalPath of globalPaths) {
            const globalModulePath = path.join(globalPath, moduleName);
            if (fs.existsSync(globalModulePath)) {
                logDebug(`检测到全局存在[${moduleName}]模块`)
                return true;
            }
        }
    }
}

function detectHostDepend(){
    const sourcePath = path.join(process.cwd(), 'package.json');
    const content = fs.readFileSync(sourcePath,'utf8');
    const parseJson = JSON.parse(content);
    return parseJson.devDependencies;
}

function detectHostPlugin(){
    const hostDir = detectHostDir('plugin');
    return hostDir.filter(path=>path.endsWith('.js'));
}

//检测宿主环境项目的插件（目录）
function detectHostDir(dir) {
    // 检测宿主环境项目的插件目录
    const hostDir = path.join(process.cwd(), dir);
    const filePaths = []

    if (!fs.existsSync(hostDir)) {
        return filePaths;
    }

    const files = fs.readdirSync(hostDir);
    for (const file of files) {
        const filePath = path.join(hostDir, file);
        try {
            filePaths.push(filePath);
        } catch (error) {
            logError(`${file} 加载失败:`, error.message);
        }
    }

    return filePaths;
}

function createHostDir(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}

/**
 * 加载规则文件（最小MVP）
 * @param {string} rulePath - 规则文件绝对路径 / 规则目录绝对路径
 * @returns {string[]} 对应目录下排序后的所有.js规则文件绝对路径数组
 */
function loadRuleFiles(rulePath) {
    // 1. 基础校验：入参为空/路径不存在直接返回空数组
    if (!rulePath || !fs.existsSync(rulePath)) return [];

    try {
        // 2. 确定目标目录（文件→取父目录，目录→直接用）
        const stat = fs.statSync(rulePath);
        const targetDir = stat.isFile() ? path.dirname(rulePath) : rulePath;

        // 3. 读取目录+筛选.js文件+转绝对路径
        const jsFiles = fs.readdirSync(targetDir)
            // 筛选.js文件
            .filter(file => file.endsWith('.js'))
            // 转为绝对路径
            .map(file => path.resolve(targetDir, file))
            // 按文件名排序（升序）
            .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

        logInfo(`加载规则文件:${jsFiles.length}个`)

        return jsFiles;
    } catch (err) {
        // 异常兜底：任何错误都返回空数组
        logError('加载规则文件失败:', err.message);
        return [];
    }
}

module.exports = {
    createHostExamples,
    createHostDir,
    detectHostModule,
    detectHostDepend,
    detectHostPlugin,
    loadHostConfig,
    createHostConfig,
    createHostRely,
    createHostPackage,
    loadRuleFiles,
};