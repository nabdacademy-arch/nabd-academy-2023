import assert from "node:assert/strict";
import {handleTutor as modular} from "../../supabase/functions/nabd-tutor/index.ts";
import {handleTutor as standalone} from "../../supabase/manual/nabd-tutor.ts";
const base={SUPABASE_URL:"https://academy.test",SUPABASE_ANON_KEY:"public-test",GROQ_API_KEY:"groq-test",GEMINI_API_KEY:"gemini-test"};
const env=name=>base[name];
const req=(body,headers={})=>new Request("https://edge.test/functions/v1/smart-processor",{
 method:"POST",headers:{Authorization:"Bearer learner","Content-Type":"application/json",Origin:"https://nabdacademy-arch.github.io",...headers},body:JSON.stringify(body)
});
const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9X91J4IAAAAASUVORK5CYII=";
function mock(quota=true){return async url=>{
 if(url.endsWith("/auth/v1/user"))return Response.json({id:"u1"});
 if(url.endsWith("take_tutor_slot"))return Response.json(quota);
 if(url.includes("api.groq.com"))return Response.json({choices:[{message:{content:"Groq educational answer"}}]});
 if(url.includes("generativelanguage.googleapis.com"))return Response.json({candidates:[{content:{parts:[{text:"Gemini educational image description"}]}}]});
 throw Error("Unexpected endpoint: "+url);
}}
for(const sample of [
 {body:{question:"Explain a medical term"},status:200},
 {body:{question:"Explain medical image",image:png},status:200},
 {body:{question:"Explain"},headers:{Authorization:""},status:401},
 {body:{question:"Explain"},headers:{Origin:"https://other.test"},status:403},
 {body:{question:"Explain",image:"data:image/png;base64,AAAA"},status:400},
 {body:{question:"Explain"},quota:false,status:429},
 {body:{question:"Explain"},missing:true,status:503}
]){
 const v=sample.missing?()=>null:env;
 const a=await modular(req(sample.body,sample.headers),v,mock(sample.quota!==false));
 const b=await standalone(req(sample.body,sample.headers),v,mock(sample.quota!==false));
 assert.equal(a.status,sample.status);assert.equal(b.status,sample.status);
 assert.deepEqual(await a.json(),await b.json());
 assert.equal(b.headers.get("cache-control"),"no-store");
}
console.log("PASS: modular Groq/Gemini handler and one-file Supabase index.ts match across 7 scenarios.");
