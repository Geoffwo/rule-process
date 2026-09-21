/**
 * src/core/watch.js —— 可选常驻订阅引擎
 *
 * 规则导出 watch 即启用：监听 inputDir 变化 → 防抖 → 重算全量快照 → 传给 watch。
 * 仅用 Node 内置 fs.watch，零第三方依赖。watch 的返回值被忽略，不做放行判断。
 * watch 拿到的 inputArray 与 process 同源（复用 build.getInputArray）。
 */
const fs = require('fs');
const path = require('path');
const { logInfo, logWarn, logDebug } = require('../utils/log');
const { getInputArray } = require('./build');
const { getOutputNodeTemplate } = require('../utils/ruleWriter');

const DEBOUNCE_MS = 0.8 * 1000; // 编辑器一次保存可能触发多个 fs 事件，统一吸收

// 一次订阅响应：重算全量快照 → 交给 watch
async function respond(state) {
    if (state.running) { state.pending = true; return; }
    state.running = true;
    try {
        do {
            state.pending = false;
            const inputArray = getInputArray(state.inputPath, state.mode);
            logDebug('输入发生变化，推送节点数据');
            await state.watch(inputArray, state.template);
        } while (state.pending);
    } finally {
        state.running = false;
    }
}

// 防抖：窗口内多次事件合并为一次
function debounce(state) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
        try{
            //推送节点数据
            return respond(state)
        } catch(e){
            logWarn(`订阅处理异常: ${e.message}`)
        }
    },DEBOUNCE_MS);
}

// 递归监听目录（Linux 不支持 recursive，逐层遍历子目录）
function watchDir(state, dir) {
    let entries = [];
    try {
        //监听目录 订阅
        fs.watch(dir, { persistent: true }, () => {
            //防抖
            debounce(state);
        });

        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        logWarn(`监听失败，跳过: ${dir} (${e.message})`);
        return;
    }

    //递归监听所有子目录
    for (const entry of entries) {
        if (entry.isDirectory()) {
            watchDir(state, path.join(dir, entry.name))
        }
    }
}

/**
 * 启动常驻订阅（进程退出即停止监听，无需手动关闭）
 * @param {string} inputPath  输入路径（文件或目录）
 * @param {string} outputPath 输出目录
 * @param {object} ruleModule 规则模块（含 mode / watch）
 */
function startWatch(inputPath, outputPath, ruleModule = {}) {
    //构建对象
    const state = {
        inputPath,
        mode: ruleModule.mode,
        watch: ruleModule.watch,
        template: getOutputNodeTemplate(outputPath),
        timer: null,
        running: false, // 执行期锁
        pending: false  // 执行期间到来的变化，跑完补跑一次
    };

    const root = fs.statSync(inputPath).isDirectory() ? inputPath : path.dirname(inputPath);
    logInfo('检测到规则声明 watch，启用常驻订阅模式');
    logInfo(`订阅输入目录: ${root}`);

    watchDir(state, root);
    logInfo('常驻订阅已启动，等待输入变化...\n');
}

module.exports = { startWatch };
