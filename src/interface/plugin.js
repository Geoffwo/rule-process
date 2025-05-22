const {logVerbose,logPlugins,logError} = require('../utils/log');
const {validatePlugin} = require('../utils/validator');


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

    //反馈当前注册表信息
    pluginsLog(){
        const pluginsArray = Array.from(this.plugins.values());
        logPlugins(pluginsArray);
    }

    // 刷新注册表（核心方法）
    refresh(pluginArray){
        //清空当前注册表
        this.plugins.clear();


        //批量注册插件
        pluginArray.forEach(path=>{
            const plugin = require(path);
            this.register(plugin)
        })

        this.pluginsLog()
    }

    /**
     * 注册插件（强制单版本）
     * @param {Object} plugin
     */
    register(plugin) {
        //校验插件格式
        validatePlugin(plugin)

        // 存储插件
        this.plugins.set(plugin.name, plugin);
    }

    /**
     * 获取插件处理器
     * @param {string} name
     */
    get(name) {
        if (!this.plugins.has(name)) {
            // 返回空处理器 + 警告日志
            logError(`找不到插件: ${name}`);
        }
        return this.plugins.get(name).process;
    }
}

// 核心改动：全局初始化逻辑
(function initGlobalPluginSystem() {
    // 确保只初始化一次
    if (!global.__PLUGIN_SYSTEM_INITIALIZED__) {
        // 1. 创建插件系统实例
        const pluginSystem = new PluginSystem();

        // 2. 挂载到全局对象
        global.pluginSystem = pluginSystem;
        global.getPlugin = pluginSystem.get.bind(pluginSystem);

        // 3. 标记初始化状态
        global.__PLUGIN_SYSTEM_INITIALIZED__ = true;

        // 4. 记录日志
        // logVerbose('插件系统已挂载到全局\n');//无法根据指令控制日志等级，日志不记录
    }
})();

// 导出实例（保持原有模块兼容性）
module.exports = global.pluginSystem;