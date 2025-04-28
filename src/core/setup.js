const fs = require('fs-extra');
const path = require('path');
const {setEnableLog,logStep} = require('../utils/log');
const {generateBasic} = require('./build');

const baseConfig = {
    input: path.join(process.cwd(), './examples/inputDir'),    // 默认输入目录
    output: path.join(process.cwd(), './examples/outputDir'), // 默认输出文件
    rule: path.join(process.cwd(), './examples/ruleDir/rule.js'), // 默认规则文件
    silent: false, // 从选项获取静默标志
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
        silent = baseConfig.silent, // 从选项获取静默标志
        encodeInput,
        encodeOutput,
    }=options

    // 控制日志显示
    setEnableLog(!silent) // 如果 silent 为 true 则关闭日志

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

// 新增函数：创建宿主机示例文件
async function createHostExamples() {
    // 宿主机示例目录路径
    const hostExampleDir= path.join(process.cwd(), './examples');

    // 源路径
    const sourcePath = path.join(__dirname, '../examples');

    // 调试信息（可选）
    logStep('资源来源路径:', sourcePath);
    logStep('虚拟文件系统检查:', await fs.pathExists(sourcePath));

    if (!(await fs.pathExists(sourcePath))) {
        throw new Error(`资源路径不存在，请检查打包配置: ${sourcePath}`);
    }

    try {
        // 强制创建目标目录
        await fs.ensureDir(hostExampleDir);

        // 同步复制目录（覆盖已存在文件）
        await copyVirtualDir(sourcePath, hostExampleDir);
        // await fs.copy(sourcePath , hostExampleDir, { overwrite: true });
        logStep(`示例文件已创建到：${hostExampleDir}\n`);
    } catch (error) {
        console.error('创建示例文件失败:', error.message);
        process.exit(1);
    }
}

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

module.exports = {
    baseConfig,
    build,
    demo
};