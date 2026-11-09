
/* NABD HEAD & NECK / DIRECTOR PRIVATE EXAM ASSISTANT
   All question content is fetched at runtime from Supabase under founder-only RLS.
   Nothing sensitive is bundled in this public JavaScript file.
*/
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
(() => {
  'use strict';
  const root = document.getElementById('nabd-head-neck-root');
  if (!root) return;
  const client = createClient(
    'https://zsmmmljgguycrvyrmakl.supabase.co',
    'sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM',
    { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false} }
  );
  const x = s => root.querySelector(s);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[ch]));
  const state = {
    owner:null, authorized:false, bank:[], loaded:false, loading:false,
    progress:{}, references:[], lang:'ar', page:'chat', session:[], index:0, selected:null,
    chat:[], showingResult:false, score:0, lastQuestion:null
  };
  const ui = {
    ar:{
      launch:'🧠 مساعد Head & Neck',subtitle:'خاص بحساب المؤسس • Level 2 / S1',
      chat:'اسأل البوت', quiz:'تدريب وامتحان', stats:'تقدّمي', sources:'المراجع',
      search:'اسأل عن عصب أو عضلة أو سؤال سابق…',send:'إرسال',
      start:'ابدأ الاختبار',next:'السؤال التالي',finish:'إنهاء الجلسة',
      chapter:'الفصل',kind:'البنك',difficulty:'الصعوبة',amount:'عدد الأسئلة',
      all:'الكل',new:'أسئلة تدريب جديدة',original:'أسئلة الموقع الأصلية',archived:'امتحانات تاريخية',
      any:'كل المستويات',medium:'متوسط',hard:'صعب',
      loading:'جارٍ تحميل بنك الأسئلة الخاص…', correct:'إجابة صحيحة',wrong:'إجابة غير صحيحة',
      why:'لماذا هذه الإجابة؟',unverified:'مفتاح الإجابة من المصدر ولم تتم مراجعته طبيًا بشكل مستقل.',
      noTranslation:'الترجمة العربية الكاملة غير متوفرة لهذا السؤال الأصلي؛ يُعرض النص الإنجليزي دون تغيير معناه.',
      translate:'ترجمة هذا السؤال خارجياً',source:'المصدر',skip:'تخطّي',noItems:'لا توجد أسئلة مناسبة لهذه التصفية.',
      welcome:'أهلاً بك في مساعد Head & Neck الخاص بك. اسألني عن موضوع تشريحي، أو اطلب سؤالًا من البنك؛ الإجابات مبنية على الأسئلة والمفاتيح المحفوظة، وليست استشارة مولّدة من نموذج لغوي.',
      notFound:'لم أعثر على تطابق موثوق في بنك الأسئلة. جرّب كتابة مصطلح تشريحي بالإنجليزية مثل foramen أو facial nerve.',
      chatHint:'اكتب: اشرح recurrent laryngeal nerve — أو: اعمل لي اختبار صعب',
      ready:'جاهز',questions:'سؤالًا',answered:'تمت إجابتها',accuracy:'نسبة النجاح',
      weak:'أسئلة تحتاج إعادة',done:'انتهت الجلسة',showQ:'تدرّب على هذا السؤال',
      sourceNote:'الأسئلة التاريخية التي لا تحتوي مفتاحًا موثوقًا متاحة للبحث فقط، وليست للتصحيح التلقائي.',
      missingImage:'السؤال يتطلب صورة غير موجودة في النص؛ استُبعد من الاختبارات المصححة.',
      noExplanation:'لا يوجد تفسير علمي مُدقق لهذا السؤال بعد؛ نعرض مفتاح المصدر فقط.',
      loadingError:'تعذّر تحميل الأسئلة. تحقق من الاتصال ومن صلاحية حساب المؤسس.',
      saved:'يُحفظ تقدمك في حسابك الإداري فقط.',offline:'الترجمة الكاملة للأسئلة الجديدة متاحة باللغتين.',
      copy:'نسخ السؤال',choose:'اختر إجابة',back:'عودة',close:'إغلاق',
      percent:'الدقة',review:'مراجعة الأخطاء'
    },
    en:{
      launch:'🧠 Head & Neck Assistant',subtitle:'Founder account only • Level 2 / S1',
      chat:'Ask the bot',quiz:'Practice & Exam',stats:'My progress',sources:'Sources',
      search:'Ask about a nerve, muscle, or previous exam…',send:'Send',
      start:'Start quiz',next:'Next question',finish:'Finish session',
      chapter:'Chapter',kind:'Bank',difficulty:'Difficulty',amount:'Questions',
      all:'All',new:'New practice questions',original:'Original question bank',archived:'Historical exams',
      any:'All levels',medium:'Medium',hard:'Hard',
      loading:'Loading your private question bank…',correct:'Correct',wrong:'Incorrect',
      why:'Why is this correct?',unverified:'This answer key comes from the source and has not been independently reviewed.',
      noTranslation:'An Arabic translation for this original source question is not available.',
      translate:'Translate this question externally',source:'Source',skip:'Skip',noItems:'No questions match these filters.',
      welcome:'Welcome to your private Head & Neck assistant. Search anatomical topics and practice questions from your bank. This is a searchable study assistant, not a generative medical AI.',
      notFound:'No reliable matching question was found. Try an anatomical term such as foramen or facial nerve.',
      chatHint:'Try: explain recurrent laryngeal nerve — or: hard anatomy exam',
      ready:'Ready',questions:'questions',answered:'answered',accuracy:'accuracy',
      weak:'Questions to review',done:'Session complete',showQ:'Practice this question',
      sourceNote:'Historical questions without validated keys can be searched but are excluded from auto-graded exams.',
      missingImage:'Questions requiring missing images are excluded from graded exams.',
      noExplanation:'No independently checked explanation is available for this question; source key only.',
      loadingError:'Could not load the bank. Verify connectivity and founder account access.',
      saved:'Your progress is saved under your owner account only.',offline:'New practice questions have full bilingual translations.',
      copy:'Copy question',choose:'Choose an answer',back:'Back',close:'Close',
      percent:'Accuracy',review:'Review mistakes'
    }
  };
  const t = key => ui[state.lang][key] || key;
  const chapters = ['Skull','ScalpFace','Neck','Orbit','EarMandible','OralPalateSalivary','TonguePharynx','LarynxTrachea','Nose','Mixed'];
  const chapterLabels = {
    Skull:['الجمجمة','Skull'],
    ScalpFace:['فروة الرأس والوجه','Scalp & Face'],
    Neck:['الرقبة','Neck'],
    Orbit:['الحجاج','Orbit'],
    EarMandible:['الأذن والفك','Ear & Mandible'],
    OralPalateSalivary:['الفم والحنك والغدد','Oral cavity & salivary glands'],
    TonguePharynx:['اللسان والبلعوم','Tongue & Pharynx'],
    LarynxTrachea:['الحنجرة والرغامى','Larynx & Trachea'],
    Nose:['الأنف','Nose'],
    Mixed:['مختلط','Mixed']
  };
  const clabel = k => (chapterLabels[k]||[k,k])[state.lang==='ar'?0:1];
  const textOf = q => (state.lang==='ar' && q.qAr) ? q.qAr : q.q;
  const optsOf = q => (state.lang==='ar' && Array.isArray(q.optsAr) && q.optsAr.length===q.opts.length) ? q.optsAr : q.opts;
  const whyOf = q => (state.lang==='ar' && q.whyAr) ? q.whyAr : (q.why || t('noExplanation'));
  const safeUrl = v => /^https:\/\/(drive\.google\.com|docs\.google\.com|www\.ayambasic\.com|ayambasic\.com)\//i.test(String(v||'')) ? String(v) : '';
  const listOptions = (id,values) => values.map((val,i)=>'<option value="'+esc(val[0])+'">'+esc(val[1])+'</option>').join('');
  function base(){
    root.innerHTML =
      '<button type="button" class="hn-launch" hidden aria-label="Open private Head and Neck assistant">'+esc(t('launch'))+' 🔒</button>'+
      '<section class="hn-panel" role="dialog" aria-label="Head and Neck study assistant" hidden>'+
        '<header class="hn-head"><div><b>✦ NABD EXAM INTELLIGENCE</b><small id="hn-subtitle">'+esc(t('subtitle'))+'</small></div><div class="hn-row">'+
          '<button type="button" id="hn-language" class="hn-x">EN</button><button type="button" id="hn-close" class="hn-x" aria-label="Close">✕</button>'+
        '</div></header>'+
        '<nav class="hn-tabs" aria-label="Exam assistant views">'+
          '<button class="hn-tab active" data-hn-tab="chat" type="button">'+esc(t('chat'))+'</button>'+
          '<button class="hn-tab" data-hn-tab="quiz" type="button">'+esc(t('quiz'))+'</button>'+
          '<button class="hn-tab" data-hn-tab="stats" type="button">'+esc(t('stats'))+'</button>'+ 
          '<button class="hn-tab" data-hn-tab="sources" type="button">'+esc(t('sources'))+'</button>'+
        '</nav>'+
        '<div id="hn-body" class="hn-body" aria-live="polite"></div>'+
      '</section>';
    x('.hn-launch').onclick = async () => {
      x('.hn-panel').hidden=false;
      x('.hn-launch').hidden=true;
      if(!state.loaded)await loadBank();
      view();
    };
    x('#hn-close').onclick=close;
    x('#hn-language').onclick=()=>{state.lang=state.lang==='ar'?'en':'ar';baseRetitle();view();};
    root.querySelectorAll('[data-hn-tab]').forEach(btn => btn.onclick=()=>{state.page=btn.dataset.hnTab;view();});
  }
  function baseRetitle(){
    x('.hn-launch').textContent=t('launch')+' 🔒';
    x('#hn-subtitle').textContent=t('subtitle');
    x('#hn-language').textContent=state.lang==='ar'?'EN':'عربي';
    root.querySelector('[data-hn-tab=chat]').textContent=t('chat');
    root.querySelector('[data-hn-tab=quiz]').textContent=t('quiz');
    root.querySelector('[data-hn-tab=stats]').textContent=t('stats');
    root.querySelector('[data-hn-tab=sources]').textContent=t('sources');
  }
  function close(){x('.hn-panel').hidden=true;x('.hn-launch').hidden=!state.authorized;}
  function bodyHtml(str){x('#hn-body').innerHTML=str;}
  function syncTabs(){root.querySelectorAll('[data-hn-tab]').forEach(b=>b.classList.toggle('active',b.dataset.hnTab===state.page));}
  function view(){
    if(!x('.hn-panel')||x('.hn-panel').hidden)return;
    syncTabs();
    if(state.loading){bodyHtml('<p class="hn-note">'+esc(t('loading'))+'</p>');return;}
    if(!state.loaded){bodyHtml('<p class="hn-note">'+esc(t('loadingError'))+'</p>');return;}
    if(state.page==='chat')chatView();
    else if(state.page==='quiz')quizView();
    else if(state.page==='stats')statsView();
    else sourcesView();
  }
  async function check(){
    try{
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError || !user)throw Error('Not authenticated');
      const {count,error}=await client.from('nabd_director_exam_questions')
        .select('question_id',{count:'exact',head:true}).limit(1);
      if(error || !count)throw Error('Not founder');
      state.owner=user.id;state.authorized=true;
      x('.hn-launch').hidden=!x('.hn-panel').hidden;
    }catch(err){
      state.owner=null;state.authorized=false;state.loaded=false;state.bank=[];state.progress={};
      x('.hn-launch').hidden=true;x('.hn-panel').hidden=true;
    }
  }
  async function loadBank(){
    if(state.loading || state.loaded || !state.authorized)return;
    state.loading=true;view();
    try{
      const batch=[], pageSize=400;
      for(let page=0;page<8;page++){
        const from=page*pageSize;
        const {data,error}=await client.from('nabd_director_exam_questions')
          .select('question_id,payload').order('question_id',{ascending:true}).range(from,from+pageSize-1);
        if(error)throw error;
        (data||[]).forEach(row=>{const q=row.payload;if(q && q.q && Array.isArray(q.opts)){q.bankUid=row.question_id;batch.push(q);}});
        if(!data || data.length<pageSize)break;
      }
      state.bank=batch;state.loaded=true;
      const {data:progress,error:progressError}=await client.from('nabd_director_exam_progress')
        .select('question_id,attempts,correct_count,last_choice,last_correct,next_review,updated_at')
        .eq('owner_id',state.owner).limit(10000);
      if(!progressError)(progress||[]).forEach(row=>state.progress[row.question_id]=row);
      const {data:refs,error:refsError}=await client.from('nabd_director_exam_references').select('ref_id,payload').order('ref_id').limit(300);
      if(!refsError)state.references=(refs||[]).map(r=>r.payload);
    }catch(err){
      state.loaded=false;state.bank=[];console.warn('NABD private exam bank unavailable',err?.message);
    }finally{state.loading=false;view();}
  }
  function nCorrect(){return Object.values(state.progress).reduce((n,r)=>n+Number(r.correct_count||0),0);}
  function nAttempts(){return Object.values(state.progress).reduce((n,r)=>n+Number(r.attempts||0),0);}
  function statsBar(){
    const attempts=nAttempts(),accuracy=attempts?Math.round(100*nCorrect()/attempts):0;
    return '<div class="hn-stats">'+
      '<div class="hn-stat"><b>'+state.bank.length+'</b><span>'+esc(t('questions'))+'</span></div>'+
      '<div class="hn-stat"><b>'+Object.keys(state.progress).length+'</b><span>'+esc(t('answered'))+'</span></div>'+
      '<div class="hn-stat"><b>'+accuracy+'%</b><span>'+esc(t('accuracy'))+'</span></div>'+
    '</div>';
  }
  function chatView(){
    let html=statsBar()+'<div class="hn-chat" id="hn-messages">';
    const messages=state.chat.length?state.chat:[{role:'bot',text:t('welcome')}];
    messages.forEach(m=>{html+='<div class="hn-msg '+esc(m.role==='me'?'me':'bot')+'">'+esc(m.text)+'</div>';});
    html+='</div><p class="hn-muted">'+esc(t('chatHint'))+'</p>'+
      '<div class="hn-chatbox"><input id="hn-ask" type="search" maxlength="400" autocomplete="off" placeholder="'+esc(t('search'))+'"/>'+
      '<button type="button" class="hn-btn" id="hn-send">'+esc(t('send'))+'</button></div>'+
      '<div id="hn-matches"></div>';
    bodyHtml(html);
    const input=x('#hn-ask');
    x('#hn-send').onclick=()=>send(input.value);
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();send(input.value);}};
  }
  function words(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,' ').split(/\s+/).filter(w=>w.length>2 && !['which','from','the','and','with','that','what','does','this','إلى','على','التي','الذي','هذا','هذه','منها','what'].includes(w)).slice(0,16);}
  function matches(text){
    const terms=words(text);if(!terms.length)return [];
    return state.bank.map(q=>{
      const question=(q.q||'').toLowerCase(), ar=(q.qAr||'').toLowerCase(),
        why=((q.why||'')+' '+(q.whyAr||'')).toLowerCase(),
        chapter=String(q.chapter||'').toLowerCase();
      const opts=(q.opts||[]).join(' ').toLowerCase();
      let score=0;
      for(const word of terms){
        if(question.includes(word))score+=5;
        if(ar.includes(word))score+=5;
        if(why.includes(word))score+=3;
        if(opts.includes(word))score+=1;
        if(chapter.includes(word))score+=2;
      }
      if(Number.isInteger(q.answer))score+=0.1;
      return {q,score};
    }).filter(z=>z.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(z=>z.q);
  }
  function showMatches(list){
    const box=x('#hn-matches');if(!box)return;
    if(!list.length){box.innerHTML='<div class="hn-note">'+esc(t('notFound'))+'</div>';return;}
    box.innerHTML=list.map((q,i)=>{
      const where=safeUrl(q.sourceUrl);
      const explain=whyOf(q);
      const note=(!q.qAr&&state.lang==='ar')?'<small class="hn-muted">'+esc(t('noTranslation'))+'</small>':'';
      return '<div class="hn-match"><b>'+(i+1)+'. '+esc(textOf(q))+'</b><div class="hn-source">'+
        esc(q.sourceLevel||q.kind)+' · '+esc(clabel(q.chapter))+'</div>'+
        '<p>'+esc(explain.slice(0,260))+'</p>'+note+
        '<div class="hn-row"><button class="hn-ghost" data-hn-practice="'+esc(q.bankUid)+'">'+esc(t('showQ'))+'</button>'+
        (where?'<a target="_blank" rel="noopener noreferrer" href="'+esc(where)+'">'+esc(t('source'))+'</a>':'')+
        '</div></div>';
    }).join('');
    box.querySelectorAll('[data-hn-practice]').forEach(b=>b.onclick=()=>{
      const q=state.bank.find(z=>z.bankUid===b.dataset.hnPractice);
      if(!q)return;
      state.session=[q];state.index=0;state.selected=null;state.showingResult=false;state.score=0;state.page='quiz';view();
    });
  }
  function send(text){
    const s=String(text||'').trim();if(!s)return;
    state.chat.push({role:'me',text:s});
    const wantQuiz=/اختبار|امتحان|quiz|test|exam/i.test(s);
    const found=matches(s);
    if(wantQuiz){
      const challenging=/صعب|hard|difficult/i.test(s);
      state.session=shuffle(state.bank.filter(q=>valid(q) && (!challenging||q.difficulty==='hard'))).slice(0,20);
      state.index=0;state.selected=null;state.showingResult=false;state.score=0;state.page='quiz';view();return;
    }
    state.chat.push({role:'bot',text:found.length?
      (state.lang==='ar'?'وجدت '+found.length+' نتائج من بنك الأسئلة. اعرض الشرح والأسئلة أدناه، وافتح أي سؤال للتدريب.':'Found '+found.length+' matches in your private question bank. Review them below.'):
      t('notFound')});
    chatView();showMatches(found);
  }
  function shuffle(arr){const x=arr.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
  function valid(q){return Number.isInteger(q.answer)&&q.answer>=0&&q.answer<(q.opts||[]).length&&!q.imageHint&&q.opts.length>1;}
  function quizView(){
    if(state.session.length){questionView();return;}
    const sourceOptions=[['all',t('all')],['generated',t('new')],['original',t('original')],['archived',t('archived')]];
    const diffOptions=[['all',t('any')],['medium',t('medium')],['hard',t('hard')]];
    bodyHtml(statsBar()+
      '<p class="hn-muted">'+esc(t('offline'))+' '+esc(t('sourceNote'))+'</p>'+
      '<div class="hn-selects">'+
        '<label>'+esc(t('chapter'))+'<select id="hn-chapter"><option value="all">'+esc(t('all'))+'</option>'+
          listOptions('c',chapters.map(ch=>[ch,clabel(ch)]))+'</select></label>'+
        '<label>'+esc(t('kind'))+'<select id="hn-kind">'+listOptions('k',sourceOptions)+'</select></label>'+
        '<label>'+esc(t('difficulty'))+'<select id="hn-diff">'+listOptions('d',diffOptions)+'</select></label>'+
        '<label>'+esc(t('amount'))+'<select id="hn-amount"><option>10</option><option selected>20</option><option>30</option><option>50</option></select></label>'+
      '</div><button id="hn-start" class="hn-btn" type="button" style="width:100%">'+esc(t('start'))+'</button>'+
      '<p id="hn-quizmsg" class="hn-muted"></p>');
    x('#hn-start').onclick=()=>{
      const ch=x('#hn-chapter').value,kind=x('#hn-kind').value,diff=x('#hn-diff').value,n=+x('#hn-amount').value;
      const subset=state.bank.filter(q=>valid(q)&&(ch==='all'||q.chapter===ch)&&(kind==='all'||q.kind===kind)&&
        (diff==='all'||q.difficulty===diff));
      if(!subset.length){x('#hn-quizmsg').textContent=t('noItems');return;}
      state.session=shuffle(subset).slice(0,n);state.index=0;state.selected=null;state.showingResult=false;state.score=0;view();
    };
  }
  function questionView(){
    if(state.index>=state.session.length){
      const score=state.score;
      state.session=[];state.index=0;state.selected=null;state.showingResult=false;
      bodyHtml('<div class="hn-note good"><b>'+esc(t('done'))+'</b><p>'+esc(String(score))+' / '+esc(String(state.lastSessionSize||0))+'</p></div>'+
        '<button class="hn-btn" id="hn-back">'+esc(t('back'))+'</button>');
      x('#hn-back').onclick=()=>view();return;
    }
    state.lastSessionSize=state.session.length;
    const q=state.session[state.index],answered=state.showingResult;
    const options=optsOf(q);
    const isArMissing=state.lang==='ar' && (!q.qAr||!q.optsAr);
    let html='<div class="hn-row" style="justify-content:space-between">'+
      '<small class="hn-muted">'+(state.index+1)+' / '+state.session.length+'</small>'+
      '<button class="hn-ghost" id="hn-end" type="button">'+esc(t('finish'))+'</button></div>'+
      '<div class="hn-progress"><div style="width:'+Math.round(100*(state.index+1)/state.session.length)+'%"></div></div>'+
      '<div class="hn-source">'+esc(clabel(q.chapter))+' · '+esc(q.sourceLevel||q.kind)+' · '+esc(q.difficulty||'')+'</div>'+
      '<div class="hn-q">'+esc(textOf(q))+'</div>';
    if(isArMissing){
      const translation='https://translate.google.com/?sl=en&tl=ar&text='+encodeURIComponent((q.q||'').slice(0,1000))+'&op=translate';
      html+='<div class="hn-muted">'+esc(t('noTranslation'))+
        ' <a href="'+esc(translation)+'" target="_blank" rel="noopener noreferrer" style="color:#a2f3f1">'+esc(t('translate'))+'</a></div>';
    }
    options.forEach((option,i)=>{
      const cls=answered?(i===q.answer?' correct':(i===state.selected?' wrong':'')):'';
      html+='<button class="hn-opt'+cls+(state.selected===i?' chosen':'')+'" data-hn-answer="'+i+'" type="button"'+(answered?' disabled':'')+'>'+
        '<b>'+String.fromCharCode(65+i)+'.</b> '+esc(option)+'</button>';
    });
    if(answered){
      const good=state.selected===q.answer;
      html+='<div class="hn-note '+(good?'good':'bad')+'"><b>'+esc(t(good?'correct':'wrong'))+'</b>'+
        '<p><strong>'+esc(t('why'))+'</strong> '+esc(whyOf(q))+'</p>'+
        (q.answerVerified==='source_key'?'<small>'+esc(t('unverified'))+'</small>':'')+
        (safeUrl(q.sourceUrl)?'<p><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(q.sourceUrl))+'" style="color:#a6f6e8">'+esc(t('source'))+'</a></p>':'')+
        '</div>';
    }
    html+='<div class="hn-row" style="margin-top:12px">'+
      '<button class="hn-btn" id="hn-next" type="button">'+esc(answered?t('next'):t('skip'))+'</button>'+
      '<button class="hn-ghost" type="button" id="hn-copy">'+esc(t('copy'))+'</button></div>';
    bodyHtml(html);
    root.querySelectorAll('[data-hn-answer]').forEach(btn=>btn.onclick=()=>{
      if(state.showingResult)return;
      state.selected=+btn.dataset.hnAnswer;state.showingResult=true;
      if(state.selected===q.answer)state.score++;
      saveProgress(q,state.selected).catch(e=>console.warn('Progress saving failed',e?.message));
      view();
    });
    x('#hn-next').onclick=()=>{
      state.index++;state.selected=null;state.showingResult=false;view();
    };
    x('#hn-end').onclick=()=>{state.session=[];state.index=0;state.selected=null;state.showingResult=false;view();};
    x('#hn-copy').onclick=async()=>{try{await navigator.clipboard.writeText(q.q+'\n'+q.opts.map((v,i)=>String.fromCharCode(65+i)+'. '+v).join('\n'));}catch{ /* clipboard may be blocked */}};
  }
  async function saveProgress(q,choice){
    if(!state.owner)return;
    const old=state.progress[q.bankUid]||{attempts:0,correct_count:0};
    const correct=choice===q.answer;
    const attempts=Number(old.attempts||0)+1,correct_count=Number(old.correct_count||0)+(correct?1:0);
    const days=correct?Math.min(14,Math.max(1,Number(old.correct_count||0)+1)):1;
    const record={owner_id:state.owner,question_id:q.bankUid,attempts,correct_count,
      last_choice:choice,last_correct:correct,next_review:new Date(Date.now()+days*86400000).toISOString(),
      updated_at:new Date().toISOString()};
    state.progress[q.bankUid]=record;
    const {error}=await client.from('nabd_director_exam_progress').upsert(record,{onConflict:'owner_id,question_id'});
    if(error)throw error;
  }
  function statsView(){
    const attempted=Object.values(state.progress);
    const bad=attempted.filter(v=>v.last_correct===false);
    const due=attempted.filter(v=>!v.next_review || new Date(v.next_review).getTime()<=Date.now());
    bodyHtml(statsBar()+
      '<div class="hn-note"><b>'+esc(t('weak'))+': '+bad.length+'</b>'+
        '<p>'+esc(t('saved'))+'</p>'+
        '<p>'+esc(t('review'))+': '+due.length+'</p></div>'+
      '<button id="hn-review" class="hn-btn" type="button">'+esc(t('review'))+'</button>'+
      '<p class="hn-muted">'+esc(t('sourceNote'))+'</p>');
    x('#hn-review').onclick=()=>{
      const ids=new Set([...bad,...due].map(v=>v.question_id));
      const pool=state.bank.filter(q=>ids.has(q.bankUid)&&valid(q));
      state.session=shuffle(pool).slice(0,25);
      state.index=0;state.selected=null;state.showingResult=false;state.score=0;
      if(state.session.length){state.page='quiz';view();}
      else alert(t('noItems'));
    };
  }
  function sourcesView(){
    bodyHtml(statsBar()+'<h3>'+esc(t('sources'))+' ('+state.references.length+')</h3>'+
      '<p class="hn-muted">'+esc(state.lang==='ar'?'هذه روابط المصادر المرجعية الخاصة بك؛ بعض الملفات تظل على Google Drive حسب صلاحيات المشاركة الخاصة بها.':'These are your reference links; Drive file access depends on the original sharing permissions.')+'</p>'+
      state.references.map(r=>{
        const url=typeof r.url==='string' && /^https:\/\//i.test(r.url)?r.url:'';
        return '<div class="hn-match"><b>'+esc(r.name||r.title||r.source||'Reference')+'</b>'+
          (r.note?'<p class="hn-muted">'+esc(r.note)+'</p>':'')+
          (url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(state.lang==='ar'?'فتح المرجع':'Open source')+'</a>':'')+'</div>';
      }).join(''));
  }
  base();baseRetitle();check();
  client.auth.onAuthStateChange((_event,_session)=>{setTimeout(check,180);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && x('.hn-panel')&&!x('.hn-panel').hidden)close();});
})();
