const {logVerbose,logPlugins,logError, logWarn} = require('../utils/log');
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
        const valid = validatePlugin(plugin)

        if(!valid){
            logWarn(`已跳过 ${plugin.name} 的注册`);
            return
        }

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
            logError(`找不到插件: ${name}，请使用 rule-process install 《插件名》 安装 或 手动放入plugin目录`);
        }
        return this.plugins.get(name).process;
    }
}

// 插件系统单例：require 的模块缓存保证全局唯一实例；
// 消费方（core/plugin.js、core/build.js 的 ctx）一律显式 require 注入
module.exports = new PluginSystem();