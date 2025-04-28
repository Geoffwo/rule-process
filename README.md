# File Rule Processing Tool

## 1. Project Overview

A Node.js-based file rule processing tool offering core capabilities:

• 📁 Flexible File Processing: Supports file/directory input-output operations  
• 🛠️ Custom Rule Engine: Control processing logic through JavaScript rule files  
• 📂 Smart Directory Generation: Auto-create nested directory structures  
• ⚡ Efficient Batch Processing: Recursively process directory contents (supports files under 2MB)

---

## 2. Installation Guide

### 2.1 Prerequisites

• Node.js >=14.18.0

### 2.2 Installation Methods

```bash
# Global install (recommended)
npm install -g file-rule-process

# Or install as project dependency
npm install file-rule-process
```

## 3. Quick Start

### 3.1 Run Example Project

```bash
# Execute sample build
rule-process build

# Or use npm script
npm run start:example
```

### 3.2 View Output

```bash
# Generated files located at
/examples/outputDir/result.js
```

## 4. Project Structure

```
├── examples/          # Example files
│   ├── inputDir/      # Input samples
│   │   └── demo.txt
│   ├── outputDir/     # Output samples
│   └── ruleDir/       # Rule files
│       └── rule.js    
├── src/               # Source code
│   ├── index.js         # CLI interface
│   └── build.js        # Core logic
├── package.json
└── README.md
```

## 5. Usage Documentation

### 5.1 CLI Mode

#### 1. Basic Commands

```bash
rule-process [options]
```

#### 2. Command Options

| Option               | Description                  | Default Value               |
| -------------------- | ---------------------------- | --------------------------- |
| `-i, --input <path>` | Input path (file/directory)  | `./examples/inputDir`       |
| `-o, --output <path>`| Output path (file/directory) | `./examples/outputDir`      |
| `-r, --rule <path>`  | Rule file path               | `./examples/ruleDir/rule.js`|
| `-v, --version`      | Show version number          | -                           |
| `build`              | Example build                | -                           |

##### 1. Basic Build

```bash
rule-process build
```

##### 2. Custom Paths

```bash
rule-process build \
  -i ./src/assets \
  -o ./dist \
  -r ./config/transform-rules.js
```

##### 3. Get Help

```bash
rule-process --help
```

### 5.2 Node.js API Integration

#### 1. Code Example

```javascript
// build.js
const path = require('path');
const { build, baseConfig } = require('file-rule-process');

// Custom configuration
const config = {
  input: path.join(__dirname, 'src'), 
  output: path.resolve('./dist'),
  rule: './custom-rules/advanced.js'
};

// Sync build
try {
  build({ ...baseConfig, ...config });
  console.log('✅ Build succeeded');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
```

#### 2. Parameters

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `input`   | string | No       | Input path (absolute/relative)  |
| `output`  | string | No       | Output path (auto-create dirs)  |
| `rule`    | string | No       | Rule file path (must export handler) |

## 6. Contribution Guide

We welcome contributions through:

1. Submit [Issues](https://github.com/your-repo/issues)
2. Open [Pull Requests](https://github.com/your-repo/pulls)
3. Improve [Example Rules](src/examples/ruleDir)

## 7. Project Support

If this project helps you, consider supporting maintenance:

• 🚀 Any amount - General support

• ☕ 5 CNY - Buy me a coffee

• 📚 10 CNY - Documentation improvements


| Alipay                             | WeChat Pay                          |
|----------------------------------|-------------------------------------|
| ![alipay](assets/alipay-qr.jpg)  | ![wechat](assets/wechat-qr.jpg)     |

### Donation Terms
1. All donations are voluntary gifts
2. No services or obligations are implied
3. No contractual relationship established
4. Minors must obtain guardian consent

## 8. Technical Support

Contact: <wangguoxv@163.com>