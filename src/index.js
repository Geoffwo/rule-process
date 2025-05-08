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

// 辅助函数：获取元数据
async function fetchMetadata(source) {
    const urls = {
        gitee: 'https://gitee.com/Geoffwo/rule-process-plugin/raw/master/metadata.json',
        github: 'https://raw.githubusercontent.com/Geoffwo/rule-process-plugin/master/metadata.json'
    };
    const response = await axios.get(urls[source]);
    return response.data;
}

// 辅助函数：获取最新版本
function getLatestVersion(versions) {
    const versionList = Object.keys(versions).sort((a, b) => semver.rcompare(a, b));
    return versionList[0];
}

// 辅助函数：更新已安装插件列表
async function updateInstalledPlugins(pluginName, version, source, installPath) {
    const installedPath = path.join(process.cwd(), 'plugin', 'installed.json');
    let installed = {};

    try {
        const data = await fs.readFile(installedPath, 'utf8');
        installed = JSON.parse(data);
    } catch (err) {
        // 文件不存在时创建
    }

    installed[pluginName] = { version, source, path: installPath };
    await fs.writeFile(installedPath, JSON.stringify(installed, null, 2));
}

// 修改 plugin install 子命令（其他部分保持不变）
program
    .command('install <plugin-spec>')
    .description('安装插件（示例：xlsx2json@1.0.0）')
    .option('-s, --source <source>', '下载源（gitee/github）', 'gitee')
    .action(async (pluginSpec, options) => {
        try {
            // 解析插件名称和版本
            const [pluginName, versionSpec] = pluginSpec.split('@');
            const requireVersion = versionSpec || 'latest';

            // 获取元数据
            const metadata = await fetchMetadata(options.source);
            if (!metadata[pluginName]) throw new Error('插件不存在');

            // 确定目标版本
            let targetVersion;
            if (requireVersion === 'latest') {
                targetVersion = getLatestVersion(metadata[pluginName].versions);
            } else {
                if (!metadata[pluginName].versions[requireVersion]) {
                    throw new Error(`版本 ${requireVersion} 不存在`);
                }
                targetVersion = requireVersion;
            }

            // 创建插件目录（保持原有逻辑）
            const pluginDir = path.join(process.cwd(), 'plugin', pluginName, targetVersion);
            await fs.mkdir(pluginDir, { recursive: true });

            // 下载插件（保持原有逻辑）
            const versionData = metadata[pluginName].versions[targetVersion];
            const pluginUrl = versionData[options.source];
            const pluginPath = path.join(pluginDir, 'index.js');
            const response = await axios.get(pluginUrl);
            await fs.writeFile(pluginPath, response.data);

            // 更新安装记录（保持原有逻辑）
            console.log(`✅ 插件 ${pluginName}@${targetVersion} 安装成功`);
        } catch (error) {
            console.error('❌ 安装失败:', error.message);
            process.exit(1);
        }
    });

// 统一错误处理
program.exitOverride(err => {
    if (err.code === 'commander.unknownCommand') {
        console.error('未知命令: %s\n 使用 -h 查看帮助', err.message);
    }
    process.exit(1);
});

program.parse(process.argv)