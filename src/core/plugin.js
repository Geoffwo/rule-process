const fs = require('fs');
const path = require('path');
const axios = require('axios');
const semver = require('semver');
const {logInfo, logPlugins,logError, logWarn} = require('../utils/log');
const {detectHostPlugin,createHostDir} = require('../utils/hosting');
const {validatePlugin} = require('../utils/validator');
const {astParseExportData} = require('../utils/ast');
const {preInstallPluginModules,preUninstallPluginModules} = require("../preprocess/modules");

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

//刷新插件注册表
function refreshPlugin(){
    //预处理自定义插件
    const pluginPaths = detectHostPlugin();
    //刷新注册表
    pluginSystem.refresh(pluginPaths)
}

/**
 * 加载插件 添加到注册表
 */
function loadPlugin() {
    //预处理自定义插件
    const pluginPaths = detectHostPlugin();

    if(pluginPaths.length === 0) {
        logWarn('未安装插件\n')
        return
    }

    logInfo('加载插件...');
    pluginPaths.forEach(pluginPath=>{
        //预安装插件依赖的npm
        preInstallPluginModules(pluginPath)
    })

    //刷新注册表
    refreshPlugin()
}

/**
 * 加载单个插件元数据
 */
function getPluginMetadata(pluginPath) {
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
        return getPluginMetadata(pluginPath)
    })

    logPlugins(plugins);
}

async function uninstallPlugins(plugins, options) {
    logInfo(`插件卸载开始`);

    if (plugins.length === 0) {
        logWarn('卸载全部插件');
        // 卸载全部插件
        const pluginPaths = detectHostPlugin();
        plugins = pluginPaths.map(url => path.basename(url, '.js'));
    }

    // 遍历所有插件
    for (const pluginSpec of plugins) {
        // 在宿主机下载插件
        await uninstallPlugin(pluginSpec, options);
    }

    // 卸载后刷新注册表
    refreshPlugin()

    logInfo(`插件卸载结束\n`);

}
async function uninstallPlugin(pluginName, options) {
    const force = options.force;//是否卸载插件依赖

    const pluginPaths = detectHostPlugin();// 步骤1：获取目标插件列表
    const targetPath = pluginPaths.find(url => path.basename(url, '.js') === pluginName);// 步骤2：查找目标插件文件
    if (!targetPath) {
        logWarn(`未找到插件: ${pluginName}`);
        return;
    }

    //预卸载插件依赖的npm
    force && preUninstallPluginModules(targetPath)

    // 步骤3：删除插件文件
    try {
        fs.unlinkSync(targetPath);
        logInfo(`插件 ${pluginName} 卸载成功`);
    } catch (err) {
        logError(`卸载插件失败: ${pluginName}\n${err.message}`);
    }
}

module.exports = {
    installPlugins,
    loadPlugin,
    listPlugin,
    uninstallPlugins
};