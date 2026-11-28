// Pure educational scoring engine — no clinical patient decisions.
export function validateCase(item) {
  if(!item || typeof item.id!=="string" || !Array.isArray(item.steps) || !item.steps.length) return false;
  if(!item.title?.ar || !item.title?.en || !item.patient?.ar || !item.patient?.en) return false;
  if(item.steps.some(step=>!step.title?.ar || !step.title?.en || !step.description?.ar || !step.description?.en || !Array.isArray(step.options) || step.options.length<2)) return false;
  if(item.steps.some(step=>step.options.some(option=>!option.ar || !option.en || !Number.isInteger(option.points) || option.points<0 || !option.feedback?.ar || !option.feedback?.en))) return false;
  return sumMaximum(item)===item.maxPoints;
}
export function sumMaximum(item){
  return item.steps.reduce((sum,step)=>sum+Math.max(...step.options.map(option=>option.points)),0);
}
export function isFinished(item,picks) {
  return Array.isArray(picks) && picks.length===item.steps.length && item.steps.every((step,index)=>Number.isInteger(picks[index]) && picks[index]>=0 && picks[index]<step.options.length);
}
export function grade(item,picks){
  if(!validateCase(item) || !isFinished(item,picks)) throw new Error("Incomplete or invalid training case");
  const decisions=item.steps.map((step,index)=>({
    index,
    answer:picks[index],
    points:step.options[picks[index]].points,
    maxPoints:Math.max(...step.options.map(option=>option.points))
  }));
  return {caseId:item.id,score:decisions.reduce((sum,step)=>sum+step.points,0),maxPoints:item.maxPoints,decisions};
}
export function comparePath(item,oldPicks,newPicks){
  const before=grade(item,oldPicks),after=grade(item,newPicks);
  return {before:before.score,after:after.score,difference:after.score-before.score};
}

export function reviewPriorities(item,picks){
  return grade(item,picks).decisions.filter(d=>d.points<d.maxPoints).sort((a,b)=>(b.maxPoints-b.points)-(a.maxPoints-a.points)||a.index-b.index);
}

// Latest valid attempt per case; never interpret as clinical competence.
export function learningGaps(cases,history){
  const latest=new Map();
  for(const row of history.slice(-40)){
    const item=cases.find(c=>c.id===row?.caseId);
    if(!item||row.revision!==(item.revision??1)||!isFinished(item,row.answers))continue;
    latest.set(item.id,grade(item,row.answers));
  }
  return cases.filter(c=>latest.has(c.id)).map(c=>{
    const g=latest.get(c.id);return {caseId:c.id,score:g.score,maxPoints:g.maxPoints,gap:g.maxPoints?1-g.score/g.maxPoints:0};
  }).filter(x=>x.gap>0).sort((a,b)=>b.gap-a.gap||a.caseId.localeCompare(b.caseId));
}

// Validate saved progress against the exact case revision and contiguous answers.
export function validDraft(item,draft){
  if(!draft||draft.revision!==(item.revision??1)||!Number.isInteger(draft.step)||draft.step<0||draft.step>=item.steps.length||!Array.isArray(draft.picks)||draft.picks.length>item.steps.length)return false;
  for(let i=0;i<draft.picks.length;i++){
    const n=draft.picks[i];
    if(!Number.isInteger(n)||n<0||n>=item.steps[i].options.length)return false;
  }
  return draft.picks.length>=draft.step;
}
// Counterfactual learning scores only; no prediction of health outcomes.
export function alternativeScores(item,picks,index){
  const base=grade(item,picks);
  if(!Number.isInteger(index)||index<0||index>=item.steps.length)throw new Error("Invalid decision index");
  return item.steps[index].options.map((option,answer)=>({answer,selected:answer===picks[index],score:base.score-base.decisions[index].points+option.points,delta:option.points-base.decisions[index].points}));
}

