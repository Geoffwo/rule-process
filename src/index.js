#!/usr/bin/env node
const { program } = require('commander')
const ruleProcess = require('./core/setup')

// 双击窗口显示帮助 isTTY是false
if (process.argv.length === 2) {
    console.log('请在命令行窗口（cmd/powershell/终端）中运行本工具！');
    console.log('如需查看帮助，请执行：rule-process.exe -h');
    setTimeout(() => {
        process.exit(0)
    },3000); // 停留3秒
    return;
}

// 基础配置
const baseConfig =  ruleProcess.baseConfig

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
    .option('-c, --close', '关闭所有日志输出')
    .option('-s, --size', '强制更改读取文件大小安全限制')
    .option('-ci, --encode-input <encoding>', '强制指定输入文件编码')
    .option('-co, --encode-output <encoding>', '强制指定输出文件编码')
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
    .addHelpText('after', '\n注释说明:\n  该命令会强制覆盖examples目录下的文件\n  适用于首次使用或重置演示案例') // 添加子命令注释
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
    .addHelpText('after', '\n注释说明:\n  运行前请确保已通过demo命令生成示例文件') // 添加子命令注释
    .action(() => {
        try {
            ruleProcess.build() // 直接使用 宿主机文件  baseConfig 默认值
        } catch (error) {
            console.error('默认构建失败:', error.message)
            process.exit(1)
        }
    })

program.parse(process.argv)