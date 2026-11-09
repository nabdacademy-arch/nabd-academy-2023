import assert from "node:assert/strict";
import {readFileSync,existsSync,statSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=name=>readFileSync(path.join(root,name),"utf8");
const home=read("index.html"),full=read("academy-full.html");
const start=home.indexOf('<div class="neo-site"'),end=home.indexOf('<div id="nabdLegacyShell"');
assert.ok(start>=0&&end>start,"New compact homepage and preserved legacy shell");
const compact=home.slice(start,end);
assert.ok(full.length>200000,"The full original experience is backed up");
assert.ok(full.includes('id="courses"')&&full.includes('id="verify"')&&full.includes('id="founder"')&&full.includes('id="research"'),"Legacy courses, verification, founder and research remain");
assert.ok(home.includes('id="nabdLegacyShell" hidden')&&home.includes("#nabdLegacyShell{display:none!important}"),"No legacy section contributes to the primary page length");
assert.match(compact,/id="neo-programs"/);
assert.match(compact,/id="neo-about"/);
assert.match(compact,/id="neo-directory"/);
assert.match(compact,/id="neo-initiatives"/);
assert.match(compact,/assets\/images\/founder\.jpg/);
assert.match(compact,/href="nabd-hope\.html"/);
assert.match(compact,/href="academy-full\.html"/);
assert.match(compact,/data-neo-ar=/);
assert.match(compact,/data-neo-en=/);
assert.equal((compact.match(/class="neo-program"/g)||[]).length,3);
assert.equal((compact.match(/class="neo-feature /g)||[]).length,2);
assert.ok(home.includes("prefers-reduced-motion")&&home.includes("max-width:680px"),"Mobile and reduced-motion design");
assert.ok(home.includes('aria-expanded="false"')&&home.includes("neo-menu"),"Menu accessibility");
assert.ok(!/accredited university|government-approved scholarships/i.test(compact),"No unverified institutional claims");
const ids=new Set(Array.from(compact.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
const urls=Array.from(compact.matchAll(/\bhref="([^"]+)"/g),m=>m[1]);
for(const href of urls){
  if(href.startsWith("#")){assert.ok(ids.has(href.slice(1)),"Broken local section: "+href);continue}
  if(/^(https?:|mailto:|tel:)/.test(href))continue;
  const file=href.split("#")[0].split("?")[0];if(!file)continue;
  const absolute=path.resolve(root,file);
  assert.ok(absolute.startsWith(root+path.sep),"Path must remain inside repository: "+file);
  assert.ok(existsSync(absolute),"Missing linked route: "+file);
  if(statSync(absolute).isDirectory())assert.ok(existsSync(path.join(absolute,"index.html")),"No directory entry: "+file);
}
for(const match of compact.matchAll(/\bsrc="(assets\/[^"]+)"/g))assert.ok(existsSync(path.join(root,match[1])),"Missing image: "+match[1]);
console.log("NABD compact institutional homepage verified: portrait, sections, bilingual UI, legacy archive, and local links.");