// Local descriptive evidence only. Recompute scores from answers; exclude obsolete revisions.
export function learningEvidence(cases,history){
  const attempts=new Map();
  for(const row of history.slice(-40)){
    const item=cases.find(c=>c.id===row?.caseId);
    if(!item||row.revision!==(item.revision??1)||!isFinished(item,row.answers))continue;
    const g=grade(item,row.answers);
    const prev=attempts.get(item.id);
    attempts.set(item.id,{first:prev?.first??g,last:g,count:(prev?.count??0)+1});
  }
  const departments=new Map();let paired=0,change=0;
  for(const item of cases){
    const d=departments.get(item.department)??{department:item.department,available:0,completed:0,score:0,maxPoints:0};
    d.available++;
    const a=attempts.get(item.id);
    if(a){d.completed++;d.score+=a.last.score;d.maxPoints+=a.last.maxPoints;
      if(a.count>1&&a.last.maxPoints>0){paired++;change+=(a.last.score-a.first.score)/a.last.maxPoints;}}
    departments.set(item.department,d);
  }
  return {kind:"NABD_LOCAL_LEARNING_EVIDENCE",version:1,available:cases.length,completed:attempts.size,pairedCases:paired,meanScoreChange:paired?change/paired:null,departments:[...departments.values()]};
}

// Recommend unattempted cases in underrepresented departments, not clinical prerequisites.
export function explorationPath(cases,history,limit=3){
  const evidence=learningEvidence(cases,history);
  const visited=new Set(history.slice(-40).filter(row=>{const item=cases.find(c=>c.id===row?.caseId);return item&&row.revision===(item.revision??1)&&isFinished(item,row.answers);}).map(row=>row.caseId));
  const coverage=new Map(evidence.departments.map(d=>[d.department,d.completed/d.available]));
  const level={intro:0,intermediate:1,advanced:2};
  const candidates=cases.filter(c=>!visited.has(c.id)).sort((a,b)=>coverage.get(a.department)-coverage.get(b.department)||(level[a.level]??3)-(level[b.level]??3)||a.id.localeCompare(b.id));
  const chosen=[],used=new Set();
  for(const c of candidates){if(chosen.length>=limit)break;if(!used.has(c.department)){chosen.push(c.id);used.add(c.department);}}
  return chosen;
}

// EQUITY: compare abstract study budgets, never allocate clinical care.
export function studyBudget(item,picks,budget){
  const g=grade(item,picks);
  if(!Number.isInteger(budget)||budget<0||budget>item.steps.length)throw Error("Invalid study budget");
  const priorities=reviewPriorities(item,picks).slice(0,budget);
  return {budget,reviewSteps:priorities.map(d=>d.index),recoverablePoints:priorities.reduce((n,d)=>n+d.maxPoints-d.points,0),baseline:g.score,maxPoints:g.maxPoints};
}
// DISCOVERY: expose content gaps without interpreting them as medical discoveries.
export function contentAudit(cases){
  return cases.map(c=>({caseId:c.id,revision:c.revision??1,reviewStatus:c.reviewStatus,referenceCount:Array.isArray(c.references)?c.references.length:0,structuralValid:validateCase(c)}));
}
// CONSENSUS: compare independent practice answers, never infer medical truth.
export function compareLearners(item,a,b){
  grade(item,a);grade(item,b);
  const differing=a.map((n,i)=>n!==b[i]?i:-1).filter(i=>i>=0);
  return {steps:a.length,agreements:a.length-differing.length,differing};
}
// PROOF: reproducible self-reported practice record, not an issuer signature.
export function practiceRecord(item,picks){
  const g=grade(item,picks);
  return {kind:"NABD_PRACTICE_RECORD",version:1,caseId:item.id,revision:item.revision??1,answers:[...picks],score:g.score,maxPoints:g.maxPoints,issuerVerified:false};
}
export function verifyPracticeRecord(item,record){
  try{
    if(record?.kind!=="NABD_PRACTICE_RECORD"||record.version!==1||record.caseId!==item.id||record.revision!==(item.revision??1)||record.issuerVerified!==false)return false;
    const expected=practiceRecord(item,record.answers);
    return record.score===expected.score&&record.maxPoints===expected.maxPoints;
  }catch{return false;}
}
