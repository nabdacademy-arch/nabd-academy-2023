import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const api=createClient('https://zsmmmljgguycrvyrmakl.supabase.co','sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM',{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
});
const $=id=>document.getElementById(id);
const tables={profile:'moh_twin_profiles',memory:'moh_twin_memories',messages:'moh_twin_messages',
  tasks:'moh_twin_tasks',events:'moh_twin_events',challenges:'moh_twin_challenges',usage:'moh_twin_ai_requests'};
const state={user:null,profile:null,memories:[],messages:[],tasks:[],events:[],challenges:[],
  challenge:null,human:[],humanDone:false,ai:null,lastAnswer:'',loading:false};
const safe=(v,n=1000)=>String(v??'').slice(0,n);
let toastTimer=null;
function toast(message,error=false){
  const target=$('toast');target.textContent=safe(message,400);target.classList.toggle('error',error);
  target.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>target.hidden=true,5500);
}
function buttonBusy(button,busy,text='جارٍ التنفيذ...'){
  if(!button)return; if(busy){button.dataset.oldText=button.textContent;button.disabled=true;button.textContent=text;}
  else{button.disabled=false;button.textContent=button.dataset.oldText||button.textContent;}
}
function make(tag,className,text){
  const elem=document.createElement(tag);if(className)elem.className=className;
  if(text!==undefined)elem.textContent=safe(text,16000);return elem;
}
function prettyDate(value){try{return new Date(value).toLocaleString('ar-PS',{dateStyle:'medium',timeStyle:'short'});}catch{return safe(value);}}
function clearNode(node){node.replaceChildren();}
function emptyState(target,text){target.replaceChildren(make('p','muted',text));}
function navigate(name){
  document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===name));
  document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===name));
  if(name==='chat'){renderChat();setTimeout(()=>$('chatInput').focus(),50);}
  if(name==='home')renderHome();
  if(name==='challenge')renderChallengeHistory();
  window.scrollTo({top:0,behavior:'smooth'});
}
function showGate(){
  state.user=null;state.profile=null;state.memories=[];state.messages=[];state.tasks=[];state.events=[];
  state.challenges=[];state.challenge=null;state.human=[];state.humanDone=false;state.ai=null;
  $('workspace').hidden=true;$('gate').hidden=false;$('logout').hidden=true;
  $('statusLabel').textContent='خاص • تسجيل الدخول مطلوب';
}
function showWorkspace(){
  $('workspace').hidden=false;$('gate').hidden=true;$('logout').hidden=false;
  $('statusLabel').textContent='اتصال خاص • المدير';
  navigate('home');
}
async function requireOwner(){
  const {data,error}=await api.auth.getUser();
  if(error||!data?.user)throw Error('يجب تسجيل الدخول أولًا.');
  const id=data.user.id;
  const q=await api.from('nabd_exam_owner').select('user_id').eq('user_id',id).maybeSingle();
  if(q.error||q.data?.user_id!==id)throw Error('هذه المساحة متاحة لحساب المدير الشخصي فقط.');
  state.user=data.user;
  return data.user;
}
async function list(table,options={}){
  let query=api.from(table).select(options.columns||'*').eq('owner_id',state.user.id);
  if(options.order)query=query.order(options.order,{ascending:false});
  if(options.limit)query=query.limit(options.limit);
  const {data,error}=await query;
  if(error)throw Error(error.message||'تعذر قراءة البيانات الخاصة.');
  return data||[];
}
async function loadAll(){
  const [profiles,memories,messages,tasks,events,challenges]=await Promise.all([
    list(tables.profile),list(tables.memory,{order:'created_at',limit:100}),
    list(tables.messages,{order:'created_at',limit:100}),
    list(tables.tasks,{order:'next_run',limit:80}),list(tables.events,{order:'created_at',limit:100}),
    list(tables.challenges,{order:'created_at',limit:30})
  ]);
  state.profile=profiles[0]||null;state.memories=memories;state.messages=messages.reverse();
  state.tasks=tasks;state.events=events;state.challenges=challenges;
  renderProfile();renderMemory();renderChat();renderTasks();renderHome();renderChallengeHistory();
}
async function refreshTasks(){
  const [tasks,events]=await Promise.all([list(tables.tasks,{order:'next_run',limit:80}),list(tables.events,{order:'created_at',limit:100})]);
  state.tasks=tasks;state.events=events;renderTasks();renderHome();
}
async function activateSession(){
  try{
    await requireOwner();showWorkspace();await loadAll();
  }catch(e){
    showGate();
    if((await api.auth.getSession()).data?.session)toast(safe(e.message),true);
  }
}
$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('loginButton');
  buttonBusy(button,true,'جارٍ التحقق...');
  try{
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
    const {error}=await api.auth.signInWithPassword({email,password});
    $('loginPassword').value='';
    if(error)throw Error(error.message);
    await requireOwner();showWorkspace();await loadAll();toast('مرحبًا! تم فتح مساحتك الخاصة.');
  }catch(e){await api.auth.signOut();showGate();toast(safe(e.message),true);}
  finally{buttonBusy(button,false);}
});
$('logout').addEventListener('click',async()=>{
  await api.auth.signOut();showGate();toast('تم تسجيل الخروج من التوأم الرقمي.');
});
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.goto)));

