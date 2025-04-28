const fs = require('fs-extra');
fs.moveSync('package.json.bak', 'package.json', { overwrite: true });