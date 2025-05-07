#!/usr/bin/env node
const path = require("path");
const { program } = require('commander')
const ruleProcess = require('./core/setup')

const baseConfig =  ruleProcess.baseConfig // 基础配置

// 双击窗口显示帮助 isTTY是false
if (process.argv.length === 2) {
    console.log('请在命令行窗口（cmd/powershell/终端）中运行本工具！');
    console.log('如需查看帮助，请执行：rule-process.exe -h');
    setTimeout(() => {
        process.exit(0)
    },3000); // 停留3秒
    return;
}

// 全局配置
program
    .name('rule-process')
    .description('高级规则处理系统')
    .version('1.0.0', '-v, --version','显示版本号')
    .option('--verbose', '显示详细日志')
    .configureHelp({ showGlobalOptions: true });

// 主命令：run
program
    .command('run')
    .description('执行规则处理（默认命令）')
    .option('-i, --input <path>', '输入路径', baseConfig.input)
    .option('-o, --output <path>', '输出路径', baseConfig.output)
    .option('-r, --rule <path>', '规则文件', baseConfig.rule)
    .option('-c, --close', '关闭所有日志输出')
    .option('-s, --size', '强制更改读取文件大小安全限制')
    .option('-ci, --encode-input <encoding>', '强制指定输入文件编码')
    .option('--js-config <path>', '解析JS配置文件')
    .action(async (options) => {
        try {
            const jsConfig = options.jsConfig && require(path.join(process.cwd(), options.jsConfig));
            const finalConfig = {
                ...jsConfig,  // JS配置
                ...options // 命令行选项（最高优先级）
            };

            await ruleProcess.build(finalConfig);
        } catch (error) {
            console.error('执行失败:', error.message);
            process.exit(1);
        }
    });

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

// 统一错误处理
program.exitOverride(err => {
    if (err.code === 'commander.unknownCommand') {
        console.error('未知命令: %s\n 使用 -h 查看帮助', err.message);
    }
    process.exit(1);
});

program.parse(process.argv)