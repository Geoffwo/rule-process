const path = require('path');
const fs = require('fs').promises; // 使用 promise 版本的 fs
const {setEnableLog,setLogLevel} = require('../utils/log');
const {generateBasic} = require('./build');
const {createHostExamples,createHostConfig,createHostRely,createHostPackage, loadRuleFiles} = require('../utils/hosting');
const {setSize,setEncodeInput} = require('../utils/ruleRead');
const {preInstallRuleModules} = require('../preprocess/modules')
const {installPlugins,loadPlugin,listPlugin,uninstallPlugins} = require('./plugin');

const baseConfig = {
    input: path.join(process.cwd(), './examples/inputDir'),    // 默认输入目录
    output: path.join(process.cwd(), './examples/outputDir'), // 默认输出文件
    rule: path.join(process.cwd(), './examples/ruleDir') // 默认规则文件
}

// 用于判断是否已初始化：检查 input 和 output 目录是否存在
async function isInitialized() {
    try {
        await fs.access(baseConfig.input);
        await fs.access(baseConfig.rule);
        return true;
    } catch {
        return false;
    }
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

    const ruleFiles = loadRuleFiles(rule);

    for (const ruleFile of ruleFiles) {
        //预处理依赖
        await preInstallRuleModules(ruleFile);

        //自动读取规则 核心
        await generateBasic(input, output, ruleFile);
    }
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

/**
 * 点击入口：根据初始化状态自动选择 init 或 build
 * @returns {Promise<void>}
 */
async function click() {
    const initialized = await isInitialized();
    if (!initialized) {
        console.log('首次运行，正在初始化项目...');
        const options={
            run:true
        }
        await init(options);
    } else {
        console.log('项目已初始化，开始构建...');
        await build();
    }
}


module.exports = {
    baseConfig,
    build,
    init,
    install,
    list,
    uninstall,
    click
};