const path = require('path');
const {setEnableLog} = require('../utils/log');
const {generateBasic} = require('./build');
const {createHostExamples} = require('../utils/hosting');
const {setSize,setEncodeInput} = require('../utils/ruleRead');
const {preInstallRuleModules} = require('../preprocess/modules')
const {installPlugins,loadPlugin,listPlugin} = require('./plugin');

const baseConfig = {
    input: path.join(process.cwd(), './examples/inputDir'),    // 默认输入目录
    output: path.join(process.cwd(), './examples/outputDir'), // 默认输出文件
    rule: path.join(process.cwd(), './examples/ruleDir/rule.js') // 默认规则文件
}

/**
 * 构建
 * @param options
 */
function build(options={}){
    const {
        input=baseConfig.input,
        output=baseConfig.output,
        rule=baseConfig.rule,
        close, // 从选项获取静默标志
        size,
        encodeInput
    }=options

    // 控制日志显示
    setEnableLog(!close) // 如果 close 为 true 则关闭日志

    // 控制读取文件大小
    size > 0 && setSize(size);

    // 控制读取文件编码方式
    encodeInput && setEncodeInput(encodeInput);

    //预处理自定义插件
    loadPlugin()

    //预处理依赖
    preInstallRuleModules(rule)

    //自动读取规则 核心
    generateBasic(input, output, rule)
}

/**
 * 用户快速示例
 * @returns {Promise<void>}
 */
async function demo() {
    // 1. 在宿主机创建示例文件
    await createHostExamples();

    build() // 直接使用 baseConfig 默认值
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

function list(){
    //想要获取本地插件列表，需要先安装本地插件的npm模块
    listPlugin()
}


module.exports = {
    baseConfig,
    build,
    demo,
    install,
    list
};