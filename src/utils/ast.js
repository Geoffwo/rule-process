const acorn = require('acorn'); // AST 解析
const acornWalk = require('acorn-walk'); // 单独导入 acorn-walk

// AST 静态解析：提取模块导出元数据
function astParseExportData(code) {
    // 使用 acorn 解析代码生成 AST（抽象语法树），指定使用最新 ECMAScript 版本
    const ast = acorn.parse(code, { ecmaVersion: 'latest' });

    // 初始化元数据存储变量
    let object = {};

    // acornWalk.simple 简单方式遍历 AST 节点
    // 第1个参数：AST 根节点（由 acorn.parse 生成）
    // 第2个参数：定义如何处理不同类型节点的回调对象
    acornWalk.simple(ast, {
        //AssignmentExpression 表示代码中的赋值操作
        //每当遍历到一个赋值表达式时，会调用此函数，并传入该节点的详细信息（node）
        AssignmentExpression(node) {
            // 检查是否满足以下条件：
            if (
                node.left.type === 'MemberExpression' && // 1. 左侧为成员表达式（如 module.exports）
                node.left.object.name === 'module' && // 2. 左侧对象名为 'module'
                node.left.property.name === 'exports' && // 3. 左侧属性名为 'exports'
                node.right.type === 'ObjectExpression' // 4. 右侧为对象表达式（如 { name: 'demo', version: '1.0.0' }）
            ) {
                // 遍历右侧对象的所有属性
                node.right.properties.forEach(prop => {
                    // 解析属性名
                    const key = getPropertyKey(prop);
                    if (!key) return; // 跳过无法解析的 key

                    // 解析属性值
                    object[key] = parseValue(prop.value);
                });
            }
        }
    });

    // 返回提取的元数据
    return object;
}

// 解析属性名（支持 Identifier 和 Literal 类型）
function getPropertyKey(prop) {
    if (prop.key.type === 'Identifier') {//方法
        return prop.key.name;
    } else if (prop.key.type === 'Literal') {//字面值
        return prop.key.value;
    }
    // 跳过计算属性等复杂类型
    return null;
}

// 解析属性值（支持常见类型）
function parseValue(node) {
    switch (node.type) {
        case 'Literal':
            return node.value; // 字符串/数字/布尔值
        case 'ObjectExpression':
            return parseObject(node); // 递归解析对象
        case 'ArrayExpression':
            return node.elements.map(e => parseValue(e)); // 解析数组元素
        case 'Identifier':
            return `[变量引用]: ${node.name}`; // 如 version: someVar
        case 'CallExpression':
            return '[函数调用]'; // 如 version: getVersion()
        default:
            return `[未处理类型]: ${node.type}`;
    }
}

// 递归解析对象
function parseObject(node) {
    const obj = {};
    node.properties.forEach(prop => {
        const key = getPropertyKey(prop);
        if (key) obj[key] = parseValue(prop.value);
    });
    return obj;
}

module.exports = {
    astParseExportData
};