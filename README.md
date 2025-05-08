# rule-process

## 1. Project Introduction

**rule-process** is a flexible file rule processing tool that supports batch file operations, directory structure transformation, and custom rule scripting.  
- CLI (Command Line Interface) only  
- Flexible definition of input/output directories and rule scripts  
- Suitable for batch file renaming, content transformation, and similar scenarios

## 2. Installation
> Node.js >=14.18.0
>
```bash
npm pluginManager rule-process
```

## 3. Directory Structure

```
├── src/             # Source code
│   ├── index.js     # CLI entry
│   ├── examples/    # Example files
│   ├── core/        # Core logic
│   └── utils/       # Utility methods
├── package.json
├── README.md
└── README-zh.md
```

## 4. Usage

### 4.1 CLI Mode

#### 1. Basic Commands

```bash
rule-process demo # Create basic example files
```
```bash
rule-process run [options] # Run main command
```

#### 2. Command Options

| Option         | Description                        | Default                        |
|----------------|------------------------------------|-------------------------------|
| --input        | Input directory                    | ./examples/inputDir           |
| --output       | Output directory                   | ./examples/outputDir          |
| --rule         | Rule file path                     | ./examples/ruleDir/rule.js    |
| --close        | Disable all log output             | false                         |
| --size         | Force change file read size limit  | 2MB                           |
| --encode-input | Force specify input file encoding  | Auto-detect                   |

#### 3. Example

```bash
rule-process run --input ./examples/inputDir --output ./examples/outputDir --rule ./examples/ruleDir/rule.js
```

## 5. Support & Donation

If this project is helpful to you, feel free to support its maintenance:

| Alipay                             | WeChat Pay                        |
|-------------------------------------|-----------------------------------|
| ![alipay](assets/alipay-qr.jpg)     | ![wechat](assets/wechat-qr.jpg)   |

### Donation Notice
1. All donations are voluntary
2. No services or obligations are attached
3. No contractual relationship is formed

## 7. Disclaimer

This project is open source and for learning and research purposes only.  
Any direct or indirect losses arising from the use of this project are the sole responsibility of the user, and the project author assumes no legal liability.  
Do not use this project for any illegal purposes or to infringe upon the rights of others.

        