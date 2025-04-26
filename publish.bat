@echo off
REM 备份 package.json
copy package.json package.json.bak

REM 移除 bin 字段，保留 files 字段，只发布 dist
node -e "let pkg=require('./package.json');delete pkg.bin;require('fs').writeFileSync('package.json',JSON.stringify(pkg,null,2));"

REM 发布到 npm
npm publish