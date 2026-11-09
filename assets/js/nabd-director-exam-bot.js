/* NABD Director-exclusive Head & Neck tutor: public code contains NO exam questions.
   Content is fetched only from Supabase owner-scoped RLS tables after auth. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ALLOWED_HOST = 'nabdacademy-arch.github.io';
const PROJECT = 'https://zsmmmljgguycrvyrmakl.supabase.co';
const PUBLISHABLE = 'sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM';
const dashboard = document.getElementById('dashboard');
if (location.hostname === ALLOWED_HOST && dashboard) {
  const api = createClient(PROJECT, PUBLISHABLE, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.id = 'nabdExamLauncher';
  launcher.setAttribute('aria-label','فتح مساعد امتحانات Head and Neck الخاص بالمدير');
  launcher.hidden = true;
  launcher.innerHTML = '<span class="neb-orb" aria-hidden="true">🧠</span><span class="neb-label">مساعد امتحانات التشريح<small>خاص بالمدير فقط · HEAD & NECK</small></span>';
  const overlay = document.createElement('div');
  overlay.id='nabdExamOverlay';
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','مساعد امتحانات Head and Neck الخاص');
  overlay.innerHTML =
    '<div class="neb-shell">'+
      '<header class="neb-top"><div class="neb-heading"><div class="neb-icon" aria-hidden="true">✦</div>'+
      '<div><h2>NABD · HEAD & NECK EXAM TUTOR</h2><div class="neb-sub">المدير فقط · بنك خاص · 2,082 سؤالًا · عربي / English</div></div></div>'+
      '<button class="neb-close" type="button" id="nebClose" aria-label="إغلاق">✕</button></header>'+
      '<nav class="neb-nav" aria-label="أقسام المساعد">'+
      '<button class="neb-tab active" type="button" data-neb-tab="exam">📚 محاكي الامتحانات</button>'+
      '<button class="neb-tab" type="button" data-neb-tab="chat">🤖 اسأل البوت</button></nav>'+
      '<div class="neb-body">'+
        '<div class="neb-pane" id="nebExamPane"><div class="neb-state" id="nebExamState">اختر «فتح المحاكي» لعرض جميع الامتحانات بعد التحقق من صلاحية المدير.<p><button class="neb-send" id="nebLoadExam" type="button">فتح المحاكي الخاص</button></p></div><div id="nebFrameSlot" style="flex:1;min-height:0" hidden></div></div>'+
        '<div class="neb-pane" id="nebChatPane" hidden>'+
          '<div class="neb-tools"><button class="neb-chip" type="button" data-neb-prompt="Foramen ovale">Foramen ovale</button>'+
          '<button class="neb-chip" type="button" data-neb-prompt="facial nerve">Facial nerve</button>'+
          '<button class="neb-chip" type="button" data-neb-prompt="recurrent laryngeal nerve">Recurrent laryngeal</button>'+
          '<button class="neb-chip" type="button" data-neb-prompt="thyroid artery">Thyroid</button>'+
          '<button class="neb-chip" id="nebLang" type="button">🌐 English</button></div>'+
          '<div id="nebChatLog" class="neb-chat-log" role="log" aria-live="polite"></div>'+
          '<form id="nebChatForm" class="neb-form"><input id="nebChatInput" required maxlength="280" aria-label="اسأل عن موضوع التشريح" placeholder="اكتب موضوعًا مثل: foramen ovale أو اشرح لي facial nerve..."><button class="neb-send" type="submit">إرسال</button></form>'+
        '</div>'+
      '</div><div class="neb-foot">مساعد بحث في بنكك الخاص؛ لا يرسل أسئلتك إلى خدمة ذكاء اصطناعي خارجية. الإجابات غير المدققة معلّمة في المصدر.</div>'+
    '</div>';
  document.body.append(launcher,overlay);

  const $=id=>document.getElementById(id);
  let authorized=false,checking=false,owner=null,examLoaded=false,bankPromise=null,chatEnglish=false;
  const examPane=$('nebExamPane'), chatPane=$('nebChatPane'), frameSlot=$('nebFrameSlot'), examState=$('nebExamState');
  function addMessage(kind,value){
    const el=document.createElement('div');
    el.className='neb-msg '+kind;
    el.textContent=value;
    $('nebChatLog').append(el);
    $('nebChatLog').scrollTop=$('nebChatLog').scrollHeight;
  }
  addMessage('bot','أهلًا في مساعدك الخاص! اكتب اسم عصب أو شريان أو عضو أو ثقب، وسأبحث في أسئلتك وأعرض الإجابة وسببها إن كانا موثقين. للمحاكاة الكاملة افتح تبويب الامتحانات.');

  function revoke(){
    authorized=false;owner=null;launcher.hidden=true;overlay.hidden=true;examLoaded=false;bankPromise=null;
    frameSlot.replaceChildren();frameSlot.hidden=true;examState.hidden=false;
  }
  async function verifyOwner(){
    if(checking)return;
    if(dashboard.classList.contains('hidden')){revoke();return;}
    checking=true;
    try{
      const {data:{user},error:userError}=await api.auth.getUser();
      if(userError||!user){revoke();return;}
      const {data,error}=await api.from('nabd_exam_owner').select('user_id').eq('user_id',user.id).maybeSingle();
      if(error||!data||data.user_id!==user.id){revoke();return;}
      authorized=true;owner=user.id;launcher.hidden=false;
    }catch(e){revoke();console.warn('[NABD Exam] Owner verification unavailable');}
    finally{checking=false;}
  }
  function close(){overlay.hidden=true;launcher.focus();}
  function switchTab(tab){
    const exam=tab==='exam';
    examPane.hidden=!exam;chatPane.hidden=exam;
    overlay.querySelectorAll('[data-neb-tab]').forEach(button=>{
      button.classList.toggle('active',button.dataset.nebTab===tab);
      button.setAttribute('aria-selected',String(button.dataset.nebTab===tab));
    });
    if(!exam)$('nebChatInput').focus();
  }
  launcher.addEventListener('click',async()=>{
    await verifyOwner();
    if(!authorized)return;
    overlay.hidden=false;
    switchTab('exam');
    $('nebClose').focus();
  });
  $('nebClose').addEventListener('click',close);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
  overlay.querySelectorAll('[data-neb-tab]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.nebTab)));

  async function loadExam(){
    if(examLoaded)return;
    examState.textContent='🔐 جارٍ فتح المحاكي من المخزن الخاص والتحقق من هوية المدير...';
    try{
      await verifyOwner();
      if(!authorized)throw Error('الدخول غير مصرح.');
      const {data,error}=await api.from('nabd_exam_private_app_parts').select('part_no,html_content').order('part_no',{ascending:true}).limit(100);
      if(error)throw error;
      if(!data||data.length!==15||data.some((v,i)=>v.part_no!==i))throw Error('ملفات المحاكي غير مكتملة؛ أعد المحاولة.');
      const html=data.map(v=>v.html_content).join('');
      if(!html.startsWith('<!DOCTYPE html>')||!html.includes('<script id="db"'))throw Error('فشل التحقق من ملف المحاكي.');
      const frame=document.createElement('iframe');
      frame.className='neb-frame';
      frame.title='Head and Neck Exam Intelligence Lab V2 — private director view';
      frame.referrerPolicy='no-referrer';
      frame.srcdoc=html;
      frameSlot.replaceChildren(frame);
      frameSlot.hidden=false;examState.hidden=true;examLoaded=true;
    }catch(e){examState.replaceChildren();const p=document.createElement('p');p.textContent='تعذر تحميل المحاكي الخاص: '+(e.message||'خطأ في الاتصال');const b=document.createElement('button');b.className='neb-send';b.type='button';b.textContent='إعادة المحاولة';b.onclick=loadExam;examState.append(p,b);}
  }
  $('nebLoadExam').addEventListener('click',loadExam);

  async function getBank(){
    if(bankPromise)return bankPromise;
    bankPromise=(async()=>{
      const rows=[];let from=0;
      for(let page=0;page<9;page++){
        const {data,error}=await api.from('nabd_exam_questions').select('id,chapter,pool,content').order('id',{ascending:true}).range(from,from+349);
        if(error)throw error;
        rows.push(...(data||[]));
        if(!data||data.length<350)break;
        from+=350;
      }
      return rows;
    })();
    try{return await bankPromise;}catch(err){bankPromise=null;throw err;}
  }
  const stop=new Set(['اشرح','اشرحلي','ماذا','ما','هو','هي','عن','في','من','على','يا','بدي','عندي','اكتب','لي','أسئلة','سؤال','امتحان','اختبار','شرح','تفصيل','كيف','لماذا','what','which','the','and','for','from','with','this','explain','about','give','me','please','is','a','an','are']);
  function clean(v){return String(v||'').normalize('NFKD').toLowerCase().replace(/[\u064B-\u065F]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
  function keywords(v){return clean(v).split(/\s+/).filter(x=>x.length>2&&!stop.has(x));}
  function score(q,terms){
    const main=clean([q.q,q.qAr,q.chapter,q.category].join(' '));
    const detail=clean([...(q.opts||[]),...(q.optsAr||[]),q.why,q.whyAr].join(' '));
    let points=0;
    for(const word of terms){if(main.includes(word))points+=4;if(detail.includes(word))points+=1;}
    return points;
  }
  function qaCard(entry){
    const q=entry.content||{}, card=document.createElement('article');card.className='neb-qa';
    const source=document.createElement('small');source.textContent=(q.sourceLevel||entry.pool)+' · '+(q.chapter||entry.chapter)+' · '+(q.source||'NABD exam bank');
    const title=document.createElement('p');title.textContent=!chatEnglish&&q.qAr?q.qAr:q.q||'سؤال غير مكتمل';
    card.append(source,title);
    const options=(!chatEnglish&&Array.isArray(q.optsAr)&&q.optsAr.length===q.opts.length?q.optsAr:q.opts)||[];
    options.forEach((option,i)=>{const line=document.createElement('p');line.textContent=String.fromCharCode(65+i)+'. '+option;card.append(line);});
    const answer=document.createElement('div');answer.hidden=true;answer.style.borderTop='1px solid #375c6a';answer.style.paddingTop='8px';
    if(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<(q.opts||[]).length){
      const label=document.createElement('b');label.textContent='✓ '+(chatEnglish?'Answer':'الإجابة')+': '+String.fromCharCode(65+q.answer)+' · '+(options[q.answer]||q.opts[q.answer]);
      const why=document.createElement('p');why.textContent=(!chatEnglish&&q.whyAr?q.whyAr:q.why)||'المفتاح متاح، لكن لا يوجد تفسير مدقق لهذا السؤال حاليًا.';
      answer.append(label,why);
    }else{answer.textContent='⚠ لا توجد إجابة موثقة في المصدر لهذا السؤال؛ لا تعتمد على التخمين.';}
    const toggle=document.createElement('button');toggle.className='neb-chip';toggle.type='button';toggle.textContent='إظهار الإجابة والسبب';
    toggle.addEventListener('click',()=>{answer.hidden=!answer.hidden;toggle.textContent=answer.hidden?'إظهار الإجابة والسبب':'إخفاء الإجابة';});
    card.append(toggle,answer);return card;
  }
  async function ask(raw){
    const query=raw.trim();if(!query)return;
    addMessage('user',query);
    if(/اختبرني|امتحن|اختبار|ابدأ امتحان|start quiz|test me/i.test(query)){
      addMessage('bot','شغّل تبويب «محاكي الامتحانات» واختر الفصل وعدد الأسئلة والمستوى. هناك تصحيح وترجمة وشرح وحفظ للأخطاء.');
      switchTab('exam');return;
    }
    const terms=keywords(query);
    if(terms.length===0){addMessage('bot','اكتب اسم موضوع تشريحي، مثل: facial nerve أو carotid sheath أو لسان أو قحف.');return;}
    addMessage('bot','أبحث الآن في الأسئلة الخاصة...');
    const log=$('nebChatLog'),waiting=log.lastElementChild;
    try{
      await verifyOwner();if(!authorized)throw Error('انتهت صلاحية جلسة المدير.');
      const rows=await getBank();
      const found=rows.map(x=>({row:x,s:score(x.content||{},terms)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,4);
      waiting.textContent=found.length?'وجدت '+found.length+' أسئلة ذات صلة. اضغط «إظهار الإجابة والسبب» بعد محاولة الحل:':'لم أجد تطابقًا واضحًا. جرّب اسمًا إنجليزيًا أدق أو أحد المصطلحات الموجودة في المحاضرات.';
      for(const x of found)log.append(qaCard(x.row));
      log.scrollTop=log.scrollHeight;
    }catch(e){waiting.textContent='تعذّر البحث في البنك الخاص: '+(e.message||'خطأ اتصال');}
  }
  $('nebChatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('nebChatInput');const value=input.value;input.value='';ask(value);});
  overlay.querySelectorAll('[data-neb-prompt]').forEach(btn=>btn.addEventListener('click',()=>ask(btn.dataset.nebPrompt)));
  $('nebLang').addEventListener('click',()=>{chatEnglish=!chatEnglish;$('nebLang').textContent=chatEnglish?'🌐 العربية':'🌐 English';addMessage('bot',chatEnglish?'English display enabled for new results.':'تم تفعيل عرض العربية للأسئلة التي تتوفر ترجمتها.');});

  const observer=new MutationObserver(()=>{if(dashboard.classList.contains('hidden'))revoke();else verifyOwner();});
  observer.observe(dashboard,{attributes:true,attributeFilter:['class']});
  api.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')revoke();else if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='INITIAL_SESSION')setTimeout(verifyOwner,100);});
  verifyOwner();
}
