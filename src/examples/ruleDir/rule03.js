const path = require("path");

async function* writingRules(inputArray, outputNodeTemplate, ctx) {
    const outputDir = outputNodeTemplate.path // 输出目录绝对路径
    const inputDir = path.join(outputDir, '../inputDir');

    // 逐份产出输出节点
    for (const name of ['demo_alpha', 'demo_beta', 'demo_gamma']) {
        ctx.log.info(`[process] yield 种子文件 -> ${inputDir}/${name}.txt`);
        yield [{
            ...outputNodeTemplate,
            path: inputDir,
            fileName: name,
            normExt: 'txt',
            content: `实例文件内容: ${name}\n`
        }];
    }

    // 拉取最新快照
    const input = ctx.refreshInput();
    const files = input.filter(item => item.name.startsWith('demo_'));
    ctx.log.info(`[process] refreshInput 拿到 ${files.length} 个文件: ${files.map(n => n.base).join(', ')}`);

    // 基于新快照产出汇总输出（全量重写 outputDir）
    yield [{
        ...outputNodeTemplate,
        fileName: 'summary',
        normExt: 'txt',
        content: `refreshInput 在 ${new Date().toISOString()} 拉取\n` +
            `inputDir 文件数: ${files.length}\n` +
            `文件: ${files.map(n => n.base).join(', ') || '(空)'}\n`
    }];

    // 拉取指定目录
    const output = ctx.refreshDir(outputDir);
    const result = output.filter(item => item.name.startsWith('summary'));
    ctx.log.info(`[process] refreshDir 拿到 ${result.length} 个文件: ${result.map(n => n.base).join(', ')}`);
}

module.exports = {
    name: 'demo03',
    version: '2.0.0',
    process: writingRules,
    description: 'ctx.refreshInput 拉模型示例：process yield 种子文件到 inputDir，落盘后拉取最新全量快照，再产出汇总输出'
};
