const fs = require('fs'), p = require('path');
fs.readdirSync('./dist').forEach(f => {
    const full = p.join('./dist', f);
    if (f.endsWith('.exe') || f === 'rule-process-linux' || f === 'rule-process-macos')
        fs.unlinkSync(full)
})