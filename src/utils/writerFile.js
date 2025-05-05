// utils/fileReader.js
const outputNode = {
    path: {
        default: "${path}",
        explain: "导出路径，默认 ${path}"
    },
    isDirectory: {
        default: false,
        explain: "是否是目录，布尔值，默认 false"
    },
    content: {
        default: "",
        explain: "内容，默认空"
    },
    fileName: {
        default: "",
        explain: "文件名，默认 result_年月日时分秒"
    },
    normExt: {
        default: "data",
        explain: "文件扩展名，默认 data"
    },
    option: {
        encode: {
            default: "",
            explain: "文件编码格式，根据扩展名自动适配（可选 utf8、base64、hex，写入 Buffer 需设为 buffer）"
        },
        mode: {
            default: 0o666,
            explain: "文件权限，八进制数，默认 0o666"
        },
        flag: {
            default: "w",
            explain: "文件操作模式，默认 w（w 覆盖写、a 追加、wx 排他写等）"
        }
    }
}

/**
 * 递归提取对象中指定 key（如 'default' 或 'explain'）的值，生成结构一致的新对象
 * @param {object} obj - 要提取的对象（如 outputNode）
 * @param {string} key - 需要提取的字段名（'default' 或 'explain'）
 * @returns {object} 提取后的新对象
 */
function extractField(obj, key) {
    if (obj && typeof obj === 'object' && key in obj) {
        // 叶子节点，直接返回目标字段
        return obj[key];
    }

    // 递归处理对象
    const result = {};
    for (const k in obj) {
        result[k] = extractField(obj[k], key);
    }
    return result;
}

/**
 * 占位符替换工具函数
 * @param {string} str - 需要替换的字符串
 * @param {object} params - 占位符参数对象，如 { path: 'xxx' }
 * @returns {string}
 */
function replaceSeat(str, params = {}) {
    // 只支持 ${xxx} 形式的占位符
    return str.replace(/\$\{([a-zA-Z0-9_]+)\}/g, function(match, key) {
        // 如果 params 里有 key，就替换成对应的值，否则替换成空字符串
        return params[key] !== undefined ? params[key] : '';
    });
}

/**
 * 获取输出节点文档说明
 * @returns {object}
 */
function getOutputNodeDoc(path = '') {
    const doc = extractField(outputNode, 'explain');
    doc.path = replaceSeat(doc.path,{path});
    return doc;
}

/**
 * 获取输出节点默认模板
 * @param {string} path - 导出路径
 * @returns {object}
 */
function getOutputNodeTemplate(path = '') {
    const template = extractField(outputNode, 'default');
    template.path = replaceSeat(template.path, {path});
    template.fileName = getUniqueFileName()
    return template;

}

/**
 * 生成一个不会重复的文件名
 * @returns {string}
 */
function getUniqueFileName() {
    const prefix = 'result'
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const randomStr = Math.random().toString(36).slice(2, 6); // 6位随机字符串
    return `${prefix}_${dateStr}_${randomStr}`;
}

module.exports = {
    getOutputNodeDoc,
    getOutputNodeTemplate
};

