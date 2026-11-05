import assert from "node:assert/strict";
import {VISUAL_TOPICS,pickVisualTopics,commonsImage,commonsSource} from "../medical-visuals.mjs";
const expected=[
 ["القلب والدورة الدموية","heart"],["Explain heart anatomy","heart"],["pulmonary circulation","heart"],
 ["الرئتان والتبادل الغازي","lung"],["How do lungs work?","lung"],
 ["أجزاء الدماغ","brain"],["Brain stem and neurons","brain"],
 ["وظيفة الكلى","kidney"],["Renal filtration","kidney"],
 ["المعدة والهضم","digestive"],["Digestive enzymes","digestive"]
];
for(const [q,id] of expected)assert(pickVisualTopics(q).some(t=>t.id===id),q+" should have "+id);
assert.equal(new Set(VISUAL_TOPICS.map(x=>x.id)).size,5);
assert.deepEqual(pickVisualTopics("ما هي نظرية السببية؟"),[]);
assert.deepEqual(pickVisualTopics("<script>alert(1)</script>"),[]);
assert(pickVisualTopics("القلب والرئتان والدماغ").length<=2);
for(const item of VISUAL_TOPICS){
 const link=commonsSource(item.file),image=commonsImage(item.file);
 assert(link.startsWith("https://commons.wikimedia.org/wiki/File:"));
 assert(image.startsWith("https://commons.wikimedia.org/wiki/Special:FilePath/"));
 assert(image.includes("?width=700"));
 assert(item.author&&item.license);
}
console.log("PASS: five sourced medical media topics, bilingual matching, safe fixed-source links and bounded result selection.");
