//交互式输入库，提供 select（下拉选择）、text（文本输入）、toggle（布尔开关）、number（数字输入）
const prompts = require('prompts');
const setup = require('../core/setup');

const cancelOptions = {//全局复用的取消配置
    onCancel: () => {//prompts 任意交互，用户按 ESC 会触发 onCancel，打印提示并退出进程。
        console.log('\n操作已取消');
        process.exit(0);
    }
};

const sourceChoices = [
    { title: 'gitee（国内）', value: 'gitee' },
    { title: 'github（国外）', value: 'github' }
];

/**
 * 交互式 TUI 入口：菜单收集命令，随后调用 core/setup 的现有实现
 */
async function runTui() {
    const { action } = await prompts({
        type: 'select',
        name: 'action',//这里设置什么，就返回什么
        message: '请选择操作',
        choices: [//弹出选择菜单，5 个功能，用户上下箭头选择，回车确认，得到action字符串
            { title: '运行规则处理', description: 'run', value: 'run' },
            { title: '初始化示例与配置', description: 'init', value: 'init' },
            { title: '安装插件', description: 'install', value: 'install' },
            { title: '查看插件列表', description: 'list', value: 'list' },
            { title: '卸载插件', description: 'uninstall', value: 'uninstall' }
        ]
    }, cancelOptions);

    if (!action) return;

    switch (action) {
        case 'run': await tuiRun(); break;
        case 'init': await tuiInit(); break;
        case 'install': await tuiInstall(); break;
        case 'list': await tuiList(); break;
        case 'uninstall': await tuiUninstall(); break;
    }
}

async function tuiRun() {
    const result = await prompts([
        { type: 'text', name: 'input', message: '输入路径（文件或目录）', initial: setup.baseConfig.input },
        { type: 'text', name: 'output', message: '输出目录', initial: setup.baseConfig.output },
        { type: 'text', name: 'rule', message: '规则文件或规则目录', initial: setup.baseConfig.rule },
        { type: 'toggle', name: 'display', message: '关闭所有日志输出 (-d, --display)', initial: false, active: '是', inactive: '否' },
        { type: 'number', name: 'size', message: '读取文件大小安全限制 MB (-s, --size)', initial: 200, min: 1 },
        { type: 'text', name: 'encode', message: '强制输入编码 (-e, --encode)，留空自动适配', initial: '' },
        { type: 'text', name: 'level', message: '日志等级 1-5 或名称 (-l, --level)，留空默认', initial: '' }
    ], cancelOptions);

    if (!result) return;

    const options = {
        input: result.input || setup.baseConfig.input,
        output: result.output || setup.baseConfig.output,
        rule: result.rule || setup.baseConfig.rule,
        display: !!result.display,
        size: result.size
    };
    if (result.encode) options.encode = result.encode;
    if (result.level) options.level = result.level;

    await setup.build(options);
}

async function tuiInit() {
    const result = await prompts([
        { type: 'toggle', name: 'run', message: '初始化后自动运行演示案例 (-r, --run)', initial: true, active: '是', inactive: '否' }
    ], cancelOptions);

    if (!result) return;
    await setup.init({ run: !!result.run });
}

async function tuiInstall() {
    const result = await prompts([
        { type: 'text', name: 'plugins', message: '插件名与版本（如 xlsx2json@1.0.0，多个用空格分隔）' },
        { type: 'select', name: 'source', message: '下载源', choices: sourceChoices, initial: 0 }
    ], cancelOptions);

    if (!result) return;

    const plugins = result.plugins.trim().split(/\s+/).filter(Boolean);
    if (plugins.length === 0) {
        console.log('未输入插件名');
        return;
    }
    await setup.install(plugins, { source: result.source });
}

async function tuiList() {
    const result = await prompts([
        {
            type: 'select',
            name: 'type',
            message: '读取类型',
            choices: [
                { title: '本地插件库 (local)', value: 'local' },
                { title: '远程插件库 (remote)', value: 'remote' }
            ],
            initial: 0
        },
        { type: 'select', name: 'source', message: '下载源', choices: sourceChoices, initial: 0 }
    ], cancelOptions);

    if (!result) return;
    await setup.list({ type: result.type, source: result.source });
}

async function tuiUninstall() {
    const result = await prompts([
        { type: 'text', name: 'plugins', message: '插件名（多个用空格分隔，留空卸载全部）' },
        { type: 'toggle', name: 'force', message: '强制删除关联的 npm 依赖 (-f, --force)', initial: false, active: '是', inactive: '否' }
    ], cancelOptions);

    if (!result) return;

    const plugins = result.plugins.trim().split(/\s+/).filter(Boolean);
    await setup.uninstall(plugins, { force: !!result.force });
}

module.exports = { runTui };
