"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const portals=[
 "index.html","portal.html","admin.html","nabd-moodle.html",
 "scholarships.html","scholarship-manager.html","quality-exams.html",
 "student-exams.html","open-doors-masters.html","motivation-studio.html","learning/index.html",
 "nabd-university-360.html","nabd-connect.html","research.html","course.html"
];
test("all critical page entrypoints exist",()=>{
 for(const page of portals)assert.ok(fs.existsSync(path.join(root,page)),page+" missing");
});
test("all critical pages load existing local JS and CSS",()=>{
 const missing=[];
 for(const page of portals){
  const html=fs.readFileSync(path.join(root,page),"utf8");
  const tags=html.match(/<(script|link)\b[^>]*>/gi)||[];
  for(const tag of tags){
   const isScript=/^<script\b/i.test(tag);
   if(!isScript&&!/rel\s*=\s*["']stylesheet["']/i.test(tag))continue;
   const match=tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i);
   if(!match)continue;
   const value=match[1].split("?")[0].split("#")[0];
   if(!value||/^(?:[a-z]+:|\/\/|#)/i.test(value)||value.includes("{{"))continue;
   const p=path.resolve(root,path.dirname(page),decodeURIComponent(value));
   if(!p.startsWith(root+path.sep)||!fs.existsSync(p))missing.push(page+" -> "+match[1]);
  }
 }
 assert.deepEqual(missing,[],"Broken relative JS/CSS links");
});
test("frontend Supabase config is publishable, not a service-role secret",()=>{
 const config=fs.readFileSync(path.join(root,"assets/js/config.js"),"utf8");
 assert.match(config,/zsmmmljgguycrvyrmakl\.supabase\.co/);
 assert.match(config,/sb_publishable_/);
 assert.doesNotMatch(config,/sb_secret_|service_role/i);
});
test("scholarship manager isolates its auth session from students",()=>{
 const html=fs.readFileSync(path.join(root,"scholarship-manager.html"),"utf8");
 const js=fs.readFileSync(path.join(root,"assets/js/scholarship-center.js"),"utf8");
 assert.doesNotMatch(html,/src=["']assets\/js\/supabase-client\.js/i);
 assert.match(js,/nabd-scholarships-manager-auth-v1/);
});
