# rule-process

## 1. Project Introduction

**rule-process** is a flexible file rule processing tool that supports batch file operations, directory structure transformation, and custom rule scripting.  
- Invoked via CLI; enters wizard mode when launched with no arguments or by double-click  
- Flexible definition of input/output directories and rule scripts  
- Suitable for batch file renaming, content transformation, and similar scenarios

## 2. Installation
> Node.js >= 18.20.4
>
```bash
npm install -g rule-process
```

## 3. Directory Structure

```
├── src/             # Source code
│   ├── index.js     # CLI entry
│   ├── examples/    # Example files
│   ├── core/        # Core logic
│   ├── interface/   # Plugin system
│   ├── preprocess/  # Dependency preprocessing
│   └── utils/       # Utility methods
├── package.json
├── README.md
└── README-zh.md
```

## 4. Usage

### 4.1 Basic Commands

| Command | Description |
|----------------------|---------------------|
| `rule-process init` | Create example files and config.ini on the host (first run) |
| `rule-process run [options]` | Execute rule processing (main command) |
| `rule-process install <plugins...>` | Install plugins in batch |
| `rule-process list` | List plugins (local/remote) |
| `rule-process uninstall [plugins...]` | Uninstall plugins (all when no name is given) |
| `rule-process -v` / `rule-process -h` | Show version / help |

> Launching with no arguments or by double-click enters wizard mode: it auto-detects whether the project is initialized and runs init or run.

### 4.2 run Command Options

| Option               | Description                       | Default                       |
|----------------------|-----------------------------------|-------------------------------|
| `-i, --input <path>` | Input path (file or directory)    | `./examples/inputDir`         |
| `-o, --output <path>`| Output directory                 | `./examples/outputDir`        |
| `-r, --rule <path>`  | Rule file (single JS file or directory, loaded in filename order) | `./examples/ruleDir` |
| `-d, --display`      | Disable all log output            | `false`                       |
| `-s, --size <MB>`    | Force change file read size limit (MB) | `200`                     |
| `-e, --encode <enc>` | Force input file encoding (e.g. utf8, base64, latin1) | Auto-detect by extension |
| `-l, --level <lvl>`  | Log level: number 1-5 or ERROR/WARN/INFO/DEBUG/VERBOSE | `VERBOSE` |
| `-c, --config <path>`| Parse a config file (.ini/.js, auto-created if missing) | `./config.ini` |

### 4.3 Other Command Options

- `init`: `-r, --run` run the demo automatically after initialization; `-k, --vosk` create vosk speech-recognition dependencies (deprecated)
- `install <plugins...>`: `-s, --source <gitee|github>` download source, default `gitee`
- `list`: `-t, --type <local|remote>` read type, default `local`; `-s, --source <gitee|github>` remote source, default `gitee`
- `uninstall [plugins...]`: `-f, --force` also remove the plugin's related npm dependencies

### 4.4 Example

```bash
rule-process init
```

```bash
rule-process run
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

## 6. Disclaimer

This project is open source and for learning and research purposes only.  
Any direct or indirect losses arising from the use of this project are the sole responsibility of the user, and the project author assumes no legal liability.  
Do not use this project for any illegal purposes or to infringe upon the rights of others.

        