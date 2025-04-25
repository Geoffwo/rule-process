# File Rule Processing Tool

## 1. 项目简介

一个基于Node.js的文件规则处理工具，提供以下核心能力：
• 📁 灵活的文件处理流程：支持文件/目录输入输出

• 🛠️ 自定义规则引擎：通过JavaScript规则文件控制处理逻辑

• 📂 智能目录生成：自动创建嵌套目录结构

• ⚡ 高效批处理：递归处理目录内容，支持2MB以下文件处理


---

## 2. 安装指南

### 2.1 环境要求

• Node.js >=14.18.0

### 2.2 安装方式

```bash
# 全局安装（推荐）
npm install -g file-rule-process

# 或作为项目依赖安装
npm install file-rule-process
```

## 3. 快速开始

### 3.1 运行示例项目

```bash
# 执行示例构建
rule-process build

# 或使用npm脚本
npm run start:example
```

### 3.2 查看输出结果

```bash
# 生成文件位于
/examples/outputDir/result.js
```

## 4. 项目结构

```
├── examples/          # 示例文件
│   ├── inputDir/      # 输入示例
│   │   └── demo.txt
│   ├── outputDir/     # 输出示例
│   └── ruleDir/       # 规则文件
│       └── rule.js    
├── src/               # 源代码
│   ├── cli.js         # 命令行接口
│   └── main.js        # 核心逻辑
├── package.json
└── README.md
```

## 5. 使用说明

### 5.1 命令行模式

#### 1. 基础命令

```bash
rule-process [options]
```

#### 2. 命令选项

| 选项                  | 描述                  | 默认值                       |
| --------------------- | --------------------- | ---------------------------- |
| `-i, --input <path>`  | 输入路径（文件/目录） | `./examples/inputDir`        |
| `-o, --output <path>` | 输出路径（文件/目录） | `./examples/outputDir`       |
| `-r, --rule <path>`   | 规则文件路径          | `./examples/ruleDir/rule.js` |
| `-v, --version`       | 显示版本号            | -                            |
| `build`               | 示例构建              | -                            |

##### 1. 基本构建

```bash
rule-process build
```

##### 2. 自定义路径

```bash
rule-process build \
  -i ./src/assets \
  -o ./dist \
  -r ./config/transform-rules.js
```

##### 3. 获取帮助信息

```bash
rule-process --help
```

### 5.2 Node.js API调用

#### 1. 代码示例

```javascript
// build.js
const path = require('path');
const { build, baseConfig } = require('file-rule-process');

// 自定义配置
const config = {
  input: path.join(__dirname, 'src'), 
  output: path.resolve('./dist'),
  rule: './custom-rules/advanced.js'
};

// 同步构建
try {
  build({ ...baseConfig, ...config });
  console.log('✅ 构建成功');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
```

#### 2. 参数说明

| 参数     | 类型   | 必填 | 说明                         |
| -------- | ------ | ---- | ---------------------------- |
| `input`  | string | 否   | 输入路径，支持绝对/相对路径  |
| `output` | string | 否   | 输出路径，自动创建目录结构   |
| `rule`   | string | 否   | 规则文件路径，需导出处理函数 |

## 6. 贡献指南

欢迎通过以下方式参与贡献：
1. 提交[Issue](https://github.com/your-repo/issues)报告问题
2. 发起[Pull Request](https://github.com/your-repo/pulls)改进代码
3. 完善[示例规则](src/examples/ruleDir)库

## 7. 支持项目

如果本项目对您有帮助，欢迎打赏支持作者持续维护：
- 🚀 任意金额 - 对作者的支持
- ☕ 5 元 - 请作者喝杯咖啡
- 📚 10 元 - 帮助文档改进

| 支付宝                             | 微信支付                            |
|---------------------------------|-----------------------------------|
| ![alipay](assets/alipay-qr.jpg) | ![wechat](assets/wechat-qr.jpg)   |

### 打赏性质说明
1. 所有打赏行为属于自愿赠与
2. 打赏金额不包含任何服务对价
3. 打赏后不产生任何义务关系
4. 未成年人请在监护人指导下操作

## 8. 技术咨询
技术咨询请联系：<wangguoxv@163.com>