const RuleProcessor = require('./core');

// 模块化暴露的 API
module.exports = {
    build: (options) => RuleProcessor.build(options),
    demo: (options) => RuleProcessor.demo(options),
    baseConfig: RuleProcessor.baseConfig
};