function renderHome(){
  $('statMemory').textContent=state.memories.length;
  $('statMessages').textContent=state.messages.length;
  $('statTasks').textContent=state.tasks.filter(x=>x.state==='scheduled').length;
  $('statChallenges').textContent=state.challenges.length;
  const target=$('homeEvents');clearNode(target);
  const recent=state.events.slice(0,4);
  if(!recent.length){target.append(make('p','muted','لا توجد إشعارات بعد. أضف موعدًا ليعمل الوكيل في الخلفية.'));return;}
  for(const e of recent){
    const line=make('p','',e.message+' • '+prettyDate(e.created_at));
    target.append(line);
  }
}
function renderProfile(){
  const p=state.profile||{};
  $('displayName').value=p.display_name||'محمد خالد العرجا';
  $('persona').value=p.persona||'';
  $('responseStyle').value=p.response_style||'ودود، مباشر، عملي، بأسلوب عربي طبيعي';
  $('aiConsent').checked=p.consent_to_ai===true;
  $('sidebarName').textContent=p.display_name||'محمد خالد العرجا';
  $('consentState').textContent=p.consent_to_ai?'الذكاء الاصطناعي مسموح بإذنك.':'محادثة AI غير مفعلة حتى تحفظ موافقتك.';
}
$('profileForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.user)return;
  const button=e.target.querySelector('button[type=submit]');buttonBusy(button,true);
  try{
    const record={owner_id:state.user.id,display_name:$('displayName').value.trim(),
      persona:$('persona').value.trim(),response_style:$('responseStyle').value.trim(),
      consent_to_ai:$('aiConsent').checked,updated_at:new Date().toISOString()};
    if(!record.display_name)throw Error('يجب إدخال اسم العرض.');
    const {error}=await api.from(tables.profile).upsert(record,{onConflict:'owner_id'});
    if(error)throw Error(error.message);
    state.profile=record;renderProfile();toast('تم حفظ هويتك وإعدادات موافقتك.');
  }catch(err){toast(safe(err.message),true)}finally{buttonBusy(button,false)}
});

function renderMemory(){
  const target=$('memoryList');clearNode(target);
  if(!state.memories.length){emptyState(target,'ذاكرتك فارغة. ابدأ بمعلومة صحيحة تريد أن يحتفظ بها مساعدك.');return;}
  const labels={identity:'هوية',preferences:'تفضيلات',goals:'هدف',projects:'مشروع',learning:'تعلم',general:'أخرى'};
  for(const row of state.memories){
    const card=make('article','item-card'),main=make('div','item-main'),
      head=make('strong','',labels[row.category]||'ذاكرة'),content=make('p','',row.content),
      date=make('small','',prettyDate(row.created_at));
    main.append(head,content,date);
    const actions=make('div','item-actions'),remove=make('button','tiny-btn danger','حذف');
    remove.type='button';remove.addEventListener('click',()=>deleteMemory(row.id));
    actions.append(remove);card.append(main,actions);target.append(card);
  }
}
$('memoryForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.user)return;
  const button=e.target.querySelector('button[type=submit]');buttonBusy(button,true);
  try{
    const text=$('memoryText').value.trim();
    if(text.length<2)throw Error('أدخل معلومة واضحة.');
    const {error}=await api.from(tables.memory).insert({owner_id:state.user.id,
      category:$('memoryCategory').value,content:text,source:'owner_input'});
    if(error)throw Error(error.message);
    $('memoryText').value='';state.memories=await list(tables.memory,{order:'created_at',limit:100});
    renderMemory();renderHome();toast('حُفظت المعلومة في ذاكرتك الخاصة.');
  }catch(err){toast(safe(err.message),true)}finally{buttonBusy(button,false)}
});
async function deleteMemory(id){
  if(!confirm('هل تريد حذف هذه المعلومة من ذاكرة التوأم؟'))return;
  const {error}=await api.from(tables.memory).delete().eq('owner_id',state.user.id).eq('id',id);
  if(error){toast(error.message,true);return;}
  state.memories=state.memories.filter(x=>x.id!==id);renderMemory();renderHome();toast('تم حذف المعلومة.');
}

