const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add back const root
    if (!content.includes("const root = `Frontend`;") && !content.includes("const root = 'Frontend';")) {
        content = content.replace(/const configFiles =/, "const root = `Frontend`;\n  const configFiles =");
    }
    
    fs.writeFileSync(file, content);
}

fixFile('utils/generators/reactGenerator.ts');

function fixAngular(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add back const root and appRoot
    if (!content.includes("const root = `Frontend`;")) {
        content = content.replace(/const \{ files: componentFiles/, "const root = `Frontend`;\n  const appRoot = `${root}/src/app`;\n  const useAuth = config.authConfig?.useUserLogin;\n  const { files: componentFiles");
    }
    
    fs.writeFileSync(file, content);
}

fixAngular('utils/generators/angularGenerator.ts');
