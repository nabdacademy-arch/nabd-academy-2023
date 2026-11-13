"use strict";
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const base="http://127.0.0.1:8123/";
const examId="11111111-1111-4111-8111-111111111111";

function mockClient(role){
 const examId="11111111-1111-4111-8111-111111111111";
 const state={role,enabled:false,submissions:[],questions:Array.from({length:20},(_,i)=>({
   id:"q-"+i,prompt:"Test question "+(i+1),type:"mcq",options:["Correct","Wrong"]
 }))};
 window.__qaState=state;
 const user={id:role==="director"?"qa-director":"qa-student",email:"qa@example.test"};
 const client={
  auth:{getUser:async()=>({data:{user},error:null}),signOut:async()=>({error:null}),
    signInWithPassword:async()=>({error:null})},
  from(name){
    let action="select",item=null,opts={};
    const q={
      select(columns,options){if(action!=="insert")action="select";opts=options||{};return q},
      insert(value){action="insert";item=value;return q},
      eq(){return q},in(){return q},order(){return q},limit(){return q},
      async maybeSingle(){return evaluate()},
      then(resolve,reject){return Promise.resolve(evaluate()).then(resolve,reject)}
    };
    function evaluate(){
      if(name==="nabd_exam_owner")return {data:role==="director"?{user_id:user.id}:null,error:null};
      if(name==="profiles")return {data:{role},error:null};
      if(name==="courses"||name==="nabd_quality_exams")return {data:[],error:null};
      if(name==="nabd_quality_submissions"){
        if(action==="insert"){
          if(state.submissions.length)return {data:null,error:{message:"Already submitted"}};
          const saved={...item,id:"qa-submission",submitted_at:new Date().toISOString(),
            human_score:null,grade_notes:null,ai_score:null,ai_notes:null,ai_review_required:false,ai_status:"pending"};
          state.submissions.push(saved);
          return {data:{id:saved.id,submitted_at:saved.submitted_at},error:null};
        }
        if(opts.count==="exact")return {count:state.submissions.length,error:null};
        return {data:state.submissions,error:null};
      }
      return {data:[],error:null};
    }
    return q;
  },
  async rpc(name,args){
    if(name==="nabd_gradebot_status")return {data:{enabled:state.enabled,pending:0,needs_review:0,total_graded:0},error:null};
    if(name==="nabd_gradebot_toggle"){
      if(role!=="director")return {error:{message:"DIRECTOR_ONLY"}};
      state.enabled=Boolean(args.p_enabled);return {data:{enabled:state.enabled},error:null};
    }
    if(name==="nabd_quality_active_exams")return {data:[{id:examId,title:"QA 20-question exam",
      course_title:"QA",question_count:20,duration_minutes:60,closes_at:new Date(Date.now()+3600000).toISOString()}],error:null};
    if(name==="nabd_quality_student_questions")return {data:{id:examId,title:"QA 20-question exam",questions:state.questions,
      closes_at:new Date(Date.now()+3600000).toISOString()},error:null};
    if(name==="nabd_quality_student_history_v2")return {data:state.submissions.map(s=>({...s,
      title:"QA 20-question exam",question_count:20})),error:null};
    return {data:null,error:{message:"Mock RPC not implemented: "+name}};
  },
  functions:{invoke:async()=>({data:{ok:true,enabled:state.enabled,graded:0,review:0,errors:0},error:null})}
 };
 window.supabase={createClient:()=>client};
}

(async()=>{
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  for(const width of [390,1365]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
   await context.route(/^https:\/\//,route=>route.abort());
   const director=await context.newPage();
   director.on("dialog",dialog=>dialog.accept());
   await director.addInitScript(mockClient,"director");
   await director.goto(base+"quality-exams.html",{waitUntil:"domcontentloaded"});
   await director.locator("#ql-workspace").waitFor({state:"visible"});
   assert.match(await director.locator("#ql-bot-state").innerText(),/متوقف/);
   await director.locator("#ql-bot-start").click();
   await director.waitForFunction(()=>window.__qaState.enabled===true);
   assert.match(await director.locator("#ql-bot-state").innerText(),/يعمل/);
   await director.locator("#ql-bot-stop").click();
   await director.waitForFunction(()=>window.__qaState.enabled===false);
   assert.match(await director.locator("#ql-bot-state").innerText(),/متوقف/);
   await director.close();

   const student=await context.newPage();
   student.on("dialog",dialog=>dialog.accept());
   await student.addInitScript(mockClient,"student");
   await student.goto(base+"student-exams.html",{waitUntil:"domcontentloaded"});
   await student.locator("#ql-student-dashboard").waitFor({state:"visible"});
   await student.getByRole("button",{name:"بدء الامتحان"}).click();
   await student.locator("#ql-student-paper").waitFor({state:"visible"});
   assert.equal(await student.locator("#ql-paper-questions .ql-question").count(),20);
   await student.locator('#ql-paper-questions input[value="0"]').evaluateAll(nodes=>nodes.forEach(n=>n.click()));
   await student.locator("#ql-submit-answers").click();
   await student.locator("#ql-student-dashboard").waitFor({state:"visible"});
   assert.equal(await student.evaluate(()=>window.__qaState.submissions.length),1);
   const answers=await student.evaluate(()=>window.__qaState.submissions[0].answers);
   assert.equal(Object.keys(answers).length,20);
   await student.evaluate(()=>{const s=window.__qaState.submissions[0];s.ai_score=18;s.ai_status="graded";s.ai_notes="Two questions incorrect"});
   await student.locator("#ql-refresh").click();
   await student.getByText(/درجة آلية أولية: 18 \/ 20/).first().waitFor();
   await student.evaluate(()=>{const s=window.__qaState.submissions[0];s.human_score=19;s.grade_notes="Manual review completed"});
   await student.locator("#ql-refresh").click();
   await student.getByText(/الدرجة البشرية المعتمدة: 19 \/ 20/).first().waitFor();
   await student.getByText("تم تسليم الإجابات").first().waitFor();
   await student.close();

   const unauthorized=await context.newPage();
   await unauthorized.addInitScript(mockClient,"student");
   await unauthorized.goto(base+"quality-exams.html",{waitUntil:"domcontentloaded"});
   await unauthorized.locator("#ql-login-panel").waitFor({state:"visible"});
   assert.equal(await unauthorized.locator("#ql-workspace").isHidden(),true);
   await unauthorized.close();
   await context.close();
   console.log("PASS: isolated exam browser QA width="+width+", 20 questions, start/stop, student grade view, director gate");
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
