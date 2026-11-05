import assert from "node:assert/strict";
import {VISUAL_TOPICS,pickVisualTopics,commonsImage,commonsSource} from "../medical-visuals.mjs";
const expected=[
 ["القلب والدورة الدموية","heart"],["Explain heart anatomy","heart"],["pulmonary circulation","heart"],
 ["الرئتان والتبادل الغازي","lung"],["How do lungs work?","lung"],
 ["أجزاء الدماغ","brain"],["Brain stem and neurons","brain"],
 ["وظيفة الكلى","kidney"],["Renal filtration","kidney"],
 ["المعدة والهضم","stomach"],["Digestive enzymes","digestive"],
 ["وظيفة الكبد","liver"],["What does the pancreas do?","pancreas"],
 ["عظام الإنسان","skeleton"],["muscle contraction","muscles"],
 ["طبقات الجلد","skin"],["تكوين الصورة في العين","eye"],
 ["الأذن والسمع","ear"],["الغدة الدرقية","thyroid"],
 ["فحص المثانة","urinary"],["رحم ومبيض","reproductive"],
 ["المرارة والقنوات","gallbladder"],["أعضاء الجسم","body"]
];
for(const [q,id] of expected)assert(pickVisualTopics(q).some(t=>t.id===id),q+" should have "+id);
assert.equal(new Set(VISUAL_TOPICS.map(x=>x.id)).size,19);
assert.equal(new Set(VISUAL_TOPICS.map(x=>x.file)).size>=16,true);
assert.equal(pickVisualTopics("heart",1).length,1);
assert.equal(pickVisualTopics("heart",0).length,0);
assert.deepEqual(pickVisualTopics("ما هي نظرية السببية؟"),[]);
assert.deepEqual(pickVisualTopics("<script>alert(1)</script>"),[]);
assert(pickVisualTopics("القلب والرئتان والدماغ").length<=3);
for(const item of VISUAL_TOPICS){
 const link=commonsSource(item.file),image=commonsImage(item.file);
 assert(link.startsWith("https://commons.wikimedia.org/wiki/File:"));
 assert(image.startsWith("https://commons.wikimedia.org/wiki/Special:FilePath/"));
 assert(image.includes("?width=700"));
 assert(item.author&&item.license);
}
console.log("PASS: nineteen sourced medical media topics, bilingual matching, safe fixed-source links and bounded result selection.");
