"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const crypto=require("node:crypto").webcrypto;
const read=p=>fs.readFileSync(require("node:path").resolve(__dirname,"..",p),"utf8");
const html=read("impact-lab/index.html");
const js=read("impact-lab/app.js");
const css=read("impact-lab/app.css");
const sw=read("impact-lab/sw.js");
const home=read("index.html");
new vm.Script(js,{filename:"impact-lab/app.js"});
new vm.Script(sw,{filename:"impact-lab/sw.js"});
const modules=["ai","truth","vault","blackbox","hours","lifeline"];
for(const name of modules){
 assert.ok(html.includes('data-module="'+name+'"'),"Missing module tab "+name);
 assert.ok(html.includes('data-panel="'+name+'"'),"Missing module panel "+name);
 assert.ok(html.includes('id="tab-'+name+'"'),"Missing accessible tab "+name);
 assert.ok(html.includes('id="panel-'+name+'"'),"Missing labelled panel "+name);
}
assert.match(home,/href="impact-lab\/"/,"One-click homepage entry point");
assert.match(html,/app\.js\?v=1/);
assert.match(html,/app\.css\?v=2/);
assert.match(css,/focus-visible/,"Keyboard-visible focus");
assert.match(css,/prefers-reduced-motion/,"Reduced-motion support");
assert.match(css,/@media\(max-width:580px\)/,"Mobile layout");
assert.match(sw,/nabd-impact-v2/);
assert.match(sw,/url\.pathname\.includes\("\/impact-lab\/"\)/,"Cache scope only to this folder");
assert.ok(!/\bfetch\s*\(/.test(js),"User-generated content is not transmitted to backend");
assert.match(js,/textContent=String\(content\)/,"User input inserted using textContent");
assert.match(js,/protocol==="https:"/,"Claims evidence URL validation");
assert.match(js,/already a published verification|not automatically|NOT an automated truth/i);
assert.match(js,/NABD_VAULT_V1/,"Versioned encrypted file container");
assert.match(js,/AES-256-GCM/);
assert.match(js,/310000/,"Deliberate key-stretching work factor");
assert.match(js,/globalThis\.crypto\?\.subtle/);
assert.match(js,/missing|not published|not a distributed backup|not submitted/i);

const safeStart=js.indexOf("function safeFileName(name)");
const safeEnd=js.indexOf("function download(",safeStart);
const cryptoStart=js.indexOf("const MAX_FILE=");
const cryptoEnd=js.indexOf('$("vault-encrypt").addEventListener',cryptoStart);
assert.ok(safeStart>=0&&safeEnd>safeStart&&cryptoStart>=0&&cryptoEnd>cryptoStart,"Crypto implementation is present");
const vaultCode=js.slice(safeStart,safeEnd)+"\n"+js.slice(cryptoStart,cryptoEnd)+
 "\n({encryptFile,decryptArchive});";
const ctx={crypto,Blob,TextEncoder,Uint8Array,btoa,atob};
const vault=vm.runInNewContext(vaultCode,ctx);
const payload=new TextEncoder().encode("NABD sample research preservation text 2026");
const input={
 name:"test.txt",type:"text/plain",size:payload.length,
 arrayBuffer:async()=>payload.buffer.slice(payload.byteOffset,payload.byteOffset+payload.byteLength)
};
(async()=>{
 const password="VeryStrongTestPassphrase_2026";
 const archive=await vault.encryptFile(input,password);
 assert.equal(archive.format,"NABD_VAULT_V1");
 assert.equal(archive.iterations,310000);
 assert.equal(archive.size,payload.length);
 assert.ok(!archive.ciphertext.includes("research preservation"),"No plaintext in archive");
 const decrypted=await vault.decryptArchive(archive,password);
 assert.equal(await decrypted.text(),new TextDecoder().decode(payload),"AES-GCM roundtrip");
 await assert.rejects(()=>vault.decryptArchive(archive,"IncorrectPassword"));
 const tampered=JSON.parse(JSON.stringify(archive));
 tampered.ciphertext=tampered.ciphertext.slice(0,-4)+"AAAA";
 await assert.rejects(()=>vault.decryptArchive(tampered,password),"Tampering must be rejected");
 await assert.rejects(()=>vault.encryptFile(input,"short"));
 const tooLarge={...input,size:9*1024*1024};
 await assert.rejects(()=>vault.encryptFile(tooLarge,password));
 const phrasesStart=js.indexOf("const PHRASES=");
 const phrasesEnd=js.indexOf("const voiceLang=",phrasesStart);
 const phraseCode=js.slice(phrasesStart,phrasesEnd)+"\nPHRASES";
 const phrases=vm.runInNewContext(phraseCode,{});
 assert.equal(phrases.length,14);
 assert.ok(phrases.every(p=>["ar","en","fr","es","tr"].every(l=>typeof p[l]==="string"&&p[l].length>5)));
 console.log("NABD Impact Lab: six integrated modules, accessible UI, local privacy, multilingual content and AES-GCM verified.");
})().catch(e=>{console.error(e);process.exitCode=1});
