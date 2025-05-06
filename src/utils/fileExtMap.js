// utils/fileReader.js
const {logStep} = require("./log");
const encodeObject = {
    // 二进制格式文件
    buffer: [
        'png', 'jpg', 'jpeg', 'gif',
        'bmp', 'ico', 'webp', 'tiff',
        'zip', 'rar', 'exe', 'dll',
        'xlsx','xls'
    ],

    // UTF-8 文本格式
    'utf-8': [
        'txt', 'js', 'json', 'html',
        'css', 'csv', 'md', 'xml',
        'yaml', 'yml', 'log', 'ini',
        'data'
    ],

    // 特殊编码格式（按需扩展）
    latin1: ['dat', 'bin'],
    base64: ['cer', 'pem']
};

// 创建快速查询缓存（扩展名 => 编码）
const encodeMap = new Map();

// 初始化缓存 构建:扩展名 => 编码
(()=>{
    Object.entries(encodeObject).forEach(([encoding, exts]) => {
        exts.forEach(ext => {
            encodeMap.set(ext.toLowerCase(), encoding);
        });
    });
})()

/**
 * 根据扩展名获取编码类型
 * @param {string} ext - 文件扩展名（带或不带点）
 * @returns {{encode: (any|string), normExt: string}} 编码类型
 */
function getEncodeByExt(ext) {
    if (!ext) {
        return {
            normExt: '',
            encode:'utf-8'
        }
    }

    // 标准化扩展名（不带点转小写）
    const normExt = ext.replace(/^\./, '').toLowerCase();
    const encode = encodeMap.get(normExt) || 'utf-8'
    return {normExt,encode}
}

function getRealEncodeByNode(node) {
    logStep(`[${node.normExt}]使用[${node.encode}]编码类型解析`);
    return node.encode === 'buffer' ? null : node.encode
}

module.exports = {
    getEncodeByExt,
    getRealEncodeByNode
};

