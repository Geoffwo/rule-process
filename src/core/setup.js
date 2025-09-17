const path = require('path');
const {setEnableLog,setLogLevel} = require('../utils/log');
const {generateBasic} = require('./build');
const {createHostExamples,createHostConfig,createHostRely,createHostPackage} = require('../utils/hosting');
const {setSize,setEncodeInput} = require('../utils/ruleRead');
const {preInstallRuleModules} = require('../preprocess/modules')
const {installPlugins,loadPlugin,listPlugin,uninstallPlugins} = require('./plugin');

const baseConfig = {
    input: path.join(process.cwd(), './examples/inputDir'),    // 默认输入目录
    output: path.join(process.cwd(), './examples/outputDir'), // 默认输出文件
    rule: path.join(process.cwd(), './examples/ruleDir/rule.js') // 默认规则文件
}

/**
 * 通用配置
 */
function config(options={}){
    const {
        display, // 从选项获取静默标志
        size,
        encode,
        level
    }=options

    // 控制日志显示
    setEnableLog(!display) // 如果 为 true 则关闭日志

    //设置日志等级
    setLogLevel(level)

    // 控制读取文件大小
    size > 0 && setSize(size);

    // 控制读取文件编码方式
    encode && setEncodeInput(encode);
}

/**
 * 构建
 * @param options
 */
async function build(options={}){
    const {
        input=baseConfig.input,
        output=baseConfig.output,
        rule=baseConfig.rule
    }=options

    //通用配置 处理option其他参数
    config(options)

    //预处理自定义插件
    loadPlugin()

    //预处理依赖
    preInstallRuleModules(rule)

    //自动读取规则 核心
    await generateBasic(input, output, rule)
}

/**
 * 用户快速示例
 * @returns {Promise<void>}
 */
async function init(options) {
    // 1. 在宿主机创建示例文件
    await createHostExamples();
    await createHostConfig(baseConfig);

    if(options.vosk){//是否涉及vosk功能专属模块
        const array=['vosk','ffi-napi','ref-napi','debug','ms','node-gyp-build','ref-struct-di']
        await createHostRely(array);
        const package={
            "dependencies": {
                "vosk": "^0.3.39"
            }
        }
        await createHostPackage(package);
    }

    if(options.run){//是否运行初始文件
        await build() // 直接使用 baseConfig 默认值
    }
}

/**
 * 用户下载插件
 * @returns {Promise<void>}
 */
async function install(plugins, options) {
    // 在宿主机下载插件
    await installPlugins(plugins,options)

    //预处理自定义插件
    loadPlugin()
}

function list(options){
    //获取插件列表
    listPlugin(options)
}

async function uninstall(plugins, options) {
    // 在宿主机下载插件
    await uninstallPlugins(plugins, options)
}


module.exports = {
    baseConfig,
    build,
    init,
    install,
    list,
    uninstall
};