import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
const base = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => readFileSync(join(base,p),"utf8");
const gateways=[
"portal.html","portal/index.html","lecturers.html","nabd-360-lecturers.html","admin.html","nabd-ai-executive.html",
"university-os.html","executive-application.html","application-status.html","nabd-connect.html","nabd-campus.html",
"campus.html","nabd-university-360.html","nabd-one.html","nabd-global-research.html","research-office.html",
"research-starter-lab.html","nabd-partners.html","academy.html","global-lectures.html","medical-consultations.html",
"learning/index.html","nabd-v10.html","nabd-2050.html","nabd-hope.html"];
const js=read("assets/js/nabd-gateway-system.js"),css=read("assets/css/nabd-gateway-system.css");
new Script(js,{filename:"nabd-gateway-system.js"});
assert.ok(!/eval\s*\(/.test(js),"No eval");
assert.ok(css.includes("max-width:670px")&&css.includes("prefers-reduced-motion"),"Responsive/accessibility CSS");
assert.ok(js.includes("setAttribute(\"aria-labelledby\"")&&js.includes("aria-label"),"Accessible introduction");
assert.ok(js.includes("localStorage.setItem(\"nabdGatewayLanguage\""),"Independent language choice");
for(const file of gateways){
  assert.ok(existsSync(join(base,file)),file+" exists");
  const html=read(file);
  const prefix=file.includes("/")?"../":"";
  assert.ok(html.includes(prefix+"assets/css/nabd-gateway-system.css?v=1"),file+" CSS injection");
  assert.ok(html.includes(prefix+"assets/js/nabd-gateway-system.js?v=1"),file+" JS injection");
  assert.ok(js.includes('"'+file+'":{')||js.includes('"'+file+'": {'),file+" theme config");
  assert.equal((html.match(/nabd-gateway-system\.js\?v=1/g)||[]).length,1,file+" one gateway script");
}
for(const [file,markers] of Object.entries({
"portal.html":['id="signInForm"','id="signUpForm"'],
"lecturers.html":['id="studio-auth"','id="studio-record"'],
"admin.html":['id="loginForm"','id="app"'],
"nabd-ai-executive.html":['id="loginForm"','id="authPanel"'],
"university-os.html":['id="osLoginForm"','id="osGate"'],
"research-office.html":['id="authForm"','id="loginArea"'],
"executive-application.html":['id="applicationForm"'],
"nabd-360-lecturers.html":['id="n360-faculty-form"']
})){
  const html=read(file);
  for(const mark of markers)assert.ok(html.includes(mark),file+": "+mark+" preserved");
}
for(const name of ["student","faculty","volunteer","administration","council","executive","research","researchoffice","partnerships","campus","academic","communications","consultations","innovation","scholarship"])
  assert.ok(css.includes(".nabd-gate--"+name),name+" theme");
assert.ok(js.includes('root.setAttribute("lang","ar")')||js.includes('root.setAttribute("lang","ar"'),"Language scoped to gateway only");
assert.ok(js.includes('slot.appendChild(target)')&&js.includes('cfg.move'),"Existing sign-in fields reused, not replaced");
console.log("NABD gateways verified: "+gateways.length+" route integrations, theme identities, original auth forms and bilingual responsive design.");
