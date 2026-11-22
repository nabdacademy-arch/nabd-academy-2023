"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const admin=read("admin.html"),student=read("portal.html"),faculty=read("lecturers.html");
const css=read("assets/css/nabd-workspaces-organized.css"),script=read("assets/js/nabd-admin-module-finder.js");
test("all three internal workspaces use isolated styles; homepage remains untouched",()=>{
 for(const page of [admin,student,faculty])assert.match(page,/assets\/css\/nabd-workspaces-organized\.css\?v=1/);
 assert.doesNotMatch(read("index.html"),/nabd-workspaces-organized/);
 for(const cls of [".nabd-admin-page",".nabd-student-workspace",".nabd-lecturer-page"])assert.ok(css.includes(cls));
});
test("director finder preserves role checks and existing native tab buttons",()=>{
 for(const id of ["nabdAdminModuleFinder","nabdAdminCategory","nabdAdminSearch","nabdAdminResults"])assert.ok(admin.includes('id="'+id+'"'));
 assert.match(admin,/src="assets\/js\/nabd-admin-module-finder\.js\?v=1"/);
 assert.match(admin,/profile\.role!=="admin"/);
 assert.match(admin,/id="loginForm"/);
 for(const id of ["students","overview","applications","councilAccounts","consultations"])assert.ok(admin.includes('data-tab="'+id+'"'));
 assert.match(script,/\.observe\(tabs,\{childList:true\}\)/);
 assert.match(script,/node\.hidden=!show/);
 assert.match(script,/groups\.essential/);
 assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|indexedDB|document\.cookie|supabase|db\./);
});
test("student dashboard retains all service routes and accessible logout",()=>{
 const st=student.indexOf('<div class="dashboard-actions"'),en=student.indexOf('<!-- =================================================',st);
 const section=student.slice(st,en);
 assert.match(section,/id="logoutButton"/);
 assert.match(section,/<details class="portal-more-actions">/);
 for(const link of ["nabd-moodle.html","learning/","university-os.html","lecturers.html","academy.html","index.html#courses"])assert.ok(section.includes('href="'+link+'"'));
 assert.ok(section.indexOf('id="logoutButton"')<section.indexOf('<details class="portal-more-actions">'));
});
test("faculty shortcuts stay inside authenticated workspace and have real targets",()=>{
 assert.match(faculty,/<section id="studio-workspace" hidden><nav class="nabd-faculty-shortcuts"/);
 for(const id of ["os-lecturer-suite","studio-records-section"])assert.ok(faculty.includes('href="#'+id+'"')&&faculty.includes('id="'+id+'"'));
 assert.match(faculty,/id="studio-login"/);
 assert.match(faculty,/id="studio-editor"/);
});
