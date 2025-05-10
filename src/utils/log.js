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

// 设置日志级别
function setLogLevel(level) {
    if (typeof level === 'string') {
        level = LogLevel[level.toUpperCase()] || LogLevel.INFO;
    }
    currentLogLevel = Math.max(LogLevel.ERROR, Math.min(level, LogLevel.VERBOSE));
}

function getLevelName(level) {
    return Object.keys(LogLevel).find(key => LogLevel[key] === level);
}

// 统一日志方法
function log(level, ...args) {
    if (!enableLog || level > currentLogLevel) return;

    const prefix = `${'='.repeat(30)}> `;
    const levelTag = `[${getLevelName(level)}]`;
    console.log(prefix, levelTag, ...args);
}

// 分级日志函数
function logError(...args) { log(LogLevel.ERROR, ...args); process.exit(1)}
function logWarn(...args)  { log(LogLevel.WARN, ...args); }
function logInfo(...args)  { log(LogLevel.INFO, ...args); }
function logDebug(...args) { log(LogLevel.DEBUG, ...args); }
function logVerbose(...args) { log(LogLevel.VERBOSE, ...args); }

function logPlugins(plugins) {
    logInfo(`读取插件列表开始`);

    if (plugins.length === 0) {
        logWarn('未找到任何插件');
    }

    let index = 1;
    plugins.forEach(plugin => {
        logInfo(`${index++}. ${plugin.name}@${plugin.version}`);
    });

    logInfo(`读取插件列表结束\n`);
}

module.exports = {
    LogLevel,
    setLogLevel,
    setEnableLog: (enable) => { enableLog = enable; },
    logError,
    logWarn,
    logInfo,
    logDebug,
    logVerbose,
    logPlugins
};