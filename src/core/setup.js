const fs = require('fs-extra');
const path = require('path');
const {setEnableLog,logStep} = require('../utils/log');
const {generateBasic} = require('./build');
const {createHostExamples} = require('./hosting');

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
        encodeInput,
        encodeOutput,
    }=options

    // 控制日志显示
    setEnableLog(!close) // 如果 close 为 true 则关闭日志

    //控制读取文件大小

    //控制读取文件编码方式

    //自动读取规则 核心
    generateBasic(input, output, rule)
}

/**
 * 用户快速示例
 * @returns {Promise<void>}
 */
async function demo(options={}) {
    // 1. 在宿主机创建示例文件
    await createHostExamples();

    build(options) // 直接使用 baseConfig 默认值
}

module.exports = {
    baseConfig,
    build,
    demo
};