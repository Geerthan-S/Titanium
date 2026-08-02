import fs from 'node:fs';
import { resolve, join } from 'node:path';
import { parse } from 'node:path';

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file.startsWith('.') || file === 'dist' || file.startsWith('supabase')) return;
        file = resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findHtmlFiles(file));
        } else if (file.endsWith('.html')) {
            results.push(file);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(resolve(''));
const errors = [];
console.log('Auditing ' + htmlFiles.length + ' HTML files...');

for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const src = match[1];
        if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('${')) continue;
        let assetPath;
        if (src.startsWith('/')) {
            assetPath = join(resolve('public'), src);
            if (!fs.existsSync(assetPath)) assetPath = join(resolve(''), src);
        } else {
            assetPath = join(parse(file).dir, src);
        }
        if (assetPath && !fs.existsSync(assetPath)) {
            errors.push('Missing asset in ' + file + ': ' + src);
        }
    }
}
console.log(errors.length ? errors.join('\n') : 'No static broken image links found!');
