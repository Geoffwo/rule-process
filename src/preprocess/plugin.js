const pluginSystem = require('../interface/plugin')
const {detectHostPlugin} = require('../core/hosting');
const {preprocessModules} = require('./modules');

// 主函数：预处理插件
function preprocessPlugins() {
    //预处理自定义插件
    const pluginArray = detectHostPlugin();
    pluginArray.forEach(path=>{
        //预处理插件依赖的npm
        preprocessModules(path)
    })

    pluginArray.forEach(path=>{
        //注册插件
        const plugin = require(path);
        pluginSystem.register(plugin)
    })

    // 在应用启动时挂载到 global
    // 绑定this到pluginSystem实例
    global.getPlugin = pluginSystem.get.bind(pluginSystem);
}

module.exports = {
    preprocessPlugins
};