function renderChat(){
  const target=$('chatLog');clearNode(target);
  if(!state.messages.length)target.append(make('div','bubble assistant','مرحبًا! أنا مساعدك الرقمي، أستخدم فقط ما تختار إضافته في ملفك وذاكرتك. كيف أساعدك اليوم؟'));
  else for(const m of state.messages)target.append(make('div','bubble '+(m.role==='user'?'user':'assistant'),m.content));
  target.scrollTop=target.scrollHeight;
}
async function saveMessage(role,content){
  const {data,error}=await api.from(tables.messages)
    .insert({owner_id:state.user.id,role,content:safe(content,12000)}).select().single();
  if(error)throw Error(error.message);
  state.messages.push(data);state.messages=state.messages.slice(-100);
  renderChat();renderHome();
}
async function invokeAI(action,payload){
  const {data,error}=await api.functions.invoke('moh-twin-agent',{body:{action,...payload}});
  if(error||!data?.ok){
    let code=data?.code;
    if(!code&&error?.context){try{code=(await error.context.json()).code;}catch{}}
    const messages={CONSENT_REQUIRED:'فعّل الموافقة على استخدام الذكاء الاصطناعي من صفحة الهوية.',
      DAILY_QUOTA_REACHED:'بلغت الحد المجاني الحالي: 30 طلبًا خلال 24 ساعة.',
      MODEL_UNAVAILABLE:'لم يستجب مزود الذكاء الاصطناعي. جرب مجددًا.',
      PROVIDER_NOT_CONFIGURED:'لم تُضبط مفاتيح مزودي النماذج في الخادم.',
      INVALID_SESSION:'انتهت جلسة تسجيل الدخول.',
      QUOTA_UNAVAILABLE:'خدمة ضبط الاستهلاك غير متاحة.',
      BAD_MODEL_OUTPUT:'لم يرد النموذج بالصيغة المطلوبة؛ حاول مرة أخرى.',
      TEMPORARY_FAILURE:'خدمة التوأم مشغولة حاليًا، حاول لاحقًا.'};
    throw Error(messages[code]||'فشلت الاستجابة من المحرك: '+(code||error?.message||'خطأ مؤقت'));
  }
  return data;
}
$('chatForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const input=$('chatInput'),message=input.value.trim();if(!message||!state.user)return;
  if(!state.profile?.consent_to_ai){toast('احفظ موافقتك من صفحة الهوية أولًا.',true);navigate('identity');return;}
  const send=$('sendChat');buttonBusy(send,true,'يفكر...');
  try{
    input.value='';await saveMessage('user',message);
    const output=await invokeAI('chat',{message});
    state.lastAnswer=output.answer;await saveMessage('assistant',output.answer);
  }catch(err){toast(safe(err.message),true);input.value=message;}
  finally{buttonBusy(send,false);}
});
$('speakLast').addEventListener('click',()=>{
  const value=state.lastAnswer||state.messages.filter(x=>x.role==='assistant').slice(-1)[0]?.content||'';
  if(!value){toast('لا توجد إجابة لقراءتها بعد.');return;}
  if(!('speechSynthesis' in window)){toast('ميزة القراءة الصوتية غير مدعومة على هذا المتصفح.',true);return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(value.slice(0,1800));
  utterance.lang=/[\u0600-\u06ff]/.test(value)?'ar':'en-US';utterance.rate=.94;
  speechSynthesis.speak(utterance);
});
$('voiceInput').addEventListener('click',()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){toast('متصفحك لا يدعم الإملاء الصوتي حاليًا.');return;}
  const rec=new Recognition();rec.lang='ar-PS';rec.interimResults=false;rec.maxAlternatives=1;
  rec.onresult=ev=>{$('chatInput').value=($('chatInput').value+' '+ev.results[0][0].transcript).trim();};
  rec.onerror=()=>toast('تعذر الإملاء. تأكد من إذن الميكروفون.',true);
  rec.start();toast('الاستماع بدأ بإذنك، تكلم الآن.');
});

