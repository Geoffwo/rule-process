
function writingRules(inputArray,outputNodeTemplate) {
  console.log('inputArray=>',inputArray);

  //todo

  const outputNode = outputNodeTemplate
  outputNode.content = '这是自定义的规则文件内容部分'
  // 返回结果对象
  return new Array(outputNode);
}

// module.exports = writingRules;

module.exports = {
  name: 'demo',
  version: '1.0.0',
  process: writingRules,
  description: '这是demo'
};
