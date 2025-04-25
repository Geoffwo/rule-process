const fs = require('fs');
const path = require('path');


const baseConfig = {
  input: path.join(process.cwd(), './examples/inputDir'),    // 默认输入目录
  output: path.join(process.cwd(), './examples/outputDir'), // 默认输出文件
  rule: path.join(process.cwd(), './examples/ruleDir/rule.js') // 默认规则文件
}

/**
 * 构建
 * @param options
 */
function build(options={}){
  const {
    input=baseConfig.input,
    output=baseConfig.output,
    rule=baseConfig.rule
  }=options

  generateBasic(input, output, rule)
}

/**
 * 生成ECharts配置模块文件
 * @param {string} inputPath - 输入路径（文件或目录）
 * @param {string} outputPath - 输出路径（文件或目录）
 * @param {string} rulesPath - 模板规则文件路径
 */
function generateBasic(inputPath, outputPath, rulesPath) {

  try {
    logStep('路径地址校验开始');
    validatePaths(inputPath, outputPath, rulesPath);
    logStep('路径地址校验结束','\n');

    logStep('获取输入文件列表开始');
    const inputArray = getInputArray(inputPath);
    logStep('获取输入文件列表结束','\n');

    logStep('加载模板规则开始');
    const ruleFun = loadRuleFun(rulesPath);
    logStep('加载模板规则结束','\n');

    logStep('生成带目录结构的输出内容开始');
    const outputArray = buildOutputArray(inputArray, ruleFun, outputPath);
    logStep('生成带目录结构的输出内容结束','\n');

    logStep('处理所有输出节点开始');
    processOutputArray(outputArray);
    logStep('处理所有输出节点结束','\n');

    logStep( `生成成功！`);
  } catch (error) {
    logStep( `生成文件失败:`, error);
  }
}

function logStep(...args){
  const prefix  = `${'='.repeat(40)}> `;
  console.log(prefix,...args);
}

function validatePaths(...paths) {
  paths.forEach(path => {
    logStep( '校验地址:',path);
    if (typeof path !== 'string' || !path.trim()) {
      throw new Error(`路径参数无效: ${path}`);
    }
  });
}

function loadInputNode(inputPath,isDirectory = false) {
  //path.parse(inputPath): root、dir、base、ext、name
  return {
    ...path.parse(inputPath),
    path: inputPath,
    isDirectory,
    content: isDirectory ? null : readFileWithLimit(inputPath)
  }
}

function getInputArray(inputPath) {
  // 同步获取输入路径的文件系统状态信息
  // 返回一个 fs.Stats 对象，包含文件/目录的元数据
  const stat = fs.statSync(inputPath);

  // 如果是文件，直接返回文件内容
  if (stat.isFile()) {
    const inputNode = loadInputNode(inputPath);
    logStep( '获取文件:',inputPath);
    return new Array(inputNode);
  }

  // 如果是目录，递归获取所有内容
  if (stat.isDirectory()) {
    return traverseDirectory(inputPath);
  }

  throw new Error(`无效的输入路径: ${inputPath}`);
}

// 递归遍历目录的辅助函数
function traverseDirectory(dirPath) {
  logStep( '读取目录:',dirPath);
  const results = [];

  // 使用 withFileTypes 获取文件类型信息
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    logStep( '读取目录内容:',fullPath);

    const isDirectory = entry.isDirectory();
    const inputNode = loadInputNode(fullPath,isDirectory);

    // 先添加当前条目路径
    results.push(inputNode);

    // 如果是目录则递归处理
    if (isDirectory) {
      results.push(...traverseDirectory(fullPath))
    }
  }

  return results;
}

function readFileWithLimit(filePath) {
  const MAX_SIZE = 1024 * 1024 * 2; // 2MB
  const stats = fs.statSync(filePath);
  if (stats.size > MAX_SIZE) {
    throw new Error(`文件过大: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function loadRuleFun(rulesPath) {
  logStep( '加载模板规则地址:',rulesPath);
  const ruleFuc = require(rulesPath);

  // 检查是否导出函数
  if (typeof ruleFuc !== 'function') {
    throw new Error('规则文件必须导出一个函数');
  }

  return ruleFuc;
}

function getOutputNodeTemplate(outputPath) {
  return {
    path: outputPath,//导出路径
    isDirectory: false,//是否是目录，布尔值 true/false
    content: '',//内容
    append: false // 是否追加，布尔值 true/false
  }
}

function buildOutputArray(inputArray, ruleFuc, outputPath) {
  const outputNodeTemplate = getOutputNodeTemplate(outputPath);
  logStep( '导出对象数组,其中 node模板:\n',outputNodeTemplate,'\n');

  const outputArray = ruleFuc(inputArray,outputNodeTemplate);

  if (Array.isArray(outputArray)){
    logStep( '输出数组长度:',outputArray.length);
    const filter = outputArray.filter(info => validateOutputNode(info));
    logStep( 'node格式过滤后，输出数组长度:',filter.length);
    return filter;
  }

  return [];
}

/**输出格式校验
 * {
      path: ***,
      isDirectory: false,
      content: readFileWithLimit(inputPath)
      append: true // 覆盖content
}*/
function validateOutputNode(node) {
  // 首先检查node是否为对象
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return false;
  }

  const requiredFields = ['path', 'isDirectory', 'content', 'append'];

  // 检查必需字段是否存在
  for (const field of requiredFields) {
    if (!(field in node)) {
      return false;
    }
  }

  return true;
}

function ensureOutputDirectory(outputPath) {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
}

function shouldAutoCreateFilename(filePath) {
  // 情况1: 路径以目录分隔符结尾（如 ./output/ 或 C:\output\ ）
  const isDirectoryLike = filePath.endsWith(path.sep);

  // 情况2: 路径最后一段没有扩展名（如 ./output/data ）
  const lastSegment = path.basename(filePath);
  const hasNoExtension = !lastSegment.includes('.');

  // 满足任意情况则认为需要自动创建文件名
  return isDirectoryLike || hasNoExtension;
}

function processOutputArray(outputArray) {
  outputArray.forEach(node => {
    let fullPath = node.path;

    // 如果是文件节点，强制校验路径有效性
    if (!node.isDirectory) {
      // 自动处理目录型路径：当路径以目录分隔符结尾或没有扩展名时，添加默认文件名
      if (shouldAutoCreateFilename(fullPath)) {
        fullPath = path.join(fullPath, 'result.js'); // 默认文件名
        logStep(`自动修正文件路径为: ${fullPath}`)
      }
    }

    // 处理目录/文件创建
    if (node.isDirectory) {
      // 创建目录（recursive模式避免重复创建）
      ensureOutputDirectory(fullPath)
      logStep('创建目录: ',fullPath)
    } else {
      // 确保父目录存在
      const parentDir = path.dirname(fullPath);
      ensureOutputDirectory(parentDir)

      // 写入文件内容（根据规则覆盖或追加）
      writeFileContent(fullPath, node.content, node.append);
      logStep('创建文件: ',fullPath)
    }
  });
}

function writeFileContent(filePath, content = '', appendMode = false) {
  //默认覆盖为空
  if (appendMode) {
    fs.appendFileSync(filePath, content, 'utf8');//追加
  } else {
    fs.writeFileSync(filePath, content, 'utf8');//覆盖（默认）
  }
}

module.exports = {
  build,
  baseConfig
};
