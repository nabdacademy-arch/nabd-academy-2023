/* NABD Director-exclusive Head & Neck tutor: public code contains NO exam questions.
   Content is fetched only from Supabase owner-scoped RLS tables after auth. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const ALLOWED_HOST = 'nabdacademy-arch.github.io';
const PROJECT = 'https://zsmmmljgguycrvyrmakl.supabase.co';
const PUBLISHABLE = 'sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM';
const dashboard = document.getElementById('dashboard') || document.getElementById('app');
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
      '<button class="neb-tab active" type="button" data-neb-tab="bank">📖 جميع الأسئلة (2,082)</button>'+ 
      '<button class="neb-tab" type="button" data-neb-tab="exam">📚 محاكي الامتحانات</button>'+
      '<button class="neb-tab" type="button" data-neb-tab="chat">🤖 اسأل البوت</button></nav>'+
      '<div class="neb-body">'+
        '<div class="neb-pane" id="nebBankPane">'+
          '<div class="neb-bank-toolbar"><input id="nebBankSearch" type="search" maxlength="180" placeholder="ابحث في جميع الأسئلة والخيارات..." aria-label="بحث شامل في الأسئلة" />'+
          '<select id="nebBankPool" aria-label="مصدر الأسئلة"><option value="all">جميع المصادر</option><option value="generated">1,000 سؤال جديد</option><option value="original">أسئلة المصادر السابقة</option><option value="archived">الأسئلة التاريخية</option></select>'+
          '<select id="nebBankChapter" aria-label="الفصل"><option value="all">كل الفصول</option></select>'+
          '<button type="button" class="neb-chip" id="nebBankReset">إعادة التصفية</button></div>'+
          '<div class="neb-bank-status" id="nebBankStatus" role="status" aria-live="polite">الأسئلة محفوظة بشكل خاص؛ سيتم تحميلها عند فتح البوت.</div>'+
          '<div class="neb-bank-list" id="nebBankList"></div>'+
          '<div class="neb-bank-footer"><button id="nebBankPrev" type="button" class="neb-chip">السابق</button><span id="nebBankPages">—</span><button id="nebBankNext" type="button" class="neb-chip">التالي</button></div>'+
        '</div>'+
        '<div class="neb-pane" id="nebExamPane" hidden><div class="neb-state" id="nebExamState">اختر «فتح المحاكي» لعرض جميع الامتحانات بعد التحقق من صلاحية المدير.<p><button class="neb-send" id="nebLoadExam" type="button">فتح المحاكي الخاص</button></p></div><div id="nebFrameSlot" style="flex:1;min-height:0" hidden></div></div>'+
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
  let authorized=false,checking=false,owner=null,examLoaded=false,bankPromise=null,chatEnglish=false,bankRows=null,bankFiltered=[],bankPage=0,bankLoadPromise=null;
  const BANK_PAGE_SIZE=20;
  const answerState=new Map(),progressState=new Map();
  const bankPane=$('nebBankPane'),examPane=$('nebExamPane'), chatPane=$('nebChatPane'), frameSlot=$('nebFrameSlot'), examState=$('nebExamState');
  function addMessage(kind,value){
    const el=document.createElement('div');
    el.className='neb-msg '+kind;
    el.textContent=value;
    $('nebChatLog').append(el);
    $('nebChatLog').scrollTop=$('nebChatLog').scrollHeight;
  }
  addMessage('bot','أهلًا في مساعدك الخاص! اكتب اسم عصب أو شريان أو عضو أو ثقب، وسأبحث في أسئلتك وأعرض الإجابة وسببها إن كانا موثقين. للمحاكاة الكاملة افتح تبويب الامتحانات.');

  function revoke(){
    authorized=false;owner=null;launcher.hidden=true;overlay.hidden=true;examLoaded=false;bankPromise=null;bankRows=null;bankFiltered=[];bankPage=0;bankLoadPromise=null;answerState.clear();progressState.clear();
    $('nebBankList').replaceChildren();$('nebBankStatus').textContent='سجّل الدخول بحساب المدير لاستعراض الأسئلة.';$('nebBankPages').textContent='—';
    frameSlot.replaceChildren();frameSlot.hidden=true;examState.hidden=false;
    examState.replaceChildren();
    const description=document.createElement('p');
    description.textContent='المحاكي الخاص متاح بعد تسجيل الدخول بحساب المدير.';
    const reopen=document.createElement('button');
    reopen.className='neb-send';reopen.type='button';reopen.textContent='فتح المحاكي الخاص';
    reopen.addEventListener('click',loadExam);
    examState.append(description,reopen);
    $('nebChatLog').replaceChildren();
    addMessage('bot','أهلًا في مساعدك الخاص! اسأل عن موضوع من أسئلة Head & Neck أو اختر المحاكي.');
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
    const exam=tab==='exam',bank=tab==='bank';
    bankPane.hidden=!bank;examPane.hidden=!exam;chatPane.hidden=tab!=='chat';
    overlay.querySelectorAll('[data-neb-tab]').forEach(button=>{
      button.classList.toggle('active',button.dataset.nebTab===tab);
      button.setAttribute('aria-selected',String(button.dataset.nebTab===tab));
    });
    if(tab==='chat')$('nebChatInput').focus();
    if(bank)loadBankBrowser();
    if(exam&&!examLoaded)loadExam();
  }
  launcher.addEventListener('click',async()=>{
    await verifyOwner();
    if(!authorized)return;
    overlay.hidden=false;
    switchTab('bank');
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
      const requestOwner=owner;
      const {data,error}=await api.from('nabd_exam_private_app_parts').select('part_no,html_content').eq('owner_id',requestOwner).order('part_no',{ascending:true}).limit(100);
      if(error)throw error;
      if(!authorized||owner!==requestOwner||dashboard.classList.contains('hidden'))throw Error('انتهت جلسة المدير؛ سجّل الدخول مجددًا.');
      if(!data||!data.length||data.length>100||data.some((v,i)=>v.part_no!==i||typeof v.html_content!=='string'))throw Error('ملفات المحاكي غير مكتملة؛ أعد المحاولة.');
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
  async function loadBankBrowser(){
    if(!authorized||!owner)return;
    if(bankRows){filterBankBrowser();return;}
    if(bankLoadPromise)return bankLoadPromise;
    const expectedOwner=owner;
    $('nebBankStatus').textContent='⏳ جارٍ تحميل بنك الأسئلة الحقيقي من قاعدة البيانات الخاصة...';
    bankLoadPromise=(async()=>{
      try{
        const rows=await getBank();
        if(!authorized||owner!==expectedOwner||dashboard.classList.contains('hidden'))return;
        bankRows=rows.filter(entry=>{
          const q=entry.content||{};
          return typeof q.q==='string'&&q.q.trim().length>0&&Array.isArray(q.opts)&&q.opts.length>=2;
        });
        const select=$('nebBankChapter'),chapters=[...new Set(bankRows.map(row=>row.chapter||row.content?.chapter).filter(Boolean))].sort();
        select.replaceChildren(new Option('كل الفصول','all'));
        for(const chapter of chapters)select.append(new Option(chapter,chapter));
        filterBankBrowser();
        loadSavedProgress(expectedOwner).catch(err=>console.warn('[NABD] Could not load owner progress',err?.message));
      }catch(error){
        $('nebBankStatus').textContent='تعذر تحميل الأسئلة: '+(error.message||'خطأ اتصال')+' — جرّب فتح البوت مجددًا.';
        $('nebBankList').replaceChildren();$('nebBankPages').textContent='—';
      }finally{bankLoadPromise=null;}
    })();
    return bankLoadPromise;
  }
  function filterBankBrowser(){
    if(!bankRows)return;
    const source=$('nebBankPool').value,chapter=$('nebBankChapter').value;
    const terms=clean($('nebBankSearch').value).split(/\s+/).filter(Boolean);
    bankFiltered=bankRows.filter(row=>{
      const q=row.content||{};
      if(source!=='all'&&row.pool!==source&&q.kind!==source)return false;
      if(chapter!=='all'&&(row.chapter||q.chapter)!==chapter)return false;
      if(terms.length){
        const searchable=clean([q.q,q.qAr,...(q.opts||[]),...(q.optsAr||[]),q.why,q.whyAr,q.chapter,q.source].join(' '));
        if(!terms.every(word=>searchable.includes(word)))return false;
      }
      return true;
    });
    bankPage=0;renderBankBrowser();
  }
  function renderBankBrowser(){
    const list=$('nebBankList');list.replaceChildren();
    if(!authorized||!bankRows)return;
    const total=bankFiltered.length,pages=Math.max(1,Math.ceil(total/BANK_PAGE_SIZE));
    bankPage=Math.min(bankPage,pages-1);
    const start=bankPage*BANK_PAGE_SIZE;
    const shown=bankFiltered.slice(start,start+BANK_PAGE_SIZE);
    $('nebBankStatus').textContent='📚 '+total.toLocaleString('ar')+' سؤالًا مطابقًا من '+bankRows.length.toLocaleString('ar')+' سؤالًا محمّلًا. اعرض الإجابة وشرحها بعد المحاولة.';
    if(!total){
      const p=document.createElement('p');p.className='neb-bank-empty';p.textContent='لا توجد أسئلة بهذه التصفية. جرّب اختيار جميع المصادر أو تغيير مصطلح البحث.';list.append(p);
    }
    const frag=document.createDocumentFragment();
    for(let i=0;i<shown.length;i++){
      const item=document.createElement('div');item.className='neb-bank-entry';
      const number=document.createElement('small');number.className='neb-bank-n';number.textContent='سؤال '+(start+i+1)+' من '+total;
      item.append(number,qaCard(shown[i]));frag.append(item);
    }
    list.append(frag);
    $('nebBankPages').textContent='صفحة '+(bankPage+1)+' / '+pages;
    $('nebBankPrev').disabled=bankPage<=0;
    $('nebBankNext').disabled=bankPage>=pages-1;
    list.scrollTop=0;
  }
  $('nebBankSearch').addEventListener('input',filterBankBrowser);
  $('nebBankPool').addEventListener('change',filterBankBrowser);
  $('nebBankChapter').addEventListener('change',filterBankBrowser);
  $('nebBankReset').addEventListener('click',()=>{
    $('nebBankSearch').value='';$('nebBankPool').value='all';$('nebBankChapter').value='all';filterBankBrowser();
  });
  $('nebBankPrev').addEventListener('click',()=>{if(bankPage>0){bankPage--;renderBankBrowser();}});
  $('nebBankNext').addEventListener('click',()=>{if((bankPage+1)*BANK_PAGE_SIZE<bankFiltered.length){bankPage++;renderBankBrowser();}});
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
  async function loadSavedProgress(expectedOwner){
    const fetched=[];
    for(let start=0;start<4000;start+=500){
      const {data,error}=await api.from('nabd_exam_progress')
        .select('question_id,attempts,wrong,last_correct').eq('user_id',expectedOwner)
        .order('question_id',{ascending:true}).range(start,start+499);
      if(error)throw error;
      fetched.push(...(data||[]));
      if(!data||data.length<500)break;
    }
    if(!authorized||owner!==expectedOwner)return;
    for(const record of fetched){
      if(!progressState.has(record.question_id))progressState.set(record.question_id,record);
    }
  }
  async function storeAttempt(entry,wasCorrect,status){
    if(!wasCorrect && wasCorrect!==false)return;
    const uid=owner;
    if(!authorized||!uid)return;
    const id=entry.id;
    const prev=progressState.get(id)||{attempts:0,wrong:0};
    const next={question_id:id,user_id:uid,attempts:(Number(prev.attempts)||0)+1,
      wrong:(Number(prev.wrong)||0)+(wasCorrect?0:1),last_correct:wasCorrect,
      updated_at:new Date().toISOString()};
    progressState.set(id,next);
    const {error}=await api.from('nabd_exam_progress').upsert(next,{onConflict:'user_id,question_id'});
    if(error){
      progressState.set(id,prev);
      status.textContent+=' · تعذّر حفظ التقدم: '+error.message;
    }else{
      status.textContent+=' · ✓ حُفظ التقدم الخاص بك';
    }
  }
  function qaCard(entry){
    const q=entry.content||{}, card=document.createElement('article');
    card.className='neb-qa';
    const source=document.createElement('small');
    source.textContent=(q.sourceLevel||entry.pool)+' · '+(q.chapter||entry.chapter)+' · '+(q.source||'NABD exam bank');
    const title=document.createElement('p');
    title.className='neb-question';
    title.textContent=!chatEnglish&&q.qAr?q.qAr:q.q||'سؤال غير مكتمل';
    card.append(source,title);
    const options=(!chatEnglish&&Array.isArray(q.optsAr)&&q.optsAr.length===q.opts.length?q.optsAr:q.opts)||[];
    const hasKey=Number.isInteger(q.answer)&&q.answer>=0&&q.answer<options.length;
    const keyLevel=q.answerVerified||'not_verified';
    const state=answerState.get(entry.id)||{chosen:null,submitted:false};
    const optionList=document.createElement('div');
    optionList.className='neb-options';
    optionList.setAttribute('role','group');
    optionList.setAttribute('aria-label','اختر الإجابة لهذا السؤال');
    const feedback=document.createElement('div');feedback.className='neb-answer-feedback';feedback.setAttribute('role','status');
    const actions=document.createElement('div');actions.className='neb-answer-actions';
    const confirm=document.createElement('button');confirm.type='button';confirm.className='neb-send';
    confirm.textContent='تأكيد إجابتي';confirm.disabled=state.chosen===null||state.submitted;
    const reset=document.createElement('button');reset.type='button';reset.className='neb-chip';reset.textContent='محاولة جديدة';
    reset.hidden=!state.submitted;
    const answer=document.createElement('div');answer.className='neb-answer-explain';answer.hidden=true;
    const toggle=document.createElement('button');toggle.className='neb-chip';toggle.type='button';toggle.textContent='إظهار الإجابة والسبب';
    const saved=progressState.get(entry.id);
    if(saved){
      const badge=document.createElement('small');badge.className='neb-progress-badge';
      badge.textContent='محاولات محفوظة: '+saved.attempts+' · أخطاء: '+saved.wrong;
      card.append(badge);
    }
    const provenance=document.createElement('small');
    provenance.className='neb-provenance';
    if(keyLevel==='externally_checked')provenance.textContent='✓ تمت مراجعة الإجابة بمصدر علمي مرفق.';
    else if(keyLevel==='curated_fact')provenance.textContent='مفتاح من مجموعة الحقائق التعليمية المنقحة؛ لم تُراجع جميع صياغات الأسئلة بمصدر مستقل.';
    else if(keyLevel==='source_key')provenance.textContent='مفتاح من ملف الأسئلة السابق؛ يحتاج مراجعة مرجعية مستقلة.';
    else provenance.textContent='⚠ لا يوجد مفتاح إجابة قابل للتحقق لهذا السؤال حاليًا.';
    card.append(provenance);
    function drawOptions(){
      optionList.replaceChildren();
      options.forEach((option,i)=>{
        const row=document.createElement('button');
        row.type='button';row.className='neb-choice';row.disabled=state.submitted;
        row.setAttribute('aria-pressed',String(state.chosen===i));
        if(state.chosen===i)row.classList.add('selected');
        if(state.submitted&&hasKey&&i===q.answer)row.classList.add('correct');
        if(state.submitted&&hasKey&&i===state.chosen&&state.chosen!==q.answer)row.classList.add('incorrect');
        const marker=document.createElement('span');marker.className='neb-choice-marker';marker.textContent=state.chosen===i?'●':'○';
        const letter=document.createElement('b');letter.textContent=String.fromCharCode(65+i)+'.';
        const label=document.createElement('span');label.textContent=option;
        row.append(marker,letter,label);
        row.addEventListener('click',()=>{
          if(state.submitted)return;
          state.chosen=i;answerState.set(entry.id,state);confirm.disabled=false;
          drawOptions();
        });
        optionList.append(row);
      });
    }
    function createAnswer(){
      answer.replaceChildren();
      if(hasKey){
        const label=document.createElement('b');
        label.textContent='✓ '+(chatEnglish?'Correct answer':'الإجابة الصحيحة')+': '+
          String.fromCharCode(65+q.answer)+' · '+(options[q.answer]||q.opts[q.answer]);
        const explanation=document.createElement('p');
        explanation.textContent=(!chatEnglish&&q.whyAr?q.whyAr:q.why)||
          'المفتاح متوفر ولكن لم يُضف له تفسير موثوق بعد؛ راجع المرجع الأصلي.';
        answer.append(label,explanation);
        const note=document.createElement('small');note.textContent=provenance.textContent;answer.append(note);
        if(typeof q.referenceUrl==='string'&&/^https:\/\/[a-z0-9.-]+\//i.test(q.referenceUrl)){
          const link=document.createElement('a');link.href=q.referenceUrl;link.rel='noopener noreferrer';
          link.target='_blank';link.textContent='المرجع العلمي للإجابة';
          answer.append(link);
        }
      }else{
        const p=document.createElement('p');p.textContent='⚠ لا تتوفر إجابة مدققة لهذا السؤال؛ سجّل اختيارك للتدريب فقط ولا تعتبره صحيحًا أو خاطئًا حتى تتم مراجعته.';
        answer.append(p);
      }
    }
    function showFeedback(){
      if(!state.submitted){feedback.textContent='';return;}
      if(!hasKey)feedback.textContent='تم تسجيل اختيارك للتدريب. هذا السؤال لم تتم مراجعة إجابته بعد؛ لا يوجد حكم بصح أو خطأ.';
      else feedback.textContent=state.chosen===q.answer?'✓ إجابة صحيحة!':'✕ ليست الإجابة الصحيحة. راجع الشرح بالأسفل.';
      feedback.classList.toggle('good',hasKey&&state.chosen===q.answer);
      feedback.classList.toggle('bad',hasKey&&state.chosen!==q.answer);
    }
    confirm.addEventListener('click',()=>{
      if(state.submitted||state.chosen===null)return;
      state.submitted=true;answerState.set(entry.id,state);
      confirm.disabled=true;reset.hidden=false;answer.hidden=false;toggle.textContent='إخفاء الإجابة والسبب';
      showFeedback();drawOptions();
      const ownerAtAnswer=owner;
      if(hasKey&&authorized&&ownerAtAnswer){
        storeAttempt(entry,state.chosen===q.answer,feedback)
          .catch(err=>{feedback.textContent+=' · تعذّر حفظ التقدم: '+(err?.message||'خطأ');});
      }
    });
    reset.addEventListener('click',()=>{
      state.chosen=null;state.submitted=false;answer.hidden=true;
      answerState.set(entry.id,state);toggle.textContent='إظهار الإجابة والسبب';reset.hidden=true;confirm.disabled=true;
      showFeedback();drawOptions();
    });
    toggle.addEventListener('click',()=>{
      answer.hidden=!answer.hidden;
      toggle.textContent=answer.hidden?'إظهار الإجابة والسبب':'إخفاء الإجابة';
    });
    createAnswer();drawOptions();showFeedback();
    card.append(optionList,feedback,actions,answer);
    actions.append(confirm,reset,toggle);
    return card;
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
      const requestOwner=owner;
      const rows=await getBank();
      if(!authorized||owner!==requestOwner||dashboard.classList.contains('hidden'))throw Error('انتهت جلسة المدير.');
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
