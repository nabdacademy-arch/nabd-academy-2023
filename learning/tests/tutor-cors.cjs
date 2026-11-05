/* Real Chromium CORS enforcement against two local origins; all provider/Auth traffic is mocked. */
const http=require('node:http');const assert=require('node:assert/strict');const {chromium}=require('playwright');
const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port)));
(async()=>{
 const {handleTutor}=await import('../../supabase/functions/nabd-tutor/index.ts');
 let providerCalls=0,oldPosts=0;
 const front=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>NABD CORS test</title>')});
 const appOrigin=await listen(front);
 const env=name=>({NABD_APP_ORIGIN:appOrigin+'/a/path/',SUPABASE_URL:'https://academy.test',SUPABASE_PUBLISHABLE_KEYS:JSON.stringify({default:'public-test'}),OPENAI_API_KEY:'provider-test'}[name]);
 const fetcher=async(url,options)=>{
  if(url.endsWith('/auth/v1/user'))return options.headers.Authorization==='Bearer valid-student'?Response.json({id:'u1'}):Response.json({error:'invalid token'},{status:401});
  if(url.endsWith('take_tutor_slot'))return Response.json(true);
  if(url==='https://api.openai.com/v1/responses'){providerCalls++;return Response.json({output:[{content:[{type:'output_text',text:'Verified educational answer [medterms]'}]}]})}
  throw Error('Unexpected request');
 };
 let edgeOrigin='';
 const edge=http.createServer(async(req,res)=>{
  if(req.url==='/old'){
   const headers={'Access-Control-Allow-Origin':appOrigin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
   if(req.method==='OPTIONS'){res.writeHead(204,headers);res.end();return}oldPosts++;res.writeHead(200,headers);res.end(JSON.stringify({answer:'old'}));return;
  }
  try{
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const body=Buffer.concat(chunks);const request=new Request(edgeOrigin+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
   const response=await handleTutor(request,env,fetcher);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end()}
 });
 edgeOrigin=await listen(edge);
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto(appOrigin);
  const send=async(path,extra={},token='valid-student')=>page.evaluate(async({url,extra,token})=>{
   const headers={'Content-Type':'application/json',apikey:'public-test',...extra};if(token)headers.Authorization='Bearer '+token;
   try{const response=await fetch(url,{method:'POST',headers,body:JSON.stringify({question:'Explain a medical word'})});return {status:response.status,body:await response.json()}}catch{return {blocked:true}}
  },{url:edgeOrigin+path,extra,token});
  assert.deepEqual(await send('/old',{'X-Retry-Count':'1'}),{blocked:true});assert.equal(oldPosts,0,'original policy blocks before POST');
  const result=await send('/new',{'X-Retry-Count':'1','X-Requested-With':'test-browser',traceparent:'00-00000000000000000000000000000001-0000000000000001-01',tracestate:'vendor=value',baggage:'test=value','X-Region':'any','X-Supabase-Api-Version':'2024-01-01'});
  assert.equal(result.status,200);assert(result.body.answer.includes('Verified'));assert.equal(providerCalls,1);
  const invalid=await send('/new',{},'forged-token');assert.equal(invalid.status,401);assert.equal(invalid.body.code,'AUTH_INVALID');assert.equal(providerCalls,1,'invalid token never reaches provider');
  const anonymous=await send('/new',{},null);assert.equal(anonymous.status,401);assert.equal(anonymous.body.code,'AUTH_REQUIRED');assert.equal(providerCalls,1);
  const cors=await page.evaluate(async url=>{const r=await fetch(url,{method:'OPTIONS'});return {status:r.status,vary:r.headers.get('vary')}},edgeOrigin+'/new');assert.equal(cors.status,204);
  const other=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('Untrusted origin')});const untrusted=await listen(other);try{await page.goto(untrusted);assert.deepEqual(await send('/new',{'X-Retry-Count':'1'}),{blocked:true});assert.equal(providerCalls,1)}finally{await new Promise(resolve=>other.close(resolve))}
  console.log('PASS: browser reproduces original retry-header CORS failure; updated preflight and POST succeed, full URL origin is normalized, forged/anonymous requests stay denied, and other origins stay blocked. No real Auth/provider calls.');
 }finally{await browser.close();await Promise.all([new Promise(resolve=>front.close(resolve)),new Promise(resolve=>edge.close(resolve))])}
})().catch(error=>{console.error(error);process.exit(1)});
