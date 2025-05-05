// utils/fileReader.js
const fs = require("fs-extra");
const {logStep} = require("./log");
const {getRealEncodeByNode} = require("./fileExtMap");
let maxSize = 2 //mb
let encode = null

function setSize(size){
    logStep( `强制更改读取文件大小安全限制为:${size}MB`);
    maxSize=size
}

function setEncodeInput(code){
    logStep( `强制指定输入文件编码:${code}`);
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

    const finalEncode = encode || getRealEncodeByNode(inputNode);
    return fs.readFileSync(inputNode.path, finalEncode);
}

module.exports = {
    readFileWithLimit,
    setSize,
    setEncodeInput
};

