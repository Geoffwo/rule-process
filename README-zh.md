# rule-process

## 1. 项目简介

**rule-process** 是一个灵活的文件规则处理工具，支持批量文件操作、目录结构转换和自定义规则脚本。  
- 通过命令行（CLI）调用；无参数或双击启动时自动进入向导模式
- 可灵活定义输入/输出目录与规则脚本
- 适合批量文件重命名、内容转换等场景

## 2. 安装
> Node.js >= 18.20.4
> 
```bash
npm install -g rule-process
```

## 3. 目录结构

```
├── src/             # 源代码
│   ├── index.js     # CLI 入口
│   ├── examples/    # 示例文件
│   ├── core/        # 核心逻辑
│   ├── interface/   # 插件系统
│   ├── preprocess/  # 依赖预处理
│   └── utils/       # 工具方法
├── package.json
├── README.md
└── README-zh.md
```

## 4. 使用文档

### 4.1 基本命令

| 命令 | 说明 |
|----------------------|---------------------|
| `rule-process init` | 在宿主机创建示例文件与 config.ini（首次使用） |
| `rule-process run [options]` | 执行规则处理（主命令） |
| `rule-process install <plugins...>` | 批量安装插件 |
| `rule-process list` | 读取插件列表（本地/远程） |
| `rule-process uninstall [plugins...]` | 卸载插件（不指定插件名时卸载全部） |
| `rule-process -v` / `rule-process -h` | 显示版本号 / 帮助 |

> 无参数或双击启动时进入向导模式：自动判断是否已初始化，并执行 init 或 run。

### 4.2 run 命令参数

| 参数                  | 说明                | 默认值                        |
|----------------------|---------------------|----------------------------|
| `-i, --input <path>`  | 输入路径（文件或目录） | `./examples/inputDir`        |
| `-o, --output <path>` | 输出目录            | `./examples/outputDir`       |
| `-r, --rule <path>`   | 规则文件（单个 JS 文件或目录，目录按文件名依次加载） | `./examples/ruleDir` |
| `-d, --display`       | 关闭所有日志输出       | `false`                      |
| `-s, --size <MB>`     | 强制更改读取文件大小安全限制（单位 MB） | `200` |
| `-e, --encode <编码>` | 强制指定输入文件编码（如 utf8、base64、latin1） | 按扩展名自动适配 |
| `-l, --level <等级>`  | 日志等级：数字 1-5 或 ERROR/WARN/INFO/DEBUG/VERBOSE | `VERBOSE` |
| `-c, --config <path>` | 解析配置文件（.ini/.js，缺失时自动创建默认配置） | `./config.ini` |

### 4.3 其他命令参数

- `init`：`-r, --run` 构建完成后自动运行演示案例；`-k, --vosk` 创建 vosk 语音识别专属依赖（已废弃）
- `install <plugins...>`：`-s, --source <gitee|github>` 下载源，默认 `gitee`
- `list`：`-t, --type <local|remote>` 读取类型，默认 `local`；`-s, --source <gitee|github>` 远程下载源，默认 `gitee`
- `uninstall [plugins...]`：`-f, --force` 强制删除插件关联的 npm 依赖

### 4.4 示例

```bash
rule-process init
```

```bash
rule-process run
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

## 6. 免责声明

本项目为开源工具，仅供学习和研究使用。  
在使用本项目过程中产生的任何直接或间接损失，均由使用者自行承担，项目作者不承担任何法律责任。  
请勿将本项目用于任何违反法律法规或侵犯他人权益的用途。



        