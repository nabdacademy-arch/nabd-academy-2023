import assert from 'node:assert/strict';
import {handleTutor as modular} from '../../supabase/functions/nabd-tutor/index.ts';
import {handleTutor as standalone} from '../../supabase/manual/nabd-tutor.ts';
const env=name=>({SUPABASE_URL:'https://academy.test',SUPABASE_ANON_KEY:'public-test',OPENAI_API_KEY:'provider-test'}[name]);
const makeRequest=(body,headers={})=>new Request('https://edge.test/nabd-tutor',{method:'POST',headers:{Authorization:'Bearer learner-test','Content-Type':'application/json',Origin:'https://nabdacademy-arch.github.io',...headers},body:JSON.stringify(body)});
function fakeFetcher(quota=true){return async(url)=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:'u1'});
 if(url.endsWith('take_tutor_slot'))return Response.json(quota);
 if(url==='https://api.openai.com/v1/responses')return Response.json({output:[{content:[{type:'output_text',text:'Educational explanation [medterms]'}]}]});
 throw Error('Unexpected request');
}}
for(const scenario of [
 {body:{question:'Explain a medical word'},headers:{},quota:true,status:200},
 {body:{question:'Explain'},headers:{Authorization:''},quota:true,status:401},
 {body:{question:'Explain'},headers:{Origin:'https://other.test'},quota:true,status:403},
 {body:{question:'Explain',image:'data:image/png;base64,AAAA'},headers:{},quota:true,status:400},
 {body:{question:'Explain'},headers:{},quota:false,status:429},
 {body:{question:'Explain'},headers:{},quota:true,status:503,missing:true}
]){
 const values=scenario.missing?()=>null:env;
 const a=await modular(makeRequest(scenario.body,scenario.headers),values,fakeFetcher(scenario.quota));
 const b=await standalone(makeRequest(scenario.body,scenario.headers),values,fakeFetcher(scenario.quota));
 assert.equal(b.status,scenario.status);assert.equal(a.status,b.status);assert.deepEqual(await a.json(),await b.json());
 assert.equal(b.headers.get('cache-control'),'no-store');
}
console.log('PASS: standalone dashboard function matches modular security and response behavior for six scenarios. All requests were mocked.');
