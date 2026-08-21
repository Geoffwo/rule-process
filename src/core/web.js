const http = require('http');
const { logInfo, logError, setExitOnError, startLogCapture, stopLogCapture } = require('../utils/log');
const ruleProcess = require('./setup');
const { loadHostConfig } = require('../utils/hosting');

// 服务模式下禁止 logError 硬退出，避免单个请求异常导致整个服务进程终止
setExitOnError(false);

/**
 * 启动 HTTP 服务
 * @param {Object} options - 启动选项
 * @param {number} options.port - 端口号，默认 3000
 * @param {string} options.host - 主机地址，默认 0.0.0.0
 * @param {string} [options.config] - 配置文件路径
 */
function startServer(options = {}) {
    const { port = 3000, host = 'localhost', config: configPath } = options;
    const baseConfig = ruleProcess.baseConfig;

    const server = http.createServer(async (req, res) => {
        // CORS 预检
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const { method, url: reqUrl } = req;

        // GET / — 服务信息
        if (method === 'GET' && (reqUrl === '/' || reqUrl === '/info')) {
            sendJson(res, 200, {
                service: 'rule-process',
                version: '1.0.0',
                endpoints: {
                    'GET /': '服务信息',
                    'POST /run': '执行规则处理，body: {input?, output?, rule?, ...}',
                    'POST /init': '初始化示例，body: {run?}'
                }
            });
            return;
        }

        // POST /run — 执行规则处理（复用 CLI run 的配置合并逻辑）
        if (method === 'POST' && reqUrl === '/run') {
            const parsed = await parseJsonBody(req, res);
            if (!parsed) return; // parseJsonBody 已返回 400

            const parseConfig = loadHostConfig(parsed.config || configPath, baseConfig);
            const finalConfig = { ...parseConfig, ...parsed };

            const { success, logs, error } = await runWithCapture(() => ruleProcess.build(finalConfig));
            sendJson(res, success ? 200 : 500, { success, logs, error });
            return;
        }

        // POST /init — 初始化示例
        if (method === 'POST' && reqUrl === '/init') {
            const parsed = await parseJsonBody(req, res);
            if (!parsed) return;

            const { success, logs, error } = await runWithCapture(() => ruleProcess.init(parsed));
            sendJson(res, success ? 200 : 500, { success, logs, error });
            return;
        }

        // 404
        sendJson(res, 404, { error: `未知路由: ${method} ${reqUrl}` });
    });

    server.listen(port, host, () => {
        logInfo(`rule-process HTTP 服务已启动: http://${host}:${port}`);
        logInfo('可用接口: GET /  |  POST /run  |  POST /init');
    });

    return server;
}

/**
 * 执行函数并捕获日志，返回日志数组与执行结果
 */
async function runWithCapture(fn) {
    startLogCapture();
    try {
        await fn();
        const logs = stopLogCapture();
        return { success: true, logs };
    } catch (e) {
        const logs = stopLogCapture();
        return { success: false, error: e.message, logs };
    }
}

/**
 * 读取请求体并解析 JSON，解析失败时直接返回 400
 * @returns {Object|null} 解析后的对象，null 表示解析失败（已发送响应）
 */
async function parseJsonBody(req, res) {
    const body = await readBody(req);
    if (!body) return {};
    try {
        return JSON.parse(body);
    } catch {
        sendJson(res, 400, { success: false, error: '请求体不是合法 JSON' });
        return null;
    }
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function sendJson(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

module.exports = { startServer };
