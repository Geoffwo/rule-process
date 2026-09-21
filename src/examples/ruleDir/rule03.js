/**
 * 规则：watch 最简示例（yield 向 inputDir 写入 + 监听全量快照）
 * ============================================================================
 * 演示一条完整链路：
 *   1. process 是生成器，用 yield 把实例文件写到 inputDir
 *      —— 引擎把它们落盘后，inputDir 内容变化，触发 watch
 *   2. watch 被调用，引擎把【全量】inputArray 递进来
 *   3. watch 只接收快照、更新模块级引用并打印日志（不产出、不做判断）
 *
 * 关键约定：
 *   - 与 process 同源：watch 拿到的 inputArray 和 process 完全同构（同 getInputArray）
 *   - 全量快照：每次变化重算整个 inputDir，不做差量
 *   - watch 返回值被引擎忽略
 * ============================================================================
 */
const path = require("path");

// ★ 模块级状态：require 缓存保证常驻进程中只初始化一次
let currentInputArray = [];   // 最近一次输入快照（全量）

/**
 * 订阅回调：inputDir 变化时被引擎调用
 * @param {Array} inputArray - 全量输入快照（与 process 同源）
 * @param {Object} outputNodeTemplate - 输出节点模板
 */
function onInputChanged(inputArray, outputNodeTemplate) {
    // 唯一职责：接收最新快照并更新模块级引用
    currentInputArray = inputArray;

    const files = inputArray.filter(item => !item.isDirectory);
    console.log('[watch] 检测到 inputDir 变化，全量 inputArray 已更新');
    console.log(`[watch]   文件数: ${files.length}`);
    console.log(`[watch]   文件名: ${files.map(n => n.base).join(', ') || '(空)'}`);
}

/**
 * 处理函数：生成器，用 yield 向 inputDir 写入实例文件
 * @param {Array} inputArray - 引擎传入的输入快照
 * @param {Object} outputNodeTemplate - 输出节点模板
 */
function* writingRules(inputArray, outputNodeTemplate) {
    const outputDir = outputNodeTemplate.path // 临时目录绝对路径
    const inputDir = path.join(outputDir, '../inputDir');

    const before = inputArray.filter(item => !item.isDirectory).length;
    console.log(`[process] 启动，inputDir 当前文件数: ${before}`);

    for (const name of ['alpha', 'beta', 'gamma']) {
        console.log(`[process] yield 实例文件 -> ${inputDir}/${name}.txt`);
        // ★ 关键：节点 path 指向 inputDir，引擎写入后会触发 watch
        yield [{
            ...outputNodeTemplate,
            path: inputDir,
            fileName: name,
            normExt: 'txt',
            content: `实例文件内容: ${name}\n`
        }];
    }

    console.log('[process] 生成器结束，已写入 3 个实例文件（inputDir 变化将触发 watch）');
}

module.exports = {
    name: 'demo03',
    version: '1.0.0',
    process: writingRules,
    watch: onInputChanged, // ★ 可选字段：声明后启用常驻订阅；不声明则维持一次性执行
    description: 'watch 最简示例：process 用 yield 向 inputDir 写入实例文件，watch 监听到变化后拿到全量更新的 inputArray'
};
