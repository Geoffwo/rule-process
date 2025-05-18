#!/usr/bin/env node
require('./interface/plugin'); // 确保初始化最先执行 插件系统挂载到全局

const path = require("path");
const { program } = require('commander')
const ruleProcess = require('./core/setup')
const {logError} = require('./utils/log')

const baseConfig =  ruleProcess.baseConfig // 基础配置

// 双击窗口显示帮助 isTTY是false
if (process.argv.length === 2) {
    console.log('请在命令行窗口（cmd/powershell/终端）中运行本工具！');
    console.log('如需查看帮助，请执行：rule-process -h');
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
    .option('-i, --input <pathUrl>', '输入路径', baseConfig.input)
    .option('-o, --output <pathUrl>', '输出路径', baseConfig.output)
    .option('-r, --rule <pathUrl>', '规则文件', baseConfig.rule)
    .option('-e, --exit', '关闭所有日志输出')
    .option('-s, --size <size>', '强制更改读取文件大小安全限制')
    .option('-c, --encode <encode>', '强制指定输入文件编码')
    .option('-l, --level <level>', '强制更改日志等级')
    .option('-p --parse <configUrl>', '解析配置文件')
    .action(async (options) => {
        try {
            const parseConfig = options.parse && require(path.join(process.cwd(), options.parse));
            const finalConfig = {
                ...parseConfig,  // 解析配置文件
                ...options // 命令行选项（最高优先级）
            };

            await ruleProcess.build(finalConfig);
        } catch (error) {
            logError('执行失败:', error.message);
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
           logError('默认构建失败:', error.message)
        }
    })

// 批量安装插件
program
    .command('install <plugins...>') // 接收多个参数
    .description('批量安装插件（示例：xlsx2json@1.0.0 csv-parser@latest）')
    .option('-s, --source <source>', '下载源（gitee/github）', 'gitee')
    .action(async (plugins, options) => {
        try {
            await ruleProcess.install(plugins, options)
        } catch (error) {
           logError('安装失败:', error.message);
        }
    });

// 批量安装插件
program
    .command('list') // 读取本地安装的插件
    .description('读取本地安装的插件')
    .action(() => {
        try {
            ruleProcess.list()
        } catch (error) {
           logError('读取失败:', error.message);
        }
    });

//批量卸载插件
program
    .command('uninstall [plugins...]') // 改为可选参数
    .description('卸载指定插件（不指定插件名时卸载全部）')
    .option('-f, --force', '强制删除关联的npm模块')
    .action(async (plugins, options) => {
        try {
            await ruleProcess.uninstall(plugins, options);
        } catch (error) {
            logError('卸载失败:', error.message);
        }
    });

// 统一错误处理
program.exitOverride(err => {
    if (err.code === 'commander.unknownCommand') {
        logError('未知命令\n使用 -h 查看帮助');
    }
});

program.parse(process.argv)
