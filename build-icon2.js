const fs = require('fs');
const path = require('path');

async function main() {
    const ResEdit = await import('resedit');
    // import * as PELibrary from 'pe-library';
    const PELibrary = await import('pe-library');

    const exePath = path.join(__dirname, 'dist', 'rule-process.exe');
    const icoPath = path.join(__dirname, 'assets', 'icon.ico');

    if (!fs.existsSync(exePath)) throw new Error(`EXE 未生成，请先运行 pkg 命令: ${exePath}`);
    if (!fs.existsSync(icoPath)) throw new Error(`图标文件不存在: ${icoPath}`);

    // 读取原始EXE文件到Buffer
    const data = fs.readFileSync(exePath);
    // 将Buffer转换为可编辑的PE结构对象
    // (Node.js的Buffer对象可以直接传递给NtExecutable.from)
    const exe = PELibrary.NtExecutable.from(data);
    // 从PE结构中提取资源数据
    const res = PELibrary.NtExecutableResource.from(exe);

    // 读取ICO图标文件
    const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));

    // 调用图标替换函数 （32512是Windows默认主图标ID）
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
        res.entries,           // 目标资源条目集合
        32512,                   // 要替换的图标组资源ID（需与原始EXE中定义的ID一致）
        1033,                  // 语言ID（1033对应en-US）
        iconFile.icons.map(    // 将ICO文件中的图标转换为资源格式
            (item) => item.data  // 提取每个图标的二进制数据
        )
    );

    console.log('✅ 图标更新成功');
}

main().catch(err => console.error('❌ 错误:', err.message));