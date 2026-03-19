
function writingRules(inputArray,outputNodeTemplate) {
  console.log('inputArray=>',inputArray);

  //todo

  const contents = {
    name:'这是自定义的规则文件内容部分2'
  }
  // 返回结果对象
  return [{...outputNodeTemplate,fileName: 'result',normExt: 'json',content:JSON.stringify(contents,null,2)}];
}

// module.exports = writingRules;

module.exports = {
  name: 'demo02',
  version: '1.0.1',
  process: writingRules,
  description: '这是demo02，会生成一个json文件'
};
