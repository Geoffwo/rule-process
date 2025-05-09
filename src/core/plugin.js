const fs = require('fs');
const path = require('path');
const axios = require('axios');
const semver = require('semver');
const {logInfo, logPlugins,logError} = require('../utils/log');
const {detectHostPlugin,createHostDir} = require('../utils/hosting');
const {validatePlugin} = require('../utils/validator');
const {astParseExportData} = require('../utils/ast');
const {preInstallModules} = require("../preprocess/modules");

async function installPlugins(plugins, options) {
    logInfo(`插件安装开始`);
    // 遍历所有插件
    for (const pluginSpec of plugins) {
        // 在宿主机下载插件
        await installPlugin(pluginSpec, options);
    }
    logInfo(`插件安装结束\n`);
}
async function installPlugin(pluginSpec, options) {
    // 解析插件名称和版本
    const [pluginName, versionSpec] = pluginSpec.split('@');
    const requireVersion = versionSpec || 'latest';
    const source = options.source;//数据源: gitee/github

    // 获取元数据
    const metadata = await fetchMetadata(source);
    if (!metadata[pluginName]) logError('插件不存在');

    // 确定目标版本
    let targetVersion;
    if (requireVersion === 'latest') {
        targetVersion = getLatestVersion(metadata[pluginName].versions);
    } else {
        if (!metadata[pluginName].versions[requireVersion]) {
            logError(`版本 ${requireVersion} 不存在`);
        }
        targetVersion = requireVersion;
    }

    // 插件本地存储地址
    const pluginPath = path.join(process.cwd(), 'plugin', `${pluginName}.js`);
    const pluginDir = path.dirname(pluginPath);// 获取父目录
    createHostDir(pluginDir)// 确保父目录存在

    // 下载插件（保持原有逻辑）
    const versionData = metadata[pluginName].versions[targetVersion];
    const pluginUrl = versionData[source];
    const response = await axios.get(pluginUrl);
    fs.writeFileSync(pluginPath, response.data);//默认覆盖写

    // 更新安装记录（保持原有逻辑）
    logInfo(`插件 ${pluginName}@${targetVersion} 安装成功`);
}

// 辅助函数：获取元数据
async function fetchMetadata(source) {
    const urls = {
        gitee: 'https://gitee.com/Geoffwo/rule-process-plugin/raw/master/metadata.json',
        github: 'https://raw.githubusercontent.com/Geoffwo/rule-process-plugin/master/metadata.json'
    };
    const response = await axios.get(urls[source]);
    return response.data;
}

// 辅助函数：获取最新版本
function getLatestVersion(versions) {
    const versionList = Object.keys(versions).sort((a, b) => semver.rcompare(a, b));
    return versionList[0];
}

/**
 * 加载插件 添加到注册表
 */
function loadPlugin() {
    //预处理自定义插件
    const pluginPaths = detectHostPlugin();
    pluginPaths.forEach(pluginPath=>{
        //预安装插件依赖的npm
        preInstallModules(pluginPath)
    })

    //刷新注册表
    pluginSystem.refresh(pluginPaths)
}

/**
 * 加载单个插件元数据
 */
function loadPluginMetadata(pluginPath) {
    // 读取文件内容
    const code = fs.readFileSync(pluginPath, 'utf-8');

    // 解析元数据
    const plugin = astParseExportData(code);

    //校验插件格式
    validatePlugin(plugin)

    return {
        name: plugin.name,
        version: plugin.version,
        process: plugin.process
    };
}


/**
 * 获取本地插件信息，不加载插件
 */
function listPlugin() {
    //预处理自定义插件
    const pluginPaths = detectHostPlugin();

    const plugins = pluginPaths.map(pluginPath=>{
        return loadPluginMetadata(pluginPath)
    })

    logPlugins(plugins);
}


module.exports = {
    installPlugins,
    loadPlugin,
    listPlugin
};