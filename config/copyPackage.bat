@echo off
REM 备份 package.json
copy package.json package.json.bak

REM 移除 bin 字段，保留 files 字段，只发布 dist
node -e "let pkg=require('./package.json');delete pkg.bin;require('fs').writeFileSync('package.json',JSON.stringify(pkg,null,2));"

REM 发布到 npm 执行后，后续内容会被迫中断
REM npm publish

REM 正在执行操作，3秒后继续...
REM timeout /T 3 /NOBREAK
REM 继续执行后续操作

REM 文件还原
REM move /Y package.json.bak package.json