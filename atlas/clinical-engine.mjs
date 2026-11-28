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

// A decision-count budget for disrupted learning, not clinical resource allocation.
export function crisisStudyPlan(cases,history,budget){
  if(!Number.isInteger(budget)||budget<1||budget>86)throw Error("Invalid study budget");
  const priorities=[...learningGaps(cases,history).map(x=>x.caseId),...explorationPath(cases,history,cases.length),...cases.map(c=>c.id)];
  const selected=[];let remaining=budget;
  for(const id of new Set(priorities)){const c=cases.find(x=>x.id===id);if(c.steps.length<=remaining){selected.push({caseId:id,decisions:c.steps.length});remaining-=c.steps.length;}}
  return {budget,remaining,selected};
}
// Catalog documentation gaps, not judgments of clinical accuracy.
export function documentationGaps(cases){
  return cases.map(c=>({caseId:c.id,missing:[...(!c.references?.length?["references"]:[]),...(!c.objectives?.ar||!c.objectives?.en?["objectives"]:[]),...(c.reviewStatus!=="reviewed"?["clinical_review"]:[])]})).filter(x=>x.missing.length);
}
export function makePracticeRecord(item,picks){
  const g=grade(item,picks);
  return {kind:"NABD_PRACTICE_RECORD",version:1,caseId:item.id,revision:item.revision??1,answers:[...picks],score:g.score,maxPoints:g.maxPoints};
}
// Reproducible scores only. No identity, authenticity or credential assertion.
export function checkPracticeRecord(cases,record){
  if(!record||record.kind!=="NABD_PRACTICE_RECORD"||record.version!==1)return null;
  const item=cases.find(c=>c.id===record.caseId);
  if(!item||record.revision!==(item.revision??1)||!isFinished(item,record.answers))return null;
  const g=grade(item,record.answers);
  return g.score===record.score&&g.maxPoints===record.maxPoints?makePracticeRecord(item,record.answers):null;
}
export function comparePracticeRecords(cases,a,b){
  const x=checkPracticeRecord(cases,a),y=checkPracticeRecord(cases,b);
  if(!x||!y||x.caseId!==y.caseId||x.revision!==y.revision)return null;
  return {caseId:x.caseId,agreements:x.answers.filter((n,i)=>n===y.answers[i]).length,total:x.answers.length,different:x.answers.map((n,i)=>n===y.answers[i]?-1:i).filter(i=>i>=0)};
}
