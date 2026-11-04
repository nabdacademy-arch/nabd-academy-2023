// NABD ATLAS fictional-case authoring helper.
// Educational draft only: never use as treatment advice or patient-care protocol.
// Each learning checkpoint has 3 alternatives worth 0, 1 or 2 educational points.
export const LEVELS=["intro","intermediate","advanced"];
export const SKILLS=["triage","assessment","reasoning","communication"];
const multilingual=(ar,en)=>({ar,en});
const CATEGORIES={
  emergency:multilingual("الطوارئ","Emergency medicine"),
  respiratory:multilingual("الجهاز التنفسي","Respiratory medicine"),
  endocrine:multilingual("السكري والغدد","Endocrinology"),
  gastro:multilingual("الجهاز الهضمي","Gastroenterology"),
  surgery:multilingual("الجراحة","Surgery"),
  pediatrics:multilingual("طب الأطفال","Pediatrics"),
  obstetrics:multilingual("النساء والتوليد","Obstetrics"),
  renal:multilingual("الكلى","Renal medicine"),
  toxicology:multilingual("السموم","Toxicology"),
  trauma:multilingual("إصابات الطوارئ","Trauma"),
  mentalhealth:multilingual("الصحة النفسية","Mental health")
};
export function makeCase(spec){
  const [id,department,level,titleAr,titleEn,patientAr,patientEn,hr,bp,spo2,objectives,checkpoints,reference=[]]=spec;
  if(!Array.isArray(checkpoints)||checkpoints.length!==4)throw new Error("Four distinct checkpoints required: "+id);
  const stages=[
    multilingual("أولويات الاستقبال","Triage priorities"),
    multilingual("جمع البيانات المهمة","Focused assessment"),
    multilingual("الاستدلال السريري","Clinical reasoning"),
    multilingual("التواصل والتسليم","Clinical handover")
  ];
  const steps=checkpoints.map((input,index)=>{
    // [questionAr, questionEn, bestAr, bestEn, whyBestAr, whyBestEn,
    //  partialAr, partialEn, whyPartialAr, whyPartialEn, unsafeAr, unsafeEn, whyUnsafeAr, whyUnsafeEn]
    if(!Array.isArray(input)||input.length!==14)throw new Error("Incomplete checkpoint "+id+"/"+index);
    const [qa,qe,ba,be,bfa,bfe,pa,pe,pfa,pfe,wa,we,wfa,wfe]=input;
    const options=[
      {ar:ba,en:be,points:2,feedback:multilingual(bfa,bfe)},
      {ar:pa,en:pe,points:1,feedback:multilingual(pfa,pfe)},
      {ar:wa,en:we,points:0,feedback:multilingual(wfa,wfe)}
    ];
    // Vary answer order to avoid "always choose option one" memorization.
    const shift=(id.split("").reduce((a,ch)=>a+ch.charCodeAt(0),0)+index)%3;
    const rotated=options.slice(shift).concat(options.slice(0,shift));
    return {id:SKILLS[index],skill:SKILLS[index],title:stages[index],description:multilingual(qa,qe),options:rotated};
  });
  return {
    id,department,level,category:CATEGORIES[department]??multilingual("التعليم الطبي","Medical education"),revision:1,reviewStatus:"unreviewed",
    title:multilingual(titleAr,titleEn),patient:multilingual(patientAr,patientEn),
    vitals:{hr,bp,spo2},objectives:multilingual(objectives[0],objectives[1]),
    references:reference,maxPoints:8,steps
  };
}