function renderTasks(){
  const tasks=$('taskList'),events=$('eventList');clearNode(tasks);clearNode(events);
  if(!state.tasks.length)emptyState(tasks,'لم تُجدول أي مهمة بعد.');
  for(const t of state.tasks){
    const card=make('article','item-card'),main=make('div','item-main'),
      name=make('strong','',t.title),
      info=make('small','',prettyDate(t.next_run)+' · '+(t.state==='scheduled'?'مجدولة':t.state==='paused'?'متوقفة':'مكتملة')),
      desc=make('p','',t.details||''),actions=make('div','item-actions'),
      remove=make('button','tiny-btn danger','حذف');
    main.append(name,info,desc);
    remove.addEventListener('click',async()=>{
      if(!confirm('هل تريد حذف هذه المهمة؟'))return;
      const {error}=await api.from(tables.tasks).delete().eq('owner_id',state.user.id).eq('id',t.id);
      if(error){toast(error.message,true);return;}await refreshTasks();toast('حُذفت المهمة.');
    });
    actions.append(remove);
    if(t.state!=='done'){
      const toggle=make('button','tiny-btn',t.state==='paused'?'استئناف':'إيقاف');
      toggle.addEventListener('click',async()=>{
        const changes=t.state==='paused'?{state:'scheduled',next_run:new Date(Date.now()+60000).toISOString()}:{state:'paused'};
        const {error}=await api.from(tables.tasks).update(changes).eq('owner_id',state.user.id).eq('id',t.id);
        if(error){toast(error.message,true);return;}await refreshTasks();
      });actions.append(toggle);
    }
    card.append(main,actions);tasks.append(card);
  }
  if(!state.events.length)emptyState(events,'سيظهر تنبيه هنا عند حلول موعد مهمة مجدولة.');
  for(const event of state.events){
    const card=make('article','item-card'),main=make('div','item-main');
    main.append(make('strong','',event.message),make('small','',prettyDate(event.created_at)));
    if(!event.seen_at)main.append(make('span','badge-soft','جديد'));
    card.append(main);events.append(card);
  }
}
$('taskForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!state.user)return;
  const button=e.target.querySelector('button[type=submit]');buttonBusy(button,true);
  try{
    const date=new Date($('taskDate').value);
    if(!Number.isFinite(date.getTime())||date.getTime()<=Date.now())throw Error('اختر موعدًا في المستقبل.');
    const {error}=await api.from(tables.tasks).insert({
      owner_id:state.user.id,title:$('taskTitle').value.trim(),
      details:$('taskDetails').value.trim(),next_run:date.toISOString(),
      repeat_every_minutes:$('taskRepeat').value?Number($('taskRepeat').value):null
    });
    if(error)throw Error(error.message);
    $('taskTitle').value='';$('taskDetails').value='';$('taskRepeat').value='';
    await refreshTasks();toast('جُدولت المهمة على الخادم بنجاح.');
  }catch(err){toast(safe(err.message),true)}finally{buttonBusy(button,false)}
});
$('refreshTasks').addEventListener('click',async()=>{try{await refreshTasks();toast('المتابعة محدثة.')}catch(e){toast(e.message,true)}});
$('markSeen').addEventListener('click',async()=>{
  if(!state.events.length)return;
  const {error}=await api.from(tables.events).update({seen_at:new Date().toISOString()})
    .eq('owner_id',state.user.id).is('seen_at',null);
  if(error){toast(error.message,true);return;}
  await refreshTasks();toast('تم تعليم الإشعارات كمقروءة.');
});

