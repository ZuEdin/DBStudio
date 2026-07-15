const fs = require('fs');

function unfixFile(file, functionName) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove the previous preprocessing block
    content = content.replace(/const processedTables = tables\.map\([\s\S]*?const root = `Frontend`;/m, 'const root = `Frontend`;');
    
    // Replace processedTables and processedQueries back to tables and queries
    content = content.replace(/processedTables/g, 'tables');
    content = content.replace(/processedQueries/g, 'queries');
    
    fs.writeFileSync(file, content);
}

unfixFile('utils/generators/reactGenerator.ts', 'generateReact');
unfixFile('utils/generators/angularGenerator.ts', 'generateAngular');
