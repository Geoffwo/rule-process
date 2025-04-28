// utils/fileReader.js
const fs = require("fs-extra");
const {logStep} = require("./log");
const encodeObject = {
    // 二进制格式文件
    binary: [
        'png', 'jpg', 'jpeg', 'gif',
        'bmp', 'ico', 'webp', 'tiff',
        'zip', 'rar', 'exe', 'dll'
    ],

    // UTF-8 文本格式
    utf8: [
        'txt', 'js', 'json', 'html',
        'css', 'csv', 'md', 'xml',
        'yaml', 'yml', 'log', 'ini'
    ],

    // 特殊编码格式（按需扩展）
    latin1: ['dat', 'bin'],
    base64: ['cer', 'pem']
};

// 创建快速查询缓存（扩展名 => 编码）
const encodeMap = new Map();

// 初始化缓存 构建:扩展名 => 编码
(function initEncodingCache() {
    Object.entries(encodeObject).forEach(([encoding, exts]) => {
        exts.forEach(ext => {
            encodeMap.set(ext.toLowerCase(), encoding);
        });
    });
})()

/**
 * 根据扩展名获取编码类型
 * @param {string} ext - 文件扩展名（带或不带点）
 * @returns {string} 编码类型
 */
function getEncodingByExt(ext) {
    // 标准化扩展名（不带点转小写）
    const normalizedExt = ext.replace(/^\./, '').toLowerCase();
    const encode = encodeMap.get(normalizedExt)
    if(!encode){
        logStep( `未定义${normalizedExt}，使用默认utf-8解析`);
        return 'utf-8'
    }

    logStep( `${normalizedExt}自动适配${encode}解析`);
    return encode;
}


function readFileWithLimit(inputNode) {
    const MAX_SIZE = 1024 * 1024 * 2; // 2MB
    const stats = fs.statSync(inputNode.path);
    if (stats.size > MAX_SIZE) {
        throw new Error(`文件过大: ${inputNode.path}`);
    }
    return fs.readFileSync(inputNode.path, getEncodingByExt(inputNode.ext));
}

module.exports = {
    readFileWithLimit
};

