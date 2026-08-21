/* log.js */
// 定义日志级别常量
const LogLevel = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    VERBOSE: 5
};

// 模块级配置
let currentLogLevel = LogLevel.VERBOSE; // 默认显示 INFO 及以上级别
let enableLog = true;
let exitOnError = true; // CLI 模式下 logError 后直接退出进程；HTTP 服务模式设为 false
let logBuffer = null;   // 日志缓冲区，HTTP 服务模式下用于收集日志返回给调用方

// 设置日志级别
function setLogLevel(level) {
    // 1. 处理未传值或假值的情况
    if (level === undefined || level === null) {
        level = currentLogLevel;
    }

    // 2. 尝试解析数字（支持数字字符串如 "1"）
    const levelNumber = Number(level);//解析数字 解析失败是NaN
    if (!isNaN(levelNumber)) {//如果不是NaN，说明是数字
        level = levelNumber;//直接赋值
    }else{// 3. 尝试按日志级别名称解析（如 "DEBUG"）
        level = LogLevel[level.toUpperCase()] || currentLogLevel;
    }

    currentLogLevel = Math.max(LogLevel.ERROR, Math.min(level, LogLevel.VERBOSE));
}

function setExitOnError(enable) { exitOnError = enable; }
function startLogCapture() { logBuffer = []; return logBuffer; }
function stopLogCapture() { const buf = logBuffer; logBuffer = null; return buf; }

function getLevelName(level) {
    return Object.keys(LogLevel).find(key => LogLevel[key] === level);
}

// 统一日志方法
function log(level, ...args) {
    if (!enableLog || level > currentLogLevel) return;

    const date = new Date();
    // 手动获取时、分、秒并补零
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // 生成固定格式 "HH:MM:SS"
    const timeTag = `${hours}:${minutes}:${seconds}`.padStart(10, ' ');

    const levelTag = `${getLevelName(level)}`.padStart(7, ' ');
    const prefix = `: `;
    console.log(timeTag, levelTag, prefix, ...args);
    if (logBuffer) logBuffer.push([timeTag, levelTag, prefix, ...args].join(' '));
}

// 分级日志函数
function logError(...args) { log(LogLevel.ERROR, ...args); if (exitOnError) process.exit(0); }
function logWarn(...args)  { log(LogLevel.WARN, ...args); }
function logInfo(...args)  { log(LogLevel.INFO, ...args); }
function logDebug(...args) { log(LogLevel.DEBUG, ...args); }
function logVerbose(...args) { log(LogLevel.VERBOSE, ...args); }

function logPlugins(plugins,connect='@') {
    logInfo(`读取插件列表开始`);

    if (plugins.length === 0) {
        logWarn('未找到任何插件');
    }

    let index = 1;
    plugins.forEach(plugin => {
        const pluginVersion = Array.isArray(plugin.version) ? plugin.version.join('、') : plugin.version
        logInfo(`${index++}. ${plugin.name} ${connect} ${pluginVersion}`);
    });

    logInfo(`读取插件列表结束\n`);
}

module.exports = {
    LogLevel,
    setLogLevel,
    setEnableLog: (enable) => { enableLog = enable; },
    setExitOnError,
    startLogCapture,
    stopLogCapture,
    logError,
    logWarn,
    logInfo,
    logDebug,
    logVerbose,
    logPlugins
};