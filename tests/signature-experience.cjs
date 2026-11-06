"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname,"..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const html = read("index.html");
const signature = read("assets/js/nabd-signature.js");
const css = read("assets/css/nabd-signature.css");
assert.doesNotThrow(()=>new vm.Script(signature));
assert.match(html,/id="home"/);
assert.equal((html.match(/id="home"/g)||[]).length,1,"Exactly one homepage anchor");
assert.match(html,/class="nfs-hero"/);
assert.match(html,/أكاديمية نبض العلوم الطبية/);
assert.match(html,/NABD Academy of Medical Sciences/);
assert.match(html,/src="assets\/images\/founder\.jpg"/);
assert.match(html,/محمد خالد العرجا/);
assert.match(html,/href="#nabd-unified-campus"/);
assert.match(html,/data-nfs-search/);
assert.match(signature,/Escape/);
assert.match(signature,/ctrlKey\|\|e\.metaKey/);
assert.match(css,/:focus-visible/);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/max-width:700px/);
for(const page of [
 "nabd-campus.html","campus.html","portal.html","academy.html","lecturers.html","nabd-partners.html","global-lectures.html","policies.html","nabd-medical-knowledge.html","donate.html","application-status.html","course.html","enroll.html","executive-application.html","medical-consultations.html","research.html","skill-passport.html","update-password.html"
]){
 const pageHtml=read(page);
 assert.ok(pageHtml.includes("assets/css/nabd-signature.css"),page+": signature stylesheet");
 assert.ok(pageHtml.includes("assets/js/nabd-signature.js"),page+": navigation enhancement");
 assert.ok(!pageHtml.includes("أكاديمية نبض للعلوم الطبية"),page+": old Arabic institutional name");
}
assert.match(read("nabd-campus.html"),/nfs-featured-founder/);
assert.match(read("campus.html"),/nfs-featured-founder/);
assert.match(read("policies.html"),/not a degree-awarding university/);
for(const file of [
 "assets/images/founder.jpg",
 "assets/css/nabd-signature.css","assets/js/nabd-signature.js",
 "nabd-campus.html","campus.html","portal.html","academy.html",
 "lecturers.html","nabd-partners.html","global-lectures.html","index.html",
 "policies.html","atlas/index.html"
])assert.ok(fs.existsSync(path.join(root,file)),file+" must exist");
console.log("NABD Signature: structural, brand, founder, navigation and accessibility smoke checks passed.");
