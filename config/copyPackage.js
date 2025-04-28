const fs = require('fs-extra');

// 复制 package.json
fs.copySync('package.json', 'package.json.bak');

// 移除不需要发布的字段（根据你的需求调整）
const pkg = require('../package.json');
delete pkg.bin;

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));