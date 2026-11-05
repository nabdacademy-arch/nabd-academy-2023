import assert from "node:assert/strict";
import {SYSTEMS,TOPICS,TOPIC_BY_ID,systemTopics,connectedIds,getFeatured,visibleRelated} from "../knowledge-data.mjs";
import {renderKnowledgeAtlas} from "../knowledge-atlas.mjs";
import {VISUAL_TOPICS} from "../medical-visuals.mjs";
assert.equal(SYSTEMS.length,10);
assert(TOPICS.length>=50,"only "+TOPICS.length+" concepts");
assert.equal(new Set(TOPICS.map(x=>x.id)).size,TOPICS.length);
assert.equal(new Set(SYSTEMS.map(x=>x.id)).size,10);
for(const group of SYSTEMS){
 assert(systemTopics(group.id).length>=6,group.id);
 assert.equal(systemTopics(group.id).length,group.ids.length);
 for(const id of group.ids)assert(TOPIC_BY_ID[id],"missing "+group.id+"/"+id);
 const focus=getFeatured(group.id,"not-a-node");assert.equal(focus.id,group.ids[0]);
 for(const n of group.ids){
  const near=visibleRelated(group.id,n,6);
  assert(near.every(x=>x.id!==n),group.id+"/"+n);
  assert(near.length<=6);
 }
}
const mediaIds=new Set(VISUAL_TOPICS.map(x=>x.id));
for(const topic of TOPICS){
 assert(topic.ar&&topic.en&&topic.summaryAr&&topic.summaryEn,topic.id);
 assert(topic.links.length>=2,topic.id+" needs relationships");
 for(const id of topic.links)assert(TOPIC_BY_ID[id],topic.id+" links to absent "+id);
 if(topic.image)assert(mediaIds.has(topic.image),topic.id+" missing image asset "+topic.image);
 assert(connectedIds(topic.id).length>=2,topic.id);
}
for(const lang of ["ar","en"])for(const group of SYSTEMS){
 for(const mode of ["map","cards","relations"]){
  const html=renderKnowledgeAtlas({language:lang,systemId:group.id,selectedId:group.ids[0],mode});
  assert(html.includes('class="knowledge-experience"'),group.id+"/"+lang+"/"+mode);
  assert(html.includes('class="knowledge-detail graph-detail"'),group.id);
  assert(html.includes('value="'+group.id+'" selected'),group.id);
  assert(html.includes('id="knowledge-system"'));
  assert(html.includes('data-graph-view="'+mode+'" aria-pressed="true"'));
  assert(html.includes("OpenStax"));
  assert(!html.includes("<script"));
  if(mode==="map")assert(html.includes('knowledge-network'),group.id);
  if(mode==="cards")assert(html.includes('knowledge-card-grid'),group.id);
  if(mode==="relations")assert(html.includes('knowledge-relations'),group.id);
 }
}
assert(renderKnowledgeAtlas({selectedId:"hemoglobin"}).includes("الهيموغلوبين"));
const imgCount=TOPICS.filter(x=>x.image).length;
assert(imgCount>=25,"expected abundant anatomy illustrations");
console.log("PASS: "+SYSTEMS.length+" systems, "+TOPICS.length+" connected bilingual topics, "+imgCount+" organ illustration placements and three safe UI modes.");
