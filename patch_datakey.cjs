const fs = require('fs');
const path = './features/pages/custom_components/components/PreviewPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/s\.dataKey \|\| idx/g, "s.key || idx");
content = content.replace(/s\.dataKey \|\| 'value'/g, "s.key || 'value'");
content = content.replace(/configObj\.series\?\.\[0\]\?\.dataKey/g, "configObj.series?.[0]?.key");

fs.writeFileSync(path, content);
console.log('Patched dataKey to key!');
