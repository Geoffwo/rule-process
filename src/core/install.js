const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const semver = require('semver');
const {logStep} = require('../utils/log');

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

//确保目录存在
function ensureDirectory(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}

async function install(pluginSpec,options) {
    // 解析插件名称和版本
    const [pluginName, versionSpec] = pluginSpec.split('@');
    const requireVersion = versionSpec || 'latest';
    const source = options.source;//数据源: gitee/github

    // 获取元数据
    const metadata = await fetchMetadata(source);
    if (!metadata[pluginName]) throw new Error('插件不存在');

    // 确定目标版本
    let targetVersion;
    if (requireVersion === 'latest') {
        targetVersion = getLatestVersion(metadata[pluginName].versions);
    } else {
        if (!metadata[pluginName].versions[requireVersion]) {
            throw new Error(`版本 ${requireVersion} 不存在`);
        }
        targetVersion = requireVersion;
    }

    // 插件本地存储地址
    const pluginPath = path.join(process.cwd(), 'plugin', `${pluginName}@${targetVersion}.js`);
    const pluginDir = path.dirname(pluginPath);// 获取父目录
    ensureDirectory(pluginDir)// 确保父目录存在

    // 下载插件（保持原有逻辑）
    const versionData = metadata[pluginName].versions[targetVersion];
    const pluginUrl = versionData[source];
    const response = await axios.get(pluginUrl);
    fs.writeFileSync(pluginPath, response.data);//默认覆盖写

    // 更新安装记录（保持原有逻辑）
    logStep(` 插件 ${pluginName}@${targetVersion} 安装成功`);
}

module.exports = {
    install
};