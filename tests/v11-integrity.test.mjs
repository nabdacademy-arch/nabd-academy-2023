import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const html=read("v11/index.html"),home=read("index.html"),v10=read("nabd-v10.html"),js=read("v11/app.js"),css=read("v11/style.css"),sw=read("v11/sw.js"),manifest=JSON.parse(read("v11/manifest.webmanifest"));
let count=0;function check(ok,message){assert.ok(ok,message);count++}
new Script(js,{filename:"v11/app.js"});new Script(sw,{filename:"v11/sw.js"});count+=2;
check(html.includes('lang="ar" dir="rtl"'),"Default Arabic/RTL");
check(html.includes('id="systemList"')&&html.includes('id="learningContent"'),"Interactive anatomy section");
check(html.includes('id="scenarioBody"')&&html.includes('id="progressStatus"'),"Reasoning & optional progress");
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check(new Set(ids).size===ids.length,"No duplicate V11 IDs");
for(const m of js.matchAll(/\$\("([^"]+)"\)/g))check(ids.includes(m[1]),"Missing app element "+m[1]);
for(const tag of html.match(/<[^>]+>/g)||[])if(tag.includes("data-ar="))check(tag.includes("data-en="),"Missing translation: "+tag.slice(0,70));
check(js.includes('id:"immune"')&&js.includes('id:"musculoskeletal"')&&js.includes('id:"cardiovascular"'),"Eight core modules present");
check(js.includes('id:"oxygen"')&&js.includes('id:"hydration"')&&js.includes('id:"movement"'),"Three fictional learning challenges");
check(js.includes('localStorage.setItem(STORE_KEY')&&js.includes('if(!privacySave)return'),"Local storage requires permission");
check(!/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|eval\s*\(/.test(js),"Static, no data upload or dynamic execution");
check(css.includes("@media(max-width:590px)")&&css.includes("prefers-reduced-motion"),"Mobile and reduced-motion designs");
check(home.includes('id="human-universe-v11"')&&home.includes('href="v11/"'),"Prominent homepage launch");
check(home.includes('id="v10-universe"')&&home.includes('id="nabd-unified-campus"'),"Earlier academy modules preserved");
check(v10.includes('href="v11/"'),"V10 links to V11");
check(manifest.scope==="./"&&manifest.start_url==="./index.html","PWA scope is local to V11");
check(sw.includes('url.pathname.startsWith(ROOT.pathname)')&&sw.includes('request.method!=="GET"'),"Only own GET requests intercepted");
check(!/portal\.html|admin\.html|supabase/.test(sw),"Worker cannot explicitly cache account/admin/backend");
for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){const href=m[1];if(href.startsWith("#")||/^(https?:|data:)/.test(href))continue;const p=href.split(/[?#]/)[0];if(!p)continue;let file=resolve(root,"v11",p);if(p.endsWith("/"))file=resolve(file,"index.html");check(existsSync(file),"Broken relative link "+href)}

const anatomyJS=read("v11/anatomy-3d.js"),anatomyCSS=read("v11/anatomy-3d.css");
new Script(anatomyJS,{filename:"v11/anatomy-3d.js"});count++;
check(html.includes('id="visual-atlas"')&&html.includes('id="a3dViewport"'),"Dimensional anatomy gallery integrated");
check(html.includes('id="a3dZoom"')&&html.includes('id="a3dFullImage"'),"Zoom and full-size links present");
check(home.includes('href="v11/#visual-atlas"'),"Homepage enters anatomy studio directly");
check(anatomyJS.includes("requestFullscreen")&&anatomyJS.includes("setZoom("),"Full-screen and zoom implementation");
check(anatomyCSS.includes("@media(max-width:650px)")&&anatomyCSS.includes("prefers-reduced-motion"),"Anatomy viewer is mobile and motion-safe");
check(!/localStorage|sessionStorage|sendBeacon|XMLHttpRequest|\bfetch\s*\(/.test(anatomyJS),"Gallery does not store or send data");
for(const m of anatomyJS.matchAll(/\bid\("([^"]+)"\)/g))check(ids.includes(m[1]),"Missing anatomy viewer node "+m[1]);
for(const organ of ["heart","brain","lungs","renal","digestive","endocrine","musculoskeletal","immune"]){
 const path="v11/art/"+organ+"-3d.svg",image=read(path);
 check(image.includes("<svg ")&&image.includes('viewBox="0 0 720 720"')&&image.includes("</svg>"),"Scalable vector art valid: "+organ);
 check(image.includes("<title>")&&image.includes("educational"),"Illustration semantics and disclaimer: "+organ);
 check(!/<script\b|<foreignObject\b|xlink:href="https?:/i.test(image),"Artwork contains no active or external resources: "+organ);
 check(sw.includes("./art/"+organ+"-3d.svg"),"Art cached for offline use: "+organ);
}
check(sw.includes("nabd-v11-static-v4")&&sw.includes("./anatomy-3d.js?v=1"),"Offline shell upgraded for reference anatomy dashboard");
const deckJS=read("v11/deck.js"),deckCSS=read("v11/deck.css"),humanSVG=read("v11/art/human-neon.svg");
new Script(deckJS,{filename:"v11/deck.js"});count++;
check(html.includes('id="commandDeck"')&&html.includes('id="deckSystemList"'),"New reference dashboard is primary interface");
check(html.includes('id="deckOrganImage"')&&html.includes('id="deckInfoText"')&&html.includes('id="deckTabs"'),"Anatomy visual, detailed info and tabs");
check(html.includes('id="deckZoomIn"')&&html.includes('id="deckReset"')&&html.includes('id="deckVesselLayer"'),"Functional display controls");
check(html.includes('id="deckTrue3D"')&&deckJS.includes('$("deckTrue3D").addEventListener'),"Actual rotatable heart model linked from deck");
check(sw.includes("./deck.css?v=2")&&html.includes("./deck.css?v=2"),"Fresh mobile styling included offline");
check(deckCSS.includes("grid-template-areas:")&&deckCSS.includes("@media(max-width:480px)"),"Desktop and mobile dashboard layouts");
check((html.match(/class="deck-tile(?: gold)?"/g)||[]).length===5,"Five user-requested action shortcuts");
check(humanSVG.includes("<svg ")&&humanSVG.includes("</svg>"),"Neon body illustration exists");
check(sw.includes("./deck.js?v=2")&&sw.includes("./art/human-neon.svg"),"All dashboard assets cached");
for(const m of deckJS.matchAll(/\$\("([^"]+)"\)/g))check(ids.includes(m[1]),"Missing dashboard UI node "+m[1]);

console.log("NABD V11 source integrity passed: "+count+" assertions.");
