/**
 * src/core/mcp.js
 * -------------------------------------------------------------------------
 * MCP 服务：把 rule-process 的现有能力暴露为标准 MCP 工具。
 *
 * 设计原则（与 web.js 平级，零改引擎）：
 *  1. 仅作为 ruleProcess API 的"薄封装 / 消费者"，不复制任何流水线逻辑；
 *     内部调用的 build / list / install 与 CLI、web.js 完全一致。
 *  2. 通过 stdio 传输 MCP 协议，因此【必须】关闭所有 stdout 日志
 *     （log.js 用 console.log 写 stdout，会污染 MCP 协议流）。
 *  3. LangChain / 任意 MCP client 通过 @langchain/mcp-adapters 的
 *     MultiServerMCPClient 即可接入，本文件不需要 LangChain。
 *
 * 启动方式：rule-process mcp   （见 src/index.js 的 mcp 子命令）
 * -------------------------------------------------------------------------
 */

const { setEnableLog, setExitOnError, setLogLevel } = require('../utils/log');
const ruleProcess = require('../core/setup');
const { loadHostConfig } = require('../utils/hosting');
const { loadPlugin } = require('../core/plugin');
// 初始化全局插件注册表（interface/plugin.js 的 IIFE 会挂载 global.pluginSystem，
// core/plugin.js 内部以裸全局 pluginSystem 引用它；不 require 会导致 ReferenceError）
require('../interface/plugin');

// MCP SDK 是 ESM，CJS 项目用动态 import 引入
async function loadSdk() {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
    return { Server, StdioServerTransport, ListToolsRequestSchema, CallToolRequestSchema };
}

/**
 * 与 web.js 的 /run 完全一致的配置合并逻辑
 */
function buildFinalConfig(params) {
    const parseConfig = loadHostConfig(params.config || null, ruleProcess.baseConfig);
    return {
        ...parseConfig,
        ...params,
        display: true // 关闭日志输出，避免污染 MCP stdio
    };
}

/**
 * 构造并注册工具的 MCP Server（不连接传输层，便于测试注入自定义 transport）
 * @returns {Promise<{server: import('@modelcontextprotocol/sdk/server/index.js').Server}>}
 */
async function createMcpServer() {
    const { Server, ListToolsRequestSchema, CallToolRequestSchema } = await loadSdk();

    const server = new Server(
        { name: 'rule-process', version: '1.0.0' },
        { capabilities: { tools: {} } }
    );

    // ---- 工具清单 ----
    const TOOLS = [
        {
            name: 'run_rule',
            description: '执行规则处理（等效于 CLI: rule-process run -r <rule> -i <input> -o <output>）。' +
                '传入规则目录/文件、输入目录、输出目录，执行后返回结果摘要。',
            inputSchema: {
                type: 'object',
                properties: {
                    rule: { type: 'string', description: '规则文件或规则目录的绝对路径' },
                    input: { type: 'string', description: '（可选）输入目录绝对路径，默认使用 baseConfig.input' },
                    output: { type: 'string', description: '（可选）输出目录绝对路径，默认使用 baseConfig.output' },
                    config: { type: 'string', description: '（可选）配置文件路径（.js/.ini），用于覆盖默认配置' }
                },
                required: ['rule']
            }
        },
        {
            name: 'list_plugins',
            description: '列出当前已加载的插件（规则）注册表，返回 name 与 version。',
            inputSchema: { type: 'object', properties: {} }
        },
        {
            name: 'install_plugin',
            description: '安装插件（等效于 CLI: rule-process install <plugins...>）。',
            inputSchema: {
                type: 'object',
                properties: {
                    plugins: { type: 'array', items: { type: 'string' }, description: '插件名列表，例如 ["xlsx2json@1.0.0"]' },
                    source: { type: 'string', description: '（可选）下载源，gitee/github，默认 gitee' }
                },
                required: ['plugins']
            }
        }
    ];

    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case 'run_rule': {
                    const finalConfig = buildFinalConfig(args);
                    await ruleProcess.build(finalConfig);
                    return {
                        content: [{
                            type: 'text',
                            text: `规则处理完成。\n规则: ${finalConfig.rule}\n输入: ${finalConfig.input}\n输出: ${finalConfig.output}`
                        }]
                    };
                }
                case 'list_plugins': {
                    loadPlugin(); // 确保注册表最新
                    const plugins = global.pluginSystem
                        ? Array.from(global.pluginSystem.plugins.values()).map(p => ({ name: p.name, version: p.version }))
                        : [];
                    const text = plugins.length
                        ? '已加载插件:\n' + plugins.map(p => `- ${p.name} @ ${p.version}`).join('\n')
                        : '当前未加载任何插件（可先调用 run_rule 触发加载，或确认插件文件存在）。';
                    return { content: [{ type: 'text', text }] };
                }
                case 'install_plugin': {
                    await ruleProcess.install(args.plugins || [], { source: args.source || 'gitee' });
                    return { content: [{ type: 'text', text: `插件安装完成: ${(args.plugins || []).join(', ')}` }] };
                }
                default:
                    return { content: [{ type: 'text', text: `未知工具: ${name}` }], isError: true };
            }
        } catch (e) {
            return { content: [{ type: 'text', text: `工具[${name}]执行失败: ${e.message}` }], isError: true };
        }
    });

    return { server };
}

/**
 * 启动 MCP 服务（默认连接 stdio 传输）
 * @param {Object} [options]
 * @param {object} [options.transport] 自定义传输层（测试用，默认 StdioServerTransport）
 */
async function startMcpServer(options = {}) {
    // 1. 关闭 stdout 日志 + 关闭错误即退出（MCP 是长驻服务，日志会污染协议流）
    setEnableLog(false);
    setExitOnError(false);
    setLogLevel('ERROR');

    // 2. 预加载插件注册表，使 list_plugins 立即可用
    try { loadPlugin(); } catch (e) { /* 忽略预加载失败，build 时会再次尝试 */ }

    // 3. 构造 server
    const { server } = await createMcpServer();

    // 4. 连接传输层（默认 stdio；可注入自定义 transport 用于测试）
    const { StdioServerTransport } = await loadSdk();
    const transport = options.transport || new StdioServerTransport();
    await server.connect(transport);

    // 注意：stdio 模式下严禁向 stdout 打印任何欢迎信息
    return server;
}

module.exports = { startMcpServer, createMcpServer };
