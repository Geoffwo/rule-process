const {logStep} = require('../utils/log');
const semver = require('semver');

class PluginSystem {
    constructor() {
        /**
         * 插件存储结构:
         * {
         *   'markdown-parser': {
         *     name: 'markdown-parser',
         *     version: '1.2.0',
         *     process: [Function],
         *     ...
         *   }
         * }
         */
        this.plugins = new Map();
    }

    /**
     * 注册插件（强制单版本）
     * @param {Object} plugin
     */
    register(plugin) {
        // 验证必要字段
        if (!plugin.name || !plugin.version || !plugin.process) {
            throw new Error('插件必须包含 name/version/process 字段');
        }

        // 验证版本格式
        if (!semver.valid(plugin.version)) {
            throw new Error(`无效的版本号: ${plugin.version}`);
        }

        // 存储插件
        this.plugins.set(plugin.name, plugin);
        logStep(`插件 ${plugin.name}@${plugin.version} 注册成功\n`);
    }

    /**
     * 获取插件处理器
     * @param {string} name
     */
    get(name) {
        if (!this.plugins.has(name)) {
            // 返回空处理器 + 警告日志
            throw new Error(`找不到插件: ${name}`);
        }
        return this.plugins.get(name).process;
    }
}

// 导出单例
module.exports = new PluginSystem(); // 直接导出实例