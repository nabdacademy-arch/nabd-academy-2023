import {mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const html=await readFile('index.html','utf8');
const pack=JSON.parse(await readFile('offline-data.encrypted.json','utf8'));
if(!pack.ciphertext||!pack.iv||!pack.sha256||pack.ciphertext.length<100000)throw new Error('Full encrypted question bank is missing');
if(/cdn\.jsdelivr\.net|createClient\(|supabase\.co/.test(html))throw new Error('Unexpected network-dependent client code');
if(!html.includes('Open Doors Exam Coach')||!html.includes('offline-data.encrypted.json'))throw new Error('Original Open Doors coach or offline loader missing');
const m=html.match(/<script type="module">([\s\S]*?)<\/script>/);
if(!m)throw new Error('Expected embedded Open Doors module is missing');
await writeFile('.verify-open-doors.mjs',m[1]);
try{execFileSync(process.execPath,['--check','.verify-open-doors.mjs'],{stdio:'inherit'});}finally{await rm('.verify-open-doors.mjs',{force:true});}
await mkdir('www',{recursive:true});
await Promise.all([copyFile('index.html','www/index.html'),copyFile('offline-data.encrypted.json','www/offline-data.encrypted.json')]);
console.log('NABD encrypted offline bank + complete coach bundled; static script validated');