const sampleQuestions=[
  {q:'Which cranial nerve supplies the stylopharyngeus muscle?',options:['CN VII','CN IX','CN X','CN XII'],answer:1},
  {q:'Which artery is a terminal branch of the external carotid artery?',options:['Facial artery','Lingual artery','Superficial temporal artery','Superior thyroid artery'],answer:2},
  {q:'What is the only intrinsic laryngeal muscle that abducts the vocal folds?',options:['Lateral cricoarytenoid','Posterior cricoarytenoid','Cricothyroid','Thyroarytenoid'],answer:1},
  {q:'General sensation from the anterior two-thirds of the tongue travels through:',options:['Hypoglossal nerve','Glossopharyngeal nerve','Lingual nerve','Vagus nerve'],answer:2},
  {q:'Parotid duct opens into the oral vestibule opposite the:',options:['Lower first molar','Upper second molar','Upper canine','Lower second premolar'],answer:1}
];
$('loadSample').addEventListener('click',()=>{
  $('challengeJSON').value=JSON.stringify(sampleQuestions,null,2);
  toast('حُمّل نموذج تجريبي من خمسة أسئلة. يمكنك تعديله.');
});
function validateQuestions(raw){
  const parsed=JSON.parse(raw);
  if(!Array.isArray(parsed)||parsed.length<1||parsed.length>12)throw Error('المطلوب من 1 إلى 12 سؤالًا.');
  return parsed.map((q,i)=>{
    if(typeof q?.q!=='string'||q.q.trim().length<8||q.q.length>600
      ||!Array.isArray(q.options)||q.options.length<2||q.options.length>6
      ||q.options.some(o=>typeof o!=='string'||!o.trim()||o.length>200)
      ||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)
      throw Error('تحقق من السؤال رقم '+(i+1)+': السؤال والخيارات ومفتاح answer مطلوبة.');
    return {q:q.q.trim(),options:q.options.map(x=>x.trim()),answer:q.answer};
  });
}
$('prepareChallenge').addEventListener('click',async()=>{
  if(!state.user)return;
  const b=$('prepareChallenge');buttonBusy(b,true);
  try{
    const questions=validateQuestions($('challengeJSON').value);
    const {data,error}=await api.from(tables.challenges).insert({
      owner_id:state.user.id,title:$('challengeTitle').value.trim()||'Human vs AI',
      questions,human_answers:[],ai_answers:[],ai_explanations:[]
    }).select().single();
    if(error)throw Error(error.message);
    state.challenge=data;state.human=Array(questions.length).fill(-1);state.humanDone=false;state.ai=null;
    state.challenges.unshift(data);renderChallengeArena();renderChallengeHistory();renderHome();
    toast('التحدي جاهز. أجب بنفسك ثم قارن بالتوأم الرقمي.');
  }catch(e){toast(safe(e.message),true)}finally{buttonBusy(b,false);}
});
function renderChallengeArena(){
  const root=$('challengeArena'),challenge=state.challenge;
  root.replaceChildren();root.hidden=!challenge;if(!challenge)return;
  root.append(make('h2','',challenge.title),make('p','muted','اختبار تدريبي من '+challenge.questions.length+' سؤالًا — لا توجد علاقة بأنظمة مراقبة أو امتحان رسمي.'));
  const q=challenge.questions;
  if(!state.humanDone){
    root.append(make('h3','','المرحلة الأولى: إجاباتك أنت'));
    q.forEach((question,i)=>{
      const block=make('div','question-block'),header=make('div','question-title',(i+1)+'. '+question.q);
      block.append(header);
      question.options.forEach((option,j)=>{
        const row=make('button','choice-row'+(state.human[i]===j?' active':''),String.fromCharCode(65+j)+'. '+option);
        row.type='button';row.setAttribute('aria-pressed',String(state.human[i]===j));
        row.addEventListener('click',()=>{
          state.human[i]=j;
          block.querySelectorAll('.choice-row').forEach((el,k)=>{
            el.classList.toggle('active',k===j);el.setAttribute('aria-pressed',String(k===j));
          });
        });
        block.append(row);
      });root.append(block);
    });
    const submit=make('button','btn primary','تثبيت إجاباتي قبل مشاهدة نتيجة AI');
    submit.addEventListener('click',submitHuman);root.append(submit);return;
  }
  const count=q.length;
  if(!state.ai){
    root.append(make('h3','','تم تسجيل إجاباتك. الآن التوأم يجيب باستقلالية على نفس الأسئلة.'));
    const start=make('button','btn primary','⚡ دع التوأم يحل الاختبار التجريبي');
    start.addEventListener('click',runAI);root.append(start);
    root.append(make('p','note','لن نرسل مفاتيح الإجابة إلى النموذج؛ فقط نص السؤال والخيارات.'));
    return;
  }
  const result=make('div','scoreboard');
  const human=make('div',''),center=make('div','versus','VS'),ai=make('div','');
  human.append(make('div','muted','محمد الحقيقي'),make('span','score',String(challenge.human_score)+' / '+count));
  ai.append(make('div','muted','التوأم الرقمي'),make('span','score',String(challenge.ai_score)+' / '+count));
  result.append(human,center,ai);root.append(result);
  q.forEach((question,i)=>{
    const block=make('div','answer-detail');
    block.append(make('b','',(i+1)+'. '+question.q));
    const humanAnswer=state.human[i],aiAnswer=state.ai[i]?.choice??-1,correct=question.answer;
    const format=idx=>idx>=0?String.fromCharCode(65+idx)+' — '+question.options[idx]:'لم يجب';
    block.append(make('div','', 'إجابتك: '+format(humanAnswer)+(humanAnswer===correct?' ✓':' ✕')));
    block.append(make('div','', 'إجابة AI: '+format(aiAnswer)+(aiAnswer===correct?' ✓':' ✕')));
    block.append(make('div','', 'المفتاح الذي قدمته: '+format(correct)));
    if(state.ai[i]?.reason)block.append(make('p','', 'تفسير التوأم: '+state.ai[i].reason));
    root.append(block);
  });
  root.append(make('p','note','هذه درجات وفق مفاتيح التدريب التي أدخلتها أنت، وليست شهادة علمية أو تحققًا مستقلًا من صحة الأسئلة.'));
}
async function submitHuman(){
  const challenge=state.challenge;if(!challenge||state.humanDone)return;
  if(state.human.some(x=>x<0)){toast('أجب على كل الأسئلة أولًا.',true);return;}
  const score=challenge.questions.reduce((n,q,i)=>n+(q.answer===state.human[i]?1:0),0);
  const {error}=await api.from(tables.challenges).update({human_answers:state.human,human_score:score})
    .eq('owner_id',state.user.id).eq('id',challenge.id);
  if(error){toast(error.message,true);return;}
  challenge.human_answers=[...state.human];challenge.human_score=score;state.humanDone=true;
  renderChallengeArena();toast('حُفظت إجاباتك. يمكنك تشغيل التوأم الآن.');
}
async function runAI(){
  const challenge=state.challenge;if(!challenge||!state.humanDone||state.ai)return;
  if(!state.profile?.consent_to_ai){toast('فعّل إذن الذكاء الاصطناعي من صفحة الهوية.',true);navigate('identity');return;}
  const button=$('challengeArena').querySelector('.btn.primary');buttonBusy(button,true,'التوأم يحل...');
  try{
    const questions=challenge.questions.map(({q,options})=>({q,options}));
    const data=await invokeAI('solve_practice',{questions,purpose:'self_study_or_authorized_demo'});
    const ai=questions.map((q,i)=>data.answers.find(x=>x.index===i)||{choice:-1,reason:'لم يقدّم النموذج إجابة',confidence:'low'});
    const aiAnswers=ai.map(x=>x.choice);
    const score=challenge.questions.reduce((n,q,i)=>n+(q.answer===aiAnswers[i]?1:0),0);
    const {error}=await api.from(tables.challenges).update({ai_answers:aiAnswers,
      ai_explanations:ai.map(x=>x.reason),ai_score:score})
      .eq('owner_id',state.user.id).eq('id',challenge.id);
    if(error)throw Error(error.message);
    challenge.ai_answers=aiAnswers;challenge.ai_explanations=ai.map(x=>x.reason);
    challenge.ai_score=score;state.ai=ai;renderChallengeArena();renderChallengeHistory();toast('اكتملت التجربة: قارن أداءك بأداء AI.');
  }catch(e){toast(safe(e.message),true);buttonBusy(button,false)}
}
function renderChallengeHistory(){
  const target=$('challengeHistory');clearNode(target);
  if(!state.challenges.length){emptyState(target,'لم تُسجّل تجارب حتى الآن. جهّز نموذجًا تجريبيًا للبدء.');return;}
  target.append(make('h2','','تجارب سابقة'));
  for(const challenge of state.challenges.slice(0,15)){
    const card=make('article','item-card'),main=make('div','item-main');
    main.append(make('strong','',challenge.title),make('small','',prettyDate(challenge.created_at)),
      make('p','',challenge.ai_score===null?'المقارنة غير مكتملة':'نتيجتك '+challenge.human_score+' · AI '+challenge.ai_score));
    const actions=make('div','item-actions'),open=make('button','tiny-btn','عرض');
    open.addEventListener('click',()=>{
      state.challenge=challenge;
      state.human=Array.isArray(challenge.human_answers)&&challenge.human_answers.length===challenge.questions.length
        ?[...challenge.human_answers]:Array(challenge.questions.length).fill(-1);
      state.humanDone=challenge.human_score!==null;
      state.ai=challenge.ai_score===null?null:(challenge.ai_answers||[]).map((choice,i)=>({
        index:i,choice,reason:(challenge.ai_explanations||[])[i]||''
      }));
      renderChallengeArena();$('challengeArena').scrollIntoView({behavior:'smooth',block:'start'});
    });
    actions.append(open);
    const remove=make('button','tiny-btn danger','حذف');
    remove.addEventListener('click',async()=>{
      if(!confirm('حذف هذه التجربة نهائيًا؟'))return;
      const {error}=await api.from(tables.challenges).delete().eq('owner_id',state.user.id).eq('id',challenge.id);
      if(error){toast(error.message,true);return;}
      state.challenges=state.challenges.filter(x=>x.id!==challenge.id);
      if(state.challenge?.id===challenge.id){state.challenge=null;renderChallengeArena();}
      renderChallengeHistory();renderHome();
    });
    actions.append(remove);card.append(main,actions);target.append(card);
  }
}

