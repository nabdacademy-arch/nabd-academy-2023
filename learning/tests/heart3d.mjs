import assert from "node:assert/strict";
import {CHAMBERS,FLOW_PATHS,createHeartWebGL} from "../heart-webgl.mjs";
assert.equal(Object.keys(CHAMBERS).length,4);
assert.deepEqual(Object.keys(FLOW_PATHS).sort(),["blue","red"]);
for(const [name,part] of Object.entries(CHAMBERS)){
 assert.equal(part.center.length,3);
 assert.equal(part.scale.length,3);
 assert.equal(part.color.length,3);
 assert(part.scale.every(n=>n>0&&n<2),name+" invalid scale");
 assert(part.color.every(n=>n>=0&&n<=1),name+" invalid color");
}
for(const [route,segments] of Object.entries(FLOW_PATHS)){
 assert.equal(segments.length,4);
 for(const segment of segments){
  assert.equal(segment.length,4);
  for(const point of segment)assert(point.length===3&&point.every(n=>Number.isFinite(n)));
 }
 for(let i=0;i<segments.length-1;i++)
  assert.deepEqual(segments[i][3],segments[i+1][0],route+" must be continuous");
}
assert.equal(createHeartWebGL(null),null);
assert.equal(createHeartWebGL({getContext:()=>null}),null);
console.log("PASS: four named cardiac chambers, continuous deoxygenated/oxygenated 3D pathways and graceful no-WebGL fallback.");
