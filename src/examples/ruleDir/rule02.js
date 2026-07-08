async function* writingRules(inputArray, outputNodeTemplate) {
  console.log('inputArray=>', inputArray);
  // 过滤出含file的文件
  const files = inputArray.filter(item => item.name.includes('file'));

  if (files.length===0) {
    yield [{ ...outputNodeTemplate, content: '错误: 未找到 file 文件' }];
    return
  }

  for (const file of files) {
    // stream 模式下用 node.stream() 读取文件流
    const stream = file.stream();
    let fileContent = '';

    // 拼接流数据
    for await (const chunk of stream) {
      console.log('chunk',chunk);
      fileContent += chunk;
    }

    const outputData = {
      path: file.path,
      content: fileContent
    };

    // 逐份产出输出节点
    yield [{
      ...outputNodeTemplate,
      fileName: file.name,
      normExt: 'json',
      content: JSON.stringify(outputData, null, 2)
    }];
  }
}

module.exports = {
  name: 'demo02',
  version: '1.0.1',
  mode: 'stream', // 声明为流式模式
  process: writingRules,
  description: '流式读取大文件，逐个生成JSON'
};