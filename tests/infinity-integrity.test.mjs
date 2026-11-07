import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
import {pathToFileURL} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("infinity/index.html"),css=read("infinity/style.css"),js=read("infinity/app.mjs"),sw=read("infinity/sw.js"),manifest=JSON.parse(read("infinity/manifest.webmanifest"));
const data=await import(pathToFileURL(resolve(root,"infinity/data.mjs")).href);
let n=0;function check(v,message){assert.ok(v,message);n++}
new Script(sw,{filename:"infinity/sw.js"});n++;
check(data.MODELS.length===6,"Six rotatable 3D anatomy choices");
check(data.MODELS.every(x=>/^https:\/\/cdn\.3dassets\.dev\/assets\/\d+\/v1\/model\.glb$/.test(x.asset)),"Explicit licensed source URLs only");
check(data.MODELS.every(x=>x.fact.ar&&x.fact.en&&x.source.startsWith("https://3dassets.dev/")),"Bilingual provenance and description");
check(data.MODELS.filter(x=>x.section).length===1,"Single transparent sectioned heart option");
check(data.MISSIONS.length===5&&data.MISSIONS.every(x=>x.questions.length===3),"Five complete three-step conceptual missions");
for(const m of data.MISSIONS)for(const q of m.questions){check(q.options.ar.length===3&&q.options.en.length===3,"Bilingual answer sets");check(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3,"Valid concept answer");check(q.why.ar&&q.why.en,"Explanatory feedback")}
check(data.LIBRARY.length>=7,"Curated mentor explanations");
check(data.BUILDINGS.length===6,"Six campus learning destinations");
check(html.includes('lang="ar" dir="rtl"'),"Arabic default");
for(const id of ["modelMenu","modelStage","modelHost","loadModel","missionMenu","missionContent","mentorForm","mentorInput","mentorSuggestions","chatLog","campusGrid","saveProgress","clearProgress","copyProgress"]){check(html.includes('id="'+id+'"'),"Missing interface "+id)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);check(new Set(ids).size===ids.length,"No duplicate IDs");
for(const m of js.matchAll(/\bby\("([^"]+)"\)/g))check(ids.includes(m[1]),"Missing DOM dependency "+m[1]);
for(const tag of html.match(/<[^>]*>/g)||[])if(tag.includes("data-ar="))check(tag.includes("data-en="),"Missing translation "+tag.slice(0,100));
check(css.includes("@media(max-width:600px)")&&css.includes("prefers-reduced-motion"),"Mobile and reduced motion");
check(js.includes("if(!state.store)return"),"Opt-in storage gate");
check(js.includes("resetToImage")&&js.includes("model-viewer")&&js.includes("ensureViewer"),"3D loader with fallback");
check(js.includes("No question uploads")&&(!/sendBeacon|XMLHttpRequest|eval\s*\(/.test(js)),"Grounded assistant without telemetry");
check(sw.includes('url.origin!==self.location.origin')&&sw.includes('request.method!=="GET"'),"Worker only handles same-origin GET");
check(!/portal\.html|supabase|admin\.html|cdn\.3dassets/.test(sw),"No account/API/3D CDN caching");
check(manifest.scope==="./"&&manifest.start_url==="./index.html","Scope restricted");
const main=read("index.html"),v11=read("v11/index.html");
check(main.includes('href="infinity/"')&&main.includes('id="human-universe-v11"'),"Homepage integrated; V11 preserved");
check(v11.includes('href="../infinity/"')&&v11.includes('id="commandDeck"'),"Existing V11 dashboard preserved");
for(const r of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){const href=r[1];if(href.startsWith("#")||/^(https?:|data:)/.test(href))continue;const path=href.split(/[?#]/)[0];if(!path)continue;let target=resolve(root,"infinity",path);if(path.endsWith("/"))target=resolve(target,"index.html");check(existsSync(target),"Missing route "+href)}
console.log("NABD INFINITY static integration checks passed: "+n+" assertions.");
