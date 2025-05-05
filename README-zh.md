# rule-process

## 1. 项目简介

**rule-process** 是一个灵活的文件规则处理工具，支持批量文件操作、目录结构转换和自定义规则脚本。  
- 仅支持命令行（CLI）方式调用
- 可灵活定义输入/输出目录与规则脚本
- 适合批量文件重命名、内容转换等场景

## 2. 安装
> Node.js >=14.18.0
> 
```bash
npm install rule-process
```

## 3. 目录结构

```
├── src/             # 源代码
│   ├── index.js     # CLI 入口
│   ├── examples/    # 示例文件
│   ├── core/        # 核心逻辑
│   └── utils/       # 工具方法
├── package.json
├── README.md
└── README-zh.md
```

## 4. 使用文档

### 4.1 CLI 模式

#### 1. 基本命令

```bash
rule-process demo #创建基础文件
```
```bash
rule-process run [options] #运行基础指令
```

#### 2. 命令参数

| 参数                  | 说明                | 默认值                        |
|----------------------|---------------------|----------------------------|
| --input              | 输入目录            | ./examples/inputDir        |
| --output             | 输出目录            | ./examples/outputDir       |
| --rule               | 规则文件路径        | ./examples/ruleDir/rule.js |
| --close               | 关闭所有日志输出       | false                      |
| --size               | 强制更改读取文件大小安全限制       | 2MB                        |
| --encode-input              | 强制指定输入文件编码            | 自动适配                       |

#### 3. 示例

```bash
rule-process run --input ./examples/inputDir --output ./examples/outputDir --rule ./examples/ruleDir/rule.js
```

## 5. 支持与捐赠

如果本项目对你有帮助，欢迎扫码支持维护：

| 支付宝                             | 微信支付                          |
|----------------------------------|-------------------------------------|
| ![alipay](assets/alipay-qr.jpg)  | ![wechat](assets/wechat-qr.jpg)     |

### 捐赠说明
1. 所有捐赠均为自愿
2. 不附带任何服务或义务
3. 不构成任何合同关系

## 7. 免责声明

本项目为开源工具，仅供学习和研究使用。  
在使用本项目过程中产生的任何直接或间接损失，均由使用者自行承担，项目作者不承担任何法律责任。  
请勿将本项目用于任何违反法律法规或侵犯他人权益的用途。



        