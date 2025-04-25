#!/usr/bin/env node
const { program } = require('commander')
const ruleProcess = require('./main')

// 基础配置
const baseConfig =  ruleProcess.baseConfig

// 新增参数检查逻辑（仅在无参数时触发）
if (process.argv.length === 2) {
  program.help({ error: true }) // 强制显示帮助信息
  process.exit(0)
}

program
    .name('rule-process') // 设置帮助信息中的名称
    .description('高级规则处理系统,建议全局安装')
    .version(
        '1.0.0',
        '-v, --version', // 添加-v别名
        '显示版本号'
    )
    // .argument('[input]', '输入路径', defaultConfig.input)
    .option('-i, --input <path>', '输入路径', baseConfig.input)
    .option('-o, --output <path>', '输出路径', baseConfig.output)
    .option('-r, --rule <path>', '规则文件', baseConfig.rule)
    .action(async (cmdOptions) => {
        try {
            ruleProcess.build(cmdOptions) // 使用用户提供的参数
        } catch (error) {
            console.error('指令构建失败:', error.message)
            process.exit(1)
        }
    })

// 新增默认构建指令
program
    .command('demo') // 子命令名称
    .description('使用默认配置快速构建演示案例，会直接覆盖examples文件')
    .action(async () => {
        try {
            await ruleProcess.demo()
        } catch (error) {
            console.error('默认构建失败:', error.message)
            process.exit(1)
        }
    })

// 新增默认构建指令
program
    .command('build') // 子命令名称
    .description('使用演示案例目录结构快速运行，直接运行examples目录文件')
    .action(() => {
        try {
            ruleProcess.build() // 直接使用 宿主机文件  baseConfig 默认值
        } catch (error) {
            console.error('默认构建失败:', error.message)
            process.exit(1)
        }
    })

program.parse(process.argv)