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
