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
