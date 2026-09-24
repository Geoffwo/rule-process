#!/usr/bin/env node
require('./interface/plugin'); // 确保初始化最先执行 插件系统挂载到全局

const path = require("path");
const { program } = require('commander')
const ruleProcess = require('./core/setup')
const {loadHostConfig} = require('./utils/hosting')
const {logError} = require('./utils/log')
const { startServer } = require('./core/web');

const baseConfig =  ruleProcess.baseConfig // 基础配置

// ===== 第一步：判断是否为“双击”或“无参数调用” =====
function isInteractiveLaunch() {
    // 情况1: 完全没有参数（node script.js）
    if (process.argv.length <= 2) return true;

    // 情况2: 只有一个选项，且不是已知命令（防误判）
    const args = process.argv.slice(2);
    const knownCommands = ['run', 'init', 'install', 'list', 'uninstall', 'web', '-h', '--help', '-v', '--version'];

    // 如果第一个参数不是已知命令，则可能是误操作或双击
    return !args.some(arg => knownCommands.includes(arg));
}

// 判断当前进程是否由终端（CMD / PowerShell）启动：
// - 在 CMD / PowerShell 中敲命令启动 → 父进程为 cmd.exe / powershell.exe → 视为“终端” → 进入 TUI 菜单
// - 双击 exe 启动 → 父进程为 explorer.exe → 视为“非终端” → 进入引导向导
function isLaunchedFromTerminal() {
    if (process.platform !== 'win32') {
        return !!process.stdin.isTTY; // 非 Windows 平台回退到原 isTTY 行为
    }

    try {
        const ppid = process.ppid;
        if (!ppid) return false;

        const out = require('child_process')
            .execSync(`tasklist /fi "PID eq ${ppid}" /nh`, { windowsHide: true })
            .toString();

        //双击explorer.exe，其他一般是cmd之类的
        return /\b(cmd\.exe|powershell\.exe|pwsh\.exe)\b/i.test(out);
    } catch (e) {
        return false; // 探测失败保守走向导
    }
}

// 无参数或未知首参时进入交互入口：
// - 终端环境（CMD / PowerShell）→ 交互式 TUI 菜单
// - 双击 exe（非终端）→ 引导向导模式
if (isInteractiveLaunch()) {
    if (isLaunchedFromTerminal()) {
        // 交互式 TUI（由终端启动）
        require('./interface/tui').runTui()
            .then(() => process.exit(0))
            .catch(err => logError('TUI 执行失败:', err.message || err));
    } else {
        // 如果是双击启动（非终端调用或无参数）
        console.log('欢迎使用 Rule Process 工具！');
        console.log('请在终端中运行本工具以获得完整功能。');
        console.log('例如：rule-process -h 查看帮助');
        console.log('\n即将以向导模式启动...（3秒后开始初始化）\n');

        setTimeout(async () => {
            try {
                // 使用 IIFE 包裹异步操作
                await (async () => {
                    await ruleProcess.click(); // 调用 click，内部判断是 init 还是 build
                })();
            } catch (error) {
                logError('向导模式启动失败:', error.message);
            } finally {
                // 延迟退出，让用户看到结果
                console.log('\n向导模式结束...（3秒后关闭）\n');
                setTimeout(() => process.exit(0), 3000);
            }
        }, 3000);
    }

    // 重要：提前返回，避免后续 parse 再次触发命令
    return;
}

// ===== 第二步：正常 CLI 模式，开始定义命令 =====

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
    .option('-i, --input <pathUrl>', '输入路径')
    .option('-o, --output <pathUrl>', '输出路径')
    .option('-r, --rule <pathUrl>', '规则文件')
    .option('-d, --display', '关闭所有日志输出')
    .option('-s, --size <size>', '强制更改读取文件大小安全限制')
    .option('-e, --encode <encode>', '强制指定输入文件编码')
    .option('-l, --level <level>', '强制更改日志等级')
    .option('-c --config <configUrl>', '解析配置文件')
    .action(async (options) => {
        try {
            const parseConfig = loadHostConfig(options.config,baseConfig);
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
    .command('init') // 子命令名称
    .description('使用默认配置快速构建演示案例，会直接覆盖examples文件')
    .option('-r, --run', '构建完成后自动运行演示案例')// 只要输入 --run标志 不需要参数，注释所有的入参都会被转换为字符串
    .action(async (options) => {
        try {
            await ruleProcess.init(options)
        } catch (error) {
           logError('默认构建失败:', error.message)
        }
    })

// HTTP 服务指令：将规则处理能力通过 HTTP 接口暴露
program
    .command('web')
    .description('启动 HTTP 服务，通过接口触发规则处理')
    .option('-p, --port <port>', '端口号', '3000')
    .option('-H, --host <host>', '主机地址', 'localhost')
    .option('-c --config <configUrl>', '解析配置文件')
    .action(async (options) => {
        try {
            startServer({
                port: parseInt(options.port, 10),
                host: options.host,
                config: options.config
            });
        } catch (error) {
            logError('HTTP 服务启动失败:', error.message);
        }
    });

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
    .description('读取插件列表')
    .option('-t, --type <type>', '读取类型 本地库(local)/插件库(remote)','local')
    .option('-s, --source <source>', '下载源 国内(gitee)/国外(github)', 'gitee')
    .action((options) => {
        try {
            ruleProcess.list(options)
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
