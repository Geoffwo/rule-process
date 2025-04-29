// utils/fileReader.js
const fs = require("fs-extra");
const {logStep} = require("./log");
let maxSize = 2 //mb
let encode = null
const encodeObject = {
    // 二进制格式文件
    buffer: [
        'png', 'jpg', 'jpeg', 'gif',
        'bmp', 'ico', 'webp', 'tiff',
        'zip', 'rar', 'exe', 'dll',
        'xlsx','xls'
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
            normExt: '未知',
            encode:'utf-8'
        }
    }

    // 标准化扩展名（不带点转小写）
    const normExt = ext.replace(/^\./, '').toLowerCase();
    const encode = encodeMap.get(normExt) || 'utf-8'
    return {normExt,encode}
}

function getRealEncodeByExt(node) {
    logStep(`[${node.normExt}]编码类型使用[${node.encode}]解析`);
    return node.encode === 'buffer' ? null : node.encode
}

function setSize(size){
    logStep( `用户强制更改读取文件大小安全限制为:${size}MB`);
    maxSize=size
}

function setEncodeInput(code){
    logStep( `用户强制更改读取文件大小安全限制为:${code}MB`);
    encode=code
}

function readFileWithLimit(inputNode) {
    //限制文件安全大小
    const fileMaxSize = 1024 * 1024 * maxSize; // 2MB
    const stats = fs.statSync(inputNode.path);

    if (stats.size > fileMaxSize) {
        throw new Error(`文件过大: 最大允许${maxSize}MB,使用-s指令修改`);
    }

    if(encode){
        logStep( `强制指定输入文件编码为: ${encode}`);
    }

    const finalEncode = encode || getRealEncodeByExt(inputNode);
    return fs.readFileSync(inputNode.path, finalEncode);
}

module.exports = {
    readFileWithLimit,
    getEncodeByExt
};

