/*
 * NABD KNOWLEDGE ATLAS — premium bilingual, medical-education concept UI.
 * All labels come from the first-party curated static dataset and get escaped.
 * External media is limited to the existing fixed Wikimedia Commons file list.
 */
import {SYSTEMS,TOPIC_BY_ID,connectedIds,systemTopics,visibleRelated,getFeatured} from "./knowledge-data.mjs";
import {VISUAL_TOPICS,commonsImage,commonsSource} from "./medical-visuals.mjs";

const MEDIA=Object.fromEntries(VISUAL_TOPICS.map(x=>[x.id,x]));
const ICONS={
 heart:"🫀",blood:"🩸",lungs:"🫁",oxygen:"O₂",hemoglobin:"✺",vessels:"◈",pressure:"↗",arteries:"∿",veins:"∿",
 trachea:"⌁",alveoli:"◌",diaphragm:"〰",brain:"🧠",neuron:"✶",spinal:"⊙",nerves:"✧",eye:"👁",optic:"◉",ear:"◖",
 digestive:"◈",stomach:"◇",liver:"◩",pancreas:"✤",intestine:"≋",gallbladder:"◓",nutrients:"✦",
 kidney:"💧",nephron:"◈",urinary:"♢",bladder:"◉",ureter:"╱",electrolytes:"±",
 skeleton:"🦴",muscles:"◆",joints:"◎",tendons:"∿",calcium:"Ca",skin:"▤",thyroid:"✦",
 insulin:"◇",pituitary:"◉",glucose:"C₆",metabolism:"⚡",reproductive:"✿",ovary:"❀",uterus:"♡",
 fallopian:"∿",hormones:"✧",whitecells:"✺",lymph:"◌",spleen:"◈","bone-marrow":"✱"
};
const PATHWAYS={
 cardio:["lungs","oxygen","hemoglobin","heart","vessels"],
 respiratory:["trachea","lungs","alveoli","oxygen","hemoglobin"],
 nervous:["eye","optic","brain","spinal","nerves"],
 digestive:["stomach","intestine","nutrients","liver","blood"],
 renal:["blood","kidney","nephron","ureter","bladder"],
 muscular:["brain","nerves","muscles","tendons","skeleton"],
 senses:["eye","optic","brain","nerves","skin"],
 endocrine:["pituitary","thyroid","metabolism","glucose","insulin"],
 reproductive:["pituitary","hormones","ovary","fallopian","uterus"],
 immune:["bone-marrow","whitecells","blood","lymph","spleen"]
};
const text=(ar,en,lang)=>lang==="en"?en:ar;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=(topic,lang)=>esc(topic?.[lang==="en"?"en":"ar"]||"");
const subtitle=(topic,lang)=>esc(topic?.[lang==="en"?"summaryEn":"summaryAr"]||"");
function media(topic,className=""){
 const item=MEDIA[topic?.image];
 const sym=esc(ICONS[topic?.id]||"✦");
 const alt=label(topic,"ar")+" / "+label(topic,"en");
 if(!item)return '<span class="knowledge-symbol '+className+'" aria-hidden="true">'+sym+'</span>';
 const url=esc(commonsImage(item.file));
 return '<span class="knowledge-photo '+className+'"><span class="knowledge-photo-fallback" aria-hidden="true">'+sym+'</span><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="'+url+'" alt="'+alt+'"></span>';
}
function nodeButton(topic,lang,cls="knowledge-peer"){
 return '<button class="'+cls+'" type="button" data-node="'+esc(topic.id)+'" aria-label="'+text("استكشف ","Explore ",lang)+label(topic,lang)+'">'+
  media(topic,cls+"-art")+'<span class="'+cls+'-content"><strong>'+label(topic,lang)+'</strong>'+
  '<small>'+subtitle(topic,lang)+'</small><span class="'+cls+'-arrow" aria-hidden="true">↗</span></span></button>';
}
const sourceOpenstax="https://openstax.org/details/books/anatomy-and-physiology-2e";
const sourceMedline="https://medlineplus.gov/encyclopedia.html";
function centralCard(topic,lang){
 return '<article class="knowledge-core" aria-label="'+text("المفهوم الرئيسي","Main concept",lang)+'">'+
  '<span class="knowledge-core-label">✦ '+text("المفهوم الرئيسي","FOCUS CONCEPT",lang)+'</span>'+
  '<div class="knowledge-core-art">'+media(topic)+'</div>'+
  '<span class="knowledge-core-pulse" aria-hidden="true"><svg viewBox="0 0 220 25"><path d="M1 13H70l10-9 9 19 12-13 10 3H219" fill="none" stroke="currentColor" stroke-width="2"/></svg></span>'+
  '<h3>'+label(topic,lang)+'</h3>'+
  '<p>'+subtitle(topic,lang)+'</p>'+
  '<a class="knowledge-core-cta" href="#atlas">'+text("استكشف الأطلس 3D","Explore Anatomy ATLAS 3D",lang)+' <span aria-hidden="true">↗</span></a>'+
  '</article>';
}
function diagramSvg(){
 const lines=[
 [25,77,425,233],[25,231,425,233],[25,391,425,233],[975,77,575,233],[975,231,575,233],[975,391,575,233]
 ];
 return '<svg class="knowledge-connectors" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="kn-line" x1="0" x2="1"><stop stop-color="#4fddcc"/><stop offset=".6" stop-color="#6af5d9"/><stop offset="1" stop-color="#57cfec"/></linearGradient></defs>'+
 lines.map(([x,y,xx,yy])=>'<path d="M'+x+' '+y+' C'+((x+xx)/2)+' '+y+' '+((x+xx)/2)+' '+yy+' '+xx+' '+yy+'" fill="none" stroke="url(#kn-line)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="7 5" opacity=".8"/>').join("")+
 '<circle cx="500" cy="233" r="180" fill="none" stroke="#62d5e1" stroke-dasharray="2 15" opacity=".24"/>'+
 '<circle cx="500" cy="233" r="216" fill="none" stroke="#62d5e1" opacity=".1"/></svg>';
}
function connectedStrip(groupId,lang){
 const ids=PATHWAYS[groupId]||PATHWAYS.cardio;
 return '<section class="knowledge-flow"><div class="knowledge-section-caption"><span>↗</span>'+text("سلسلة المفاهيم المرتبطة","EXPLORE THE CONNECTION",lang)+'</div>'+
 '<div class="knowledge-flow-items">'+ids.map((id,i)=>{
  const topic=TOPIC_BY_ID[id];if(!topic)return "";
  return '<button class="knowledge-flow-step" type="button" data-node="'+esc(id)+'" aria-label="'+text("انتقل إلى ","Jump to ",lang)+label(topic,lang)+'"><span class="knowledge-flow-glyph">'+media(topic)+'</span><strong>'+label(topic,lang)+'</strong></button>'+
  (i<ids.length-1?'<span class="knowledge-flow-chevron" aria-hidden="true">→</span>':"");
 }).join("")+'</div><small class="knowledge-flow-foot">'+text("تسلسل للتعلّم والربط بين المفاهيم، وليس مسارًا تشريحيًا دقيقًا.","A learning sequence linking concepts, not an exact anatomical or physiological pathway.",lang)+'</small></section>';
}
function topicDetail(topic,groupId,lang){
 const related=new Set(connectedIds(topic.id));
 const group=systemTopics(groupId);
 const near=group.filter(x=>x.id!==topic.id&&related.has(x.id)).slice(0,5);
 const preview=MEDIA[topic.image];
 const source=preview?' <a class="knowledge-image-attrib" href="'+esc(commonsSource(preview.file))+'" target="_blank" rel="noopener noreferrer">Wikimedia Commons · '+esc(preview.author)+' · '+esc(preview.license)+' ↗</a>':'';
 return '<section class="knowledge-detail graph-detail" aria-live="polite" aria-label="'+text("تفاصيل المفهوم","Concept details",lang)+'">'+
  '<div class="knowledge-detail-art">'+media(topic)+'</div>'+
  '<div class="knowledge-detail-copy"><span class="knowledge-overline">EXPLORE THE CONNECTION</span>'+
  '<h2>'+label(topic,lang)+'</h2><p>'+subtitle(topic,lang)+'</p>'+
  '<div class="knowledge-detail-highlights"><div><span>✧</span><strong>'+text("التصنيف","Category",lang)+'</strong><small>'+text(topic.kind==="anatomy"?"تشريح":"وظيفة حيوية",topic.kind==="anatomy"?"Anatomy":"Physiology",lang)+'</small></div>'+
  '<div><span>◈</span><strong>'+text("الترابط","Connections",lang)+'</strong><small>'+related.size+' '+text("مفهومًا مرتبطًا","related topics",lang)+'</small></div>'+
  '<div><span>⬡</span><strong>'+text("المنصة","Learn more",lang)+'</strong><small>NABD ATLAS</small></div></div>'+
  '<div class="knowledge-detail-near"><strong>'+text("موضوعات مرتبطة","Related concepts",lang)+'</strong><div class="knowledge-tag-list">'+
  near.map(n=>'<button type="button" data-node="'+esc(n.id)+'">'+label(n,lang)+'</button>').join("")+'</div></div>'+
  '<div class="knowledge-detail-bottom"><div class="knowledge-source"><strong>'+text("مصادر للمراجعة","Verify with sources",lang)+'</strong>'+
  '<a href="'+sourceOpenstax+'" target="_blank" rel="noopener noreferrer">OpenStax · Anatomy & Physiology 2e ↗</a>'+
  '<a href="'+sourceMedline+'" target="_blank" rel="noopener noreferrer">MedlinePlus · Medical Encyclopedia ↗</a>'+source+'</div>'+
  '<a class="knowledge-learning-cta" href="#atlas">'+text("افتح أطلس التشريح","Open Anatomy ATLAS",lang)+' <span aria-hidden="true">↗</span></a></div></div></section>';
}
function overview(groupId,selected,lang){
 const related=visibleRelated(groupId,selected.id,6);
 return '<div class="knowledge-network" aria-label="'+text("الخريطة المصوّرة للمفاهيم المرتبطة","Illustrated connected concepts map",lang)+'">'+
 diagramSvg()+centralCard(selected,lang)+
 '<div class="knowledge-peers">'+related.map((topic,i)=>{
   const cell=i<6?i:5;return '<div class="knowledge-peer-slot knowledge-peer-slot-'+(cell+1)+'">'+nodeButton(topic,lang)+'</div>';
 }).join("")+'</div></div>'+
 connectedStrip(groupId,lang);
}
function cards(groupId,lang){
 return '<div class="knowledge-card-grid">'+systemTopics(groupId).map(topic=>nodeButton(topic,lang,"knowledge-topic-tile")).join("")+'</div>';
}
function relations(groupId,selected,lang){
 const topics=systemTopics(groupId);
 const related=connectedIds(selected.id);
 const active=new Set(related);
 const merged=[...topics.filter(x=>x.id!==selected.id&&active.has(x.id)),...topics.filter(x=>x.id!==selected.id&&!active.has(x.id))];
 return '<div class="knowledge-relations"><h3>'+text("كيف ترتبط هذه المفاهيم؟","How do these concepts connect?",lang)+'</h3><p>'+text("اختر أي بطاقة لتغيير المفهوم الرئيسي ورؤية شبكة علاقاته.","Select any card to change the focus and explore its network.",lang)+'</p>'+
 '<div class="knowledge-relations-list">'+merged.map(n=>
  '<button type="button" data-node="'+esc(n.id)+'">'+media(n)+'<span><strong>'+label(n,lang)+'</strong><small>'+subtitle(n,lang)+'</small></span>'+
  '<b class="'+(active.has(n.id)?"is-related":"")+'">'+(active.has(n.id)?text("علاقة مباشرة","DIRECT",lang):text("ضمن الجهاز","IN SYSTEM",lang))+'</b></button>').join("")+'</div></div>';
}
export function renderKnowledgeAtlas({
 language="ar",systemId="cardio",selectedId="heart",mode="map"
}={}){
 const lang=language==="en"?"en":"ar";
 const group=SYSTEMS.find(s=>s.id===systemId)||SYSTEMS[0];
 const main=getFeatured(group.id,selectedId);
 const tabs=[["map","⬡",text("الخريطة التفاعلية","Interactive map",lang)],["cards","▦",text("بطاقات مصوّرة","Illustrated cards",lang)],["relations","⇄",text("العلاقات","Relations",lang)]];
 const selected=mode==="cards"||mode==="relations"?mode:"map";
 return '<div class="knowledge-experience"><header class="knowledge-hero">'+
  '<div class="knowledge-hero-copy"><span class="knowledge-overline">NABD · KNOWLEDGE UNIVERSE</span>'+
  '<h2>'+text("المعرفة ليست نقاطًا متفرقة. إنها عالم مترابط.","Knowledge is a connected universe.",lang)+'</h2>'+
  '<p>'+text("استكشف جسم الإنسان بالصورة والعلاقة والفكرة. اختر أحد أجهزة الجسم، ثم انتقل بين مفاهيمه كما لو كنت داخل خريطة معرفية عالمية.","Explore the human body through illustrations and linked concepts. Choose a system, then travel between its interconnected ideas.",lang)+'</p>'+
  '<div class="knowledge-hero-stats"><span><b>'+SYSTEMS.length+'</b> '+text("أجهزة وأنظمة","systems",lang)+'</span>'+
  '<span><b>'+Object.keys(TOPIC_BY_ID).length+'</b> '+text("مفهومًا","concepts",lang)+'</span>'+
  '<span>AR + EN</span></div></div>'+
  '<div class="knowledge-hero-visual" aria-hidden="true"><div class="knowledge-hero-orb"><span>🧠</span><span>🫀</span><span>🫁</span><span>🦴</span><span>👁</span></div></div></header>'+
  '<section class="knowledge-main-panel"><div class="knowledge-toolbar"><label class="knowledge-system-select"><span>'+text("اختر جهازًا أو نظامًا","Explore a body system",lang)+'</span>'+
  '<select id="knowledge-system" aria-label="'+text("اختر جهازًا","Choose a body system",lang)+'">'+SYSTEMS.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===group.id?"selected":"")+'>'+esc(s.icon)+' '+label(s,lang)+'</option>').join("")+'</select></label>'+
  '<div class="knowledge-tabs" role="group" aria-label="'+text("طريقة العرض","Display mode",lang)+'">'+tabs.map(([id,symbol,name])=>'<button type="button" data-graph-view="'+id+'" aria-pressed="'+String(selected===id)+'"><span aria-hidden="true">'+symbol+'</span> '+name+'</button>').join("")+'</div></div>'+
  '<div class="knowledge-system-intro"><span class="knowledge-system-chip">'+esc(group.icon)+' '+label(group,lang)+'</span>'+
  '<p>'+esc(lang==="en"?group.subtitleEn:group.subtitleAr)+'</p></div>'+
  (selected==="cards"?cards(group.id,lang):selected==="relations"?relations(group.id,main,lang):overview(group.id,main,lang))+
  '<div class="knowledge-topic-switch"><strong>'+text("استكشف موضوعات الجهاز","Explore this system",lang)+'</strong><div class="knowledge-topic-list">'+systemTopics(group.id).map(n=>
    '<button type="button" data-node="'+esc(n.id)+'" aria-pressed="'+String(n.id===main.id)+'">'+label(n,lang)+'</button>').join("")+'</div></div>'+
  '</section>'+topicDetail(main,group.id,lang)+
  '<p class="knowledge-safety-note">'+text("خريطة تعليمية مفاهيمية: الرسوم والمفاهيم مبسطة، وليست تشخيصًا أو توصية علاجية. الصور من Wikimedia Commons، وحقوق كل صورة موضحة في مصدرها.","An introductory conceptual map: illustrations and connections are simplified, not diagnostic or treatment advice. Images are sourced from Wikimedia Commons with attribution at the source.",lang)+'</p></div>';
}
