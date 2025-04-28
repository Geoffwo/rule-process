
function writingRules(inputArray,outputNodeTemplate) {
  console.log('inputArray=>',inputArray);

  //todo

  const outputNode = outputNodeTemplate
  outputNode.content = '这是自定义的规则文件内容部分'
  // 返回结果对象
  return new Array(outputNode);
}

module.exports = writingRules;
