async function* writingRules(inputArray, outputNodeTemplate, ctx) {
    // 1. 获取插件处理器（找不到插件时引擎 logError 终止）
    const upperCase = ctx.getPlugin('upperCase');

    // 2. 过滤可处理的文本节点
    const textNodes = inputArray.filter(n => !n.isDirectory && n.normExt === 'txt');
    if (textNodes.length === 0) {
        ctx.logWarn('没有可处理的 .txt 输入文件');
        return;
    }

    // 3. 逐个经插件加工后产出
    for (const node of textNodes) {
        ctx.logInfo(`插件加工: ${node.base}`);
        yield [{
            ...outputNodeTemplate,
            fileName: `${node.name}_upper`,
            normExt: 'txt',
            content: upperCase(node.content)
        }];
    }
}

module.exports = {
    name: 'demo04',
    version: '1.0.0',
    process: writingRules,
    description: 'ctx.getPlugin 示例：经插件处理器把 .txt 输入转为大写，产出 *_upper.txt'
};