$('exportData').addEventListener('click',async()=>{
  if(!state.user)return;
  try{
    const all={exported_at:new Date().toISOString(),profile:state.profile,
      memories:await list(tables.memory,{order:'created_at',limit:5000}),
      messages:await list(tables.messages,{order:'created_at',limit:5000}),
      tasks:await list(tables.tasks,{order:'created_at',limit:5000}),
      events:await list(tables.events,{order:'created_at',limit:5000}),
      challenges:await list(tables.challenges,{order:'created_at',limit:5000}),
      usage:await list(tables.usage,{order:'created_at',limit:5000})};
    const blob=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mohammed-ai-twin-private-export.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('صُدّرت نسخة من بياناتك. احتفظ بها في مكان آمن.');
  }catch(e){toast(safe(e.message),true)}
});
$('clearChat').addEventListener('click',async()=>{
  if(!state.user||!confirm('مسح المحادثات المخزنة نهائيًا؟'))return;
  const {error}=await api.from(tables.messages).delete().eq('owner_id',state.user.id);
  if(error){toast(error.message,true);return;}
  state.messages=[];state.lastAnswer='';renderChat();renderHome();toast('مُسح سجل المحادثة.');
});
$('deleteEverything').addEventListener('click',async()=>{
  if(!state.user||!confirm('سيُحذف ملف التوأم وجميع المعلومات والمحادثات والتحديات والمهام. هل تريد المتابعة؟'))return;
  if(prompt('لتأكيد الحذف النهائي، اكتب DELETE')!=='DELETE')return;
  try{
    for(const name of ['events','tasks','challenges','messages','memory','usage','profile']){
      const {error}=await api.from(tables[name]).delete().eq('owner_id',state.user.id);
      if(error)throw Error('تعذر حذف '+name+': '+error.message);
    }
    state.profile=null;state.memories=[];state.messages=[];state.tasks=[];
    state.events=[];state.challenges=[];state.challenge=null;state.human=[];
    state.humanDone=false;state.ai=null;state.lastAnswer='';
    renderProfile();renderMemory();renderChat();renderTasks();renderHome();renderChallengeHistory();
    navigate('identity');toast('حُذفت بيانات التوأم. حساب تسجيل الدخول الأصلي لم يتغير.');
  }catch(e){toast(safe(e.message),true)}
});
api.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_OUT'){showGate();}
  // Avoid async Supabase calls synchronously within the auth callback.
  if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(()=>{
    if(!state.user)activateSession().catch(()=>showGate());
  },100);
});
if('serviceWorker' in navigator && location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
activateSession().catch(()=>showGate());
