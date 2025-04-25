#!/usr/bin/env node
const { program } = require('commander')
const ruleProcess = require('./main')
const path = require('path');
const fs = require('fs-extra'); // 需要安装 fs-extra

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

async function copyVirtualDir(source, target) {
    const files = await fs.readdir(source);
    for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);
        const stats = await fs.stat(sourcePath);
        if (stats.isDirectory()) {
            await fs.ensureDir(targetPath);
            await copyVirtualDir(sourcePath, targetPath);
        } else {
            const content = await fs.readFile(sourcePath);
            await fs.outputFile(targetPath, content);
        }
    }
}

// 新增函数：创建宿主机示例文件
async function createHostExamples() {
    // 宿主机示例目录路径
    const hostExampleDir = path.join(process.cwd(), './examples');

    // 源路径
    const sourcePath  = path.join(__dirname, '../examples');

    // 调试信息（可选）
    console.log('[DEBUG] 资源来源路径:', sourcePath);
    console.log('[DEBUG] 虚拟文件系统检查:', await fs.pathExists(sourcePath));

    if (!(await fs.pathExists(sourcePath))) {
        throw new Error(`资源路径不存在，请检查打包配置: ${sourcePath}`);
    }

    try {
        // 强制创建目标目录
        await fs.ensureDir(hostExampleDir);

        // 同步复制目录（覆盖已存在文件）
        await copyVirtualDir(sourcePath, hostExampleDir);
        // await fs.copy(sourcePath , hostExampleDir, { overwrite: true });
        console.log(`示例文件已创建到：${hostExampleDir}\n`);
    } catch (error) {
        console.error('创建示例文件失败:', error.message);
        process.exit(1);
    }
}

// 新增默认构建指令
program
    .command('demo') // 子命令名称
    .description('使用默认配置快速构建演示案例，会直接覆盖examples文件')
    .action(async () => {
        // 1. 在宿主机创建示例文件
        await createHostExamples();

        try {
            ruleProcess.build(baseConfig) // 直接使用 baseConfig 默认值
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
            ruleProcess.build(baseConfig) // 直接使用 宿主机文件  baseConfig 默认值
        } catch (error) {
            console.error('默认构建失败:', error.message)
            process.exit(1)
        }
    })

program.parse(process.argv)