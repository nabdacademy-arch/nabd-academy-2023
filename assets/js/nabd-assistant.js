/* NABD SMART MESSENGER — privacy-first academic guidance + opt-in authenticated Tutor.
   Loads once across public academy pages via the shared navigation/signature scripts.
   Local guide: deterministic curated help; AI: existing authenticated Supabase Edge Function.
   No chat history in storage, no API keys, no fake support ticket submissions or patient advice.
*/
(()=>{"use strict";
const D=document,source=D.currentScript?.src,base=source?new URL("../../",source):new URL("./",location.href);
if(D.getElementById("nabd-chat-root"))return;
const style=D.createElement("link");style.rel="stylesheet";style.href=new URL("assets/css/nabd-assistant.css?v=1",base).href;D.head.append(style);
const url=p=>new URL(p,base).href;
const clean=s=>String(s||"").toLowerCase().normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g,"").replace(/[أآإ]/g,"ا").replace(/ى/g,"ي").replace(/[ًٌٍَُِّْ]/g,"").trim();
const el=(tag,cls,text)=>{const x=D.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const topics=[
 {id:"courses",name:["المقررات والتسجيل","Courses & enrolment"],words:["مقرر","دورات","دورة","كورسات","مساق","مواد","اسجل","التسجيل","التحاق","enrol","register","course","classes","enrollment"],reply:["للاطلاع على المقررات افتح «مسارات الأكاديمية». وللتقديم أو متابعة التسجيل استخدم بوابة الطالب بعد تسجيل الدخول. توفر المقرر وحالته يحددهما النظام، وليس البوت.","Browse existing courses in Academy Pathways. Use the Student Portal to apply or view your enrolments after signing in. Actual course availability is determined by the academy system."],links:[["academy.html","مسارات الأكاديمية","Academy pathways"],["portal.html","بوابة الطالب","Student portal"],["university-os.html","النظام الأكاديمي","Academic system"]]},
 {id:"account",name:["تسجيل الدخول والحساب","Account & sign-in"],words:["حساب","دخول","كلمة مرور","نسيت","استعادة","تسجيل دخول","password","signin","sign in","login","account","forgot","reset"],reply:["تستطيع الدخول إلى بوابة الطالب أو مساحة التعلّم باستخدام حسابك. إذا نسيت كلمة المرور فاستخدم خيارات الاستعادة الظاهرة في بوابة الحساب؛ لا ترسل كلمة المرور هنا أبدًا.","Sign in through the Student Portal or Learning Space with your account. If you forgot your password, use the recovery options available in the account area. Never share passwords in this chat."],links:[["portal.html","بوابة الطالب","Student portal"],["learning/","مساحة التعلم","Learning space"],["policies.html","سياسة الخصوصية","Privacy policy"]]},
 {id:"certificates",name:["الشهادات والتحقق","Certificates & verification"],words:["شهاد","شهاده","وثيق","اثبات","تحقق","رمز الشهادة","qr","verify","certificate","credential","diploma"],reply:["التحقق من شهادة صادرة يتم من قسم «التحقق من الشهادات» في الرئيسية. لا يصدر البوت شهادات ولا يقرر استحقاقها؛ ذلك من صلاحيات النظام والأشخاص المخولين.","Verify an issued certificate through the homepage verification section. This assistant cannot issue certificates or decide eligibility; those are governed by authorised systems."],links:[["index.html#verify","التحقق من الشهادات","Verify certificates"],["skill-passport.html","جواز المهارات","Skill passport"]]},
 {id:"university",name:["نظام الجامعة والاختبارات","Academic OS & exams"],words:["امتحان","اختبار","درجات","علامات","حضور","غياب","جامعة","مساق","os","exam","grade","attendance","test","university"],reply:["يحتوي النظام الأكاديمي على مساحات للمقررات والوحدات والحضور والاختبارات؛ يلزم حساب مخول وبعض الخدمات قد لا تكون مفعّلة بعد. لا أستطيع رؤية درجاتك أو تغييرها.","The Academic OS provides course, module, attendance and exam workspaces. Authorised access is required; some sections may not yet be activated. I cannot view or change your grades."],links:[["university-os.html","النظام الأكاديمي","Academic OS"],["portal.html","حساب الطالب","Student account"]]},
 {id:"lectures",name:["المحاضرات الدولية","Global guest lectures"],words:["محاضر","محاضرات","القاء","لقاء","جدول","مواعيد","الاستاذ","lectur","timetable","session","schedule","speaker","webinar"],reply:["تجد معلومات مبادرة المحاضرات الدولية في بوابتها الرسمية. لا يمكنني اختراع مواعيد أو أسماء محاضرين؛ راجع الإعلانات الرسمية عند نشر الجلسات الموثقة.","Visit the Global Lectures portal for the academy initiative. I cannot invent speaker names or meeting dates; rely on verified published announcements."],links:[["global-lectures.html","المحاضرات الدولية","Global lectures"],["lecturers.html","مساحة المحاضر","Faculty space"]]},
 {id:"research",name:["الأبحاث والمشاريع","Research & projects"],words:["بحث","ابحاث","باحث","بحث علمي","مراجع","ورقة","مقال","pico","research","publication","papers","study","scientific"],reply:["تضم نبض شبكة بحث علمي ومختبر الباحث الناشئ لتعلم صياغة السؤال البحثي والمقترحات. المشاركات البحثية والشراكات الدولية الموثقة تُراجع عبر القنوات الرسمية.","NABD has a research network and a Research Starter Lab for questions, methods and proposal drafting. Verified research participation and partnerships require official review."],links:[["nabd-global-research.html","شبكة البحث العلمي","Research network"],["research-starter-lab.html","مختبر الباحث الناشئ","Research Starter Lab"]]},
 {id:"anatomy",name:["التشريح والمحاكاة","Anatomy & simulation"],words:["قلب","دماغ","رئة","كلى","تشريح","جسم","مجسم","هولوجرام","محاكاة","مستشفى","heart","anatomy","hospital","brain","lung","kidney","simulation","3d","ar","augmented"],reply:["تستطيع استكشاف الأعضاء المجسمة في إنفينيتي، وحالات المستشفى التعليمية في أطلس، وتجربة الواقع المعزز وآلة الزمن داخل NABD 2050. النماذج مبسطة للتعليم وليست أدوات تشخيص معتمدة.","Explore 3D anatomy in INFINITY, fictional hospital cases in ATLAS, and AR/time-based learning in NABD 2050. Models are simplified educational demonstrations, not validated clinical diagnostic tools."],links:[["nabd-2050.html","NABD 2050","Future Lab 2050"],["atlas/clinical-hub.html","المستشفى الافتراضي","Virtual hospital"],["infinity/","الأعضاء ثلاثية الأبعاد","3D anatomy"]]},
 {id:"ai",name:["المساعد الذكي للتعلم","AI learning tutor"],words:["ذكاء","بوت","ai","gpt","شات","معلم ذكي","المساعد","توليدي","intelligence","tutor","assistant","chatbot"],reply:["يمكنك استخدام «المعلم الذكي» من أعلى هذه المحادثة لطرح سؤال تعليمي عام بعد تسجيل الدخول. الإجابات توليدية وتحتاج تدقيق المصادر، وتوفرها يعتمد على تشغيل الخدمة وحصتها.","Choose the AI Tutor tab above to ask a general educational question after signing in. Generated answers need source verification, and availability depends on the service configuration and quota."],links:[["learning/","مساحة التعلم والمساعد","Learning & AI Tutor"],["policies.html","الخصوصية","Privacy"]]},
 {id:"skills",name:["المهارات والإنجازات","Skills & achievements"],words:["مهارة","مهارات","تقدم","انجاز","بصمه","skill","passport","competency","achievement","progress"],reply:["جواز المهارات الطبي مساحة لمتابعة التعلم وتوثيق الأنشطة وفق حسابك وصلاحيات الأكاديمية. لا يُعادل رخصة مزاولة مهنة أو اعتمادًا سريريًا.","The Medical Skill Passport tracks educational progress and evidence under your authorised account. It is not a clinical practice licence or medical accreditation."],links:[["skill-passport.html","جواز المهارات","Skill passport"],["learning/","مساحة التعلم","Learning space"]]},
 {id:"applications",name:["طلبات التطوع والتعاون","Applications & volunteering"],words:["تطوع","وظيف","متطوع","تعاون","طلبات","طلب انضمام","وظائف","volunteer","job","apply","application","collaborat","partnership"],reply:["تجد نموذج طلبات التطوع ومساحة متابعة حالة الطلب في روابط الأكاديمية. إرسال النموذج أو تغيير حالته لا يتم داخل هذه المحادثة؛ افتح البوابة الرسمية.","Use the academy's volunteering application and application status pages. This chat does not submit applications or change their status."],links:[["executive-application.html","التقديم للتطوع","Volunteer application"],["application-status.html","متابعة الطلب","Track application"],["nabd-partners.html","الشراكات","Partnerships"]]},
 {id:"offline",name:["التعلم دون إنترنت","Offline learning"],words:["انترنت","نت","اوفلاين","انقطاع","ضعيف","تحميل المحاضرات","offline","download","connectivity","network"],reply:["تتوفر حزم تعلم دون إنترنت لأجزاء من أطلس وإنفينيتي بعد تحميلها مرة مسبقًا. أما بيانات الحساب والاختبارات الرسمية فتحتاج اتصالًا والتحقق من الصلاحيات.","Parts of ATLAS and INFINITY support offline learning after the initial download. Account information and official examinations still require connectivity and authorisation."],links:[["atlas/index.html","أطلس دون إنترنت","ATLAS offline pack"],["infinity/","NABD INFINITY","INFINITY"]]},
 {id:"privacy",name:["الخصوصية والأمان","Privacy & security"],words:["خصوصي","بيانات","حذف","امان","سر","البيانات","سياس","privacy","personal","security","delete","data","consent"],reply:["وضع «دليل الأكاديمية» يعالج السؤال في متصفحك ولا يحفظ المحادثة أو يرسلها إلى خادم. وضع الذكاء الاصطناعي يرسل السؤال التعليمي فقط إلى خدمة نبض بعد اختيارك له والتحقق من حسابك، وقد تستخدم الخدمة مزود ذكاء اصطناعي خارجيًا. لا ترسل بيانات مرضى أو كلمات مرور.","Guide mode works locally in your browser without saving or sending messages. Opt-in AI mode submits your educational question to NABD's authenticated tutor, which may use an external model provider. Never submit patient identifiers or passwords."],links:[["policies.html","سياسة الخصوصية","Privacy policy"]]},
 {id:"contact",name:["التواصل مع الإدارة","Contact the academy"],words:["تواصل","اراسل","راسل","رسالة","شكوى","اقتراح","مشكلة","دعم","مساعده","إدارة","اداره","complaint","support","contact","feedback","message","help"],reply:["لإرسال رسالة فعلية إلى إدارة الأكاديمية، افتح نموذج «الشكاوى والمقترحات» في الرئيسية واملأ بياناته ثم اضغط إرسال. هذه الدردشة دليل ومساعد تعليمي؛ لا تحول الرسائل تلقائيًا إلى موظفين ولا تُنشئ تذاكر دعم.","To send a real message to academy staff, use the official Feedback & Complaints form on the homepage. This chatbot does not automatically forward chat messages or create support tickets."],links:[["index.html#feedback","أرسل رسالة للإدارة","Send feedback to academy"],["policies.html","السياسات والخصوصية","Privacy & policies"]]}
];
const welcomePages=[
 ["nabd-2050.html","anatomy"],["atlas/","anatomy"],["infinity/","anatomy"],["university-os.html","university"],
 ["nabd-global-research.html","research"],["research-starter-lab.html","research"],["global-lectures.html","lectures"],
 ["skill-passport.html","skills"],["portal.html","account"]
];
const state={open:false,mode:"guide",lang:(D.documentElement.lang||"ar").toLowerCase().startsWith("en")?"en":"ar",busy:false,request:0,history:[],recognition:null,focus:null,priorOverflow:null};
const say=(ar,en)=>state.lang==="ar"?ar:en,trans=pair=>pair[state.lang==="ar"?0:1];
const root=el("div","nb-chat",undefined);root.id="nabd-chat-root";
root.innerHTML=
 '<button type="button" id="nb-chat-launch" class="nb-chat-launch" aria-haspopup="dialog" aria-expanded="false" aria-controls="nb-chat-panel" aria-label="فتح مساعد نبض"><span class="nb-chat-spark" aria-hidden="true">✦</span><span class="nb-chat-launch-text">اسأل نبض</span><span class="nb-chat-statusdot" aria-hidden="true"></span></button>'+
 '<div id="nb-chat-shade" class="nb-chat-shade" hidden></div>'+
 '<section id="nb-chat-panel" class="nb-chat-panel" role="dialog" aria-modal="true" aria-labelledby="nb-chat-title" hidden>'+
  '<header class="nb-chat-head"><span class="nb-chat-avatar" aria-hidden="true">✦</span><span class="nb-chat-identity"><strong id="nb-chat-title">مساعد نبض الذكي</strong><small id="nb-chat-subtitle">دليل رقمي · ليس موظفًا مباشرًا</small></span><button class="nb-chat-utility" type="button" id="nb-chat-lang" aria-label="Switch language">EN</button><button class="nb-chat-utility" type="button" id="nb-chat-clear" aria-label="Clear chat" title="Clear chat">↺</button><button class="nb-chat-utility nb-chat-close" type="button" id="nb-chat-close" aria-label="Close chat">×</button></header>'+
  '<nav class="nb-chat-modes" aria-label="Chat modes"><button id="nb-chat-guide" class="nb-chat-mode" type="button" aria-pressed="true">⌕ دليل الأكاديمية</button><button id="nb-chat-ai" class="nb-chat-mode" type="button" aria-pressed="false">✦ المعلم الذكي AI</button></nav>'+
  '<p id="nb-chat-disclosure" class="nb-chat-disclosure"></p>'+
  '<div id="nb-chat-stream" class="nb-chat-stream" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
  '<div id="nb-chat-suggestions" class="nb-chat-suggestions"></div>'+
  '<form id="nb-chat-form" class="nb-chat-compose" autocomplete="off"><label class="nb-chat-sr" for="nb-chat-input">اكتب سؤالك</label><textarea id="nb-chat-input" maxlength="900" rows="2" placeholder="اكتب سؤالك هنا…" required></textarea><div class="nb-chat-compose-actions"><button id="nb-chat-mic" class="nb-chat-icon-button" type="button" aria-label="إملاء صوتي" title="إملاء صوتي">🎙</button><span id="nb-chat-counter">0 / 900</span><button id="nb-chat-send" class="nb-chat-send" type="submit">إرسال ←</button></div></form>'+
  '<footer class="nb-chat-footer"><span id="nb-chat-footnote">لا تحفظ المحادثة أو ترسلها في وضع الدليل</span><a id="nb-chat-support" href="#">التواصل الرسمي ↗</a></footer>'+
  '<div id="nb-chat-announcer" class="nb-chat-sr" aria-live="assertive"></div>'+
 '</section>';
const $=id=>root.querySelector("#"+id);
const launcher=$("nb-chat-launch"),panel=$("nb-chat-panel"),shade=$("nb-chat-shade"),stream=$("nb-chat-stream"),form=$("nb-chat-form"),input=$("nb-chat-input"),suggestions=$("nb-chat-suggestions");
function updateLabels(){
 root.dir=state.lang==="ar"?"rtl":"ltr";panel.dir=root.dir;
 $("nb-chat-title").textContent=say("مساعد نبض الذكي","NABD Smart Assistant");
 $("nb-chat-subtitle").textContent=say("دليل رقمي · ليس موظفًا مباشرًا","Digital guide · not a live agent");
 launcher.setAttribute("aria-label",say("فتح مساعد نبض الذكي","Open NABD Smart Assistant"));
 root.querySelector(".nb-chat-launch-text").textContent=say("اسأل نبض","Ask NABD");
 $("nb-chat-lang").textContent=say("EN","عربي");$("nb-chat-lang").setAttribute("aria-label",say("تغيير إلى الإنجليزية","Switch to Arabic"));
 $("nb-chat-close").setAttribute("aria-label",say("إغلاق المحادثة","Close chat"));
 $("nb-chat-clear").setAttribute("aria-label",say("حذف المحادثة من هذه الصفحة","Clear conversation on this page"));
 $("nb-chat-guide").textContent=say("⌕ دليل الأكاديمية","⌕ Academy guide");
 $("nb-chat-ai").textContent=say("✦ المعلم الذكي AI","✦ AI Learning Tutor");
 $("nb-chat-guide").setAttribute("aria-pressed",String(state.mode==="guide"));
 $("nb-chat-ai").setAttribute("aria-pressed",String(state.mode==="ai"));
 $("nb-chat-guide").classList.toggle("active",state.mode==="guide");
 $("nb-chat-ai").classList.toggle("active",state.mode==="ai");
 $("nb-chat-disclosure").textContent=state.mode==="guide"?say("إجابات من دليل نبض المحلي، دون إرسال السؤال إلى خادم.","Local academy guide. Your question is not sent to a server."):say("الوضع التوليدي اختياري وللحسابات المسجلة فقط. قد يُرسل سؤالك لمزوّد AI؛ تجنب البيانات الشخصية والطبية.","Opt-in generative AI requires sign-in. Your question may be processed by an AI provider; do not include personal or medical information.");
 input.placeholder=state.mode==="guide"?say("اسأل عن التسجيل، الشهادات، البحث…","Ask about enrolment, certificates, research…"):say("اسأل سؤالًا علميًا عامًا غير شخصي…","Ask a general, non-personal science question…");
 $("nb-chat-send").textContent=say("إرسال ←","Send →");
 $("nb-chat-footnote").textContent=state.mode==="guide"?say("المحادثة مؤقتة ولا تُحفظ","Ephemeral chat · not saved"):say("الإجابات التوليدية تحتاج مراجعة مصادر موثوقة","Verify generated answers with trusted sources");
 $("nb-chat-support").textContent=say("راسل الإدارة رسميًا ↗","Message academy staff ↗");
 $("nb-chat-support").href=url("index.html#feedback");
 $("nb-chat-mic").setAttribute("aria-label",say("إملاء صوتي عبر المتصفح","Voice dictation using browser"));
 $("nb-chat-mic").title=say("الإملاء الصوتي قد يستخدم خدمة المتصفح، ولن يرسل السؤال تلقائيًا.","Speech recognition may use your browser's service; never sends automatically.");
 $("nb-chat-mic").hidden=!(window.SpeechRecognition||window.webkitSpeechRecognition);
 const name=$("nb-chat-title");name.textContent=say("مساعد نبض الذكي","NABD Smart Assistant");
 renderHistory();renderSuggestions();
}
function addBubble(who,text,links=[],sourceText=""){
 const row=el("div","nb-chat-msg nb-chat-"+who),avatar=el("span","nb-chat-msg-avatar",who==="bot"?"✦":"●"),bubble=el("div","nb-chat-bubble");
 if(sourceText)bubble.append(el("small","nb-chat-answer-kind",sourceText));
 bubble.append(el("p","",text));
 if(links.length){const wrap=el("div","nb-chat-links");for(const item of links.slice(0,4)){const a=el("a","nb-chat-link",trans([item[1],item[2]])+" ↗");a.href=url(item[0]);a.setAttribute("rel","noopener");wrap.append(a)}bubble.append(wrap)}
 if(who==="bot"){const cp=el("button","nb-chat-copy",say("نسخ","Copy"));cp.type="button";cp.setAttribute("aria-label",say("نسخ إجابة المساعد","Copy assistant answer"));cp.addEventListener("click",()=>{if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>announce(say("تم نسخ الإجابة","Answer copied"))).catch(()=>announce(say("تعذر النسخ","Copy unavailable")))}else announce(say("النسخ غير متاح على هذا المتصفح","Copy unavailable in this browser"))});bubble.append(cp)}
 row.append(avatar,bubble);stream.append(row);stream.scrollTop=stream.scrollHeight;
}
function historyAdd(who,record){
 state.history.push({who,...record});if(state.history.length>36)state.history.splice(0,state.history.length-36);
 addBubble(who,record.text,record.links||[],record.kind||"");
}
function renderHistory(){stream.replaceChildren();for(const h of state.history)addBubble(h.who,h.text,h.links||[],h.kind||"")}
function welcome(){
 state.history=[];
 stream.replaceChildren();
 historyAdd("bot",{text:say("أهلًا بك في أكاديمية نبض! ✨ أنا دليل الأكاديمية الرقمي. اسألني عن المقررات أو الشهادات أو البحث أو المختبرات، أو اختر المعلم الذكي للأسئلة العلمية بعد تسجيل الدخول.","Welcome to NABD Academy! ✨ I'm your digital academy guide. Ask about courses, certificates, research or interactive labs. Switch to AI Tutor for science questions after signing in."),kind:say("المساعد الرقمي","Digital guide")});
}
function chosenSuggestions(){
 if(state.mode==="ai")return [{text:["اشرح الدورة الدموية بطريقة مبسطة","Explain blood circulation simply"],ask:"ai"},{text:["ما وظيفة النيفرون؟","What does the nephron do?"],ask:"ai"},{text:["كيف أصيغ سؤال PICO بحثيًا؟","How do I frame a PICO research question?"],ask:"ai"}];
 const segment=decodeURI(location.pathname).replace(base.pathname,"");
 const preferred=welcomePages.find(([part])=>segment.includes(part))?.[1];
 const ids=preferred?[preferred,"courses","certificates","research","contact"]:["courses","certificates","anatomy","research","contact"];
 return [...new Set(ids)].map(id=>topics.find(x=>x.id===id)).filter(Boolean).slice(0,5).map(x=>({text:x.name,ask:x.id}));
}
function renderSuggestions(){
 suggestions.replaceChildren();
 const hint=el("span","nb-chat-suggestion-caption",say("اقتراحات سريعة","Try asking"));suggestions.append(hint);
 for(const q of chosenSuggestions()){const b=el("button","nb-chat-chip",trans(q.text));b.type="button";b.addEventListener("click",()=>{
  if(state.busy)return;
  const topic=topics.find(x=>x.id===q.ask);
  if(state.mode==="guide"&&topic){submitQuestion(trans(topic.name))}else{input.value=trans(q.text);updateCount();input.focus()}
 });suggestions.append(b)}
}
function searchTopic(value){
 const q=clean(value);
 const segments=q.split(/[\s،,.!؟?:;()[\]{}]+/).filter(Boolean);
 const scores=topics.map(topic=>{
  let score=0;
  for(const raw of topic.words){const word=clean(raw);if(!word)continue;
   if(q===word)score+=9;else if(q.includes(word))score+=word.length>=6?5:word.length>=4?3:1;
   else if(segments.includes(word))score+=3;
  }
  return {topic,score};
 }).sort((a,b)=>b.score-a.score);
 return scores[0]?.score>0?scores[0].topic:null;
}
const sensitive=/([^\s@]+@[^\s@]+\.[^\s@]+)|(?:\+?\d[\s-]?){8,}|\b(?:password|passport|national\s*id|medical\s*record|patient\s*name|credit\s*card)\b|(?:كلمه\s*المرور|كلمة\s*السر|رقم\s*الهويه|رقم\s*الجواز|اسم\s*المريض|ملف\s*المريض|عنواني)/iu;
const medical=/\b(?:my\s*(?:symptoms?|pain|medication|diagnosis)|i\s*(?:have|feel|need)\s*(?:pain|medicine|treatment)|diagnose\s*me|prescribe)\b|(?:انا\s*(?:مريض|اعاني|بتوجع|مصاب)|أعاني|اعاني|عندي\s*(?:الم|ألم|حمي|حمى|وجع)|جرعه\s*دواء|جرعة\s*دواء|تشخيص\s*حالتي)/iu;
function guidance(q){
 if(medical.test(q))return {text:say("إذا كان سؤالك يتعلق بأعراضك أو بمريض حقيقي فلا يمكن للبوت تشخيص الحالة أو وصف علاج. راجع مختصًا طبيًا، وفي الطوارئ اتصل بخدمات الإسعاف المحلية. يمكنني مساعدتك في العثور على موارد تعليمية عامة فقط.","If this concerns your symptoms or a real patient, the chatbot cannot diagnose or prescribe treatment. Contact a qualified clinician, or local emergency services for emergencies. I can only guide you to general learning materials."),links:[["learning/","مكتبة المعلومات الطبية","Medical education resources"]]};
 if(sensitive.test(q))return {text:say("انتبه: يبدو أن السؤال يتضمن بيانات خاصة. لا تضع كلمات مرور أو أرقام هواتف أو بيانات مرضى في المحادثة. استعمل القنوات الرسمية والآمنة للتواصل.","Your question may contain private details. Do not include passwords, phone numbers or patient identifiers in this chat. Use the academy's official secure channels."),links:[["index.html#feedback","التواصل الرسمي","Official feedback"],["policies.html","الخصوصية","Privacy"]]};
 const topic=searchTopic(q);
 if(topic)return {text:trans(topic.reply),links:topic.links};
 return {text:say("أستطيع إرشادك داخل نبض، لكن لا أملك إجابة موثقة لهذا السؤال. جرّب «التسجيل»، «الشهادات»، «المحاضرات»، «البحث العلمي»، «المستشفى الافتراضي» أو انتقل إلى التواصل الرسمي. ولشرح مفاهيم علمية عامة يمكنك اختيار المعلم الذكي.","I can guide you through NABD, but I don't have a verified answer to that. Try courses, certificates, global lectures, research, virtual hospital, or official support. For general scientific explanations, choose AI Tutor."),links:[["academy.html","استكشف الأكاديمية","Explore academy"],["index.html#feedback","راسل الإدارة","Contact staff"]]};
}
function announce(text){$("nb-chat-announcer").textContent=text}
function setBusy(b){
 state.busy=b;input.disabled=b;$("nb-chat-send").disabled=b;$("nb-chat-send").textContent=b?say("جارٍ المعالجة…","Working…"):say("إرسال ←","Send →");$("nb-chat-guide").disabled=b;$("nb-chat-ai").disabled=b;
}
function updateCount(){$("nb-chat-counter").textContent=input.value.length+" / 900"}
function onlyText(answer){return typeof answer==="string"?answer.trim().slice(0,4800):""}
let clientPromise;
function loadScript(path){
 return new Promise((resolve,reject)=>{
  const s=el("script");s.src=path;s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error("Library loading failed"));D.head.append(s)
 })
}
async function connectTutor(){
 if(window.nabdSupabase)return window.nabdSupabase;
 if(clientPromise)return clientPromise;
 clientPromise=(async()=>{
  if(!window.NABD_CONFIG?.supabaseUrl||!window.NABD_CONFIG?.supabaseAnonKey)await loadScript(url("assets/js/config.js?v=12"));
  if(!window.supabase?.createClient)await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0");
  const cfg=window.NABD_CONFIG;
  if(!cfg?.supabaseUrl||!cfg?.supabaseAnonKey||!window.supabase?.createClient)throw new Error("CONFIG");
  return window.nabdSupabase||window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
 })().catch(err=>{clientPromise=null;throw err});
 return clientPromise
}
const tutorErrors={
 AUTH_INVALID:["تعذّر التحقق من الجلسة. سجّل الدخول مجددًا.","Your session could not be verified. Please sign in again."],
 TUTOR_RATE_LIMIT:["وصلت للحد المؤقت للأسئلة. حاول لاحقًا.","You reached the temporary question limit. Try again later."],
 PROVIDER_QUOTA_EXHAUSTED:["حصة خدمة الذكاء الاصطناعي غير متاحة حاليًا. استخدم دليل الأكاديمية.","AI provider quota is unavailable. Use the academy guide."],
 CONFIG_MISSING:["لم تُفعّل خدمة المساعد بشكل كامل. استخدم مكتبة التعلم.","The AI service is not fully configured. Use the learning library."],
 QUOTA_DATABASE_UNAVAILABLE:["تعذّر فحص حصة الاستخدام. راجع الإدارة.","Unable to verify AI quota. Contact academy support."],
 GATEWAY_INVALID_JWT:["جلسة الدخول غير مقبولة للخدمة. سجّل الدخول مجددًا.","Your session was rejected by the service. Sign in again."],
 PROVIDER_UNAVAILABLE:["تعذّر الوصول إلى مولّد الإجابات حاليًا.","The answer provider is currently unavailable."],
 NETWORK_OR_CORS_ERROR:["تعذّر اتصال المتصفح بخدمة الذكاء الاصطناعي.","The browser could not connect to the AI service."],
 ORIGIN_NOT_ALLOWED:["لم يُسمح لهذا العنوان بالاتصال بخدمة المساعد.","This site origin is not allowed to access the AI Tutor."],

 INVALID_REQUEST:["تعذّر قبول السؤال. جرّب إعادة الصياغة دون بيانات شخصية.","The question could not be accepted. Try rephrasing without personal details."]
};
async function tutorRequest(q){
 if(!navigator.onLine)return {text:say("المعلم الذكي يحتاج إنترنت؛ دليل نبض يعمل دون اتصال.","AI Tutor requires internet; the local academy guide remains available offline."),links:[["learning/","مكتبة التعلم","Learning library"]]};
 if(sensitive.test(q)||medical.test(q))return guidance(q);
 let db;
 try{db=await connectTutor()}catch(e){return {text:say("لم تتمكن الواجهة من تحميل إعدادات خدمة الذكاء الاصطناعي. استخدم دليل نبض الآن.","AI Tutor configuration could not be loaded. Use the academy guide."),links:[["learning/","مكتبة التعليم","Learning library"]]}};
 const user=await db.auth.getUser().catch(()=>({error:true}));
 if(user.error||!user.data?.user)return {text:say("لتفعيل الإجابات التوليدية، سجل الدخول بحساب الأكاديمية أولًا من مساحة التعلم. هذا الوضع لا يرسل سؤالك دون تسجيل الدخول.","To receive generated answers, first sign in through the academy Learning Space. Your question was not sent."),links:[["learning/","سجّل الدخول من مساحة التعلم","Sign in through Learning Space"]]};
 const cfg=window.NABD_CONFIG||{},slug=cfg.tutorFunction||"smart-processor";
 let result;
 try{result=await db.functions.invoke(slug,{body:{question:q,language:state.lang,image:null}})}
 catch(e){return {text:say("تعذّر الاتصال بخادم المساعد. جرّب وضع الدليل أو المحاولة لاحقًا.","Could not reach the tutor server. Try guide mode or retry later."),links:[["learning/","مكتبة التعليم","Learning library"]]}};
 if(result?.error||!onlyText(result?.data?.answer)){
  let code=result?.data?.code;
  if(!code&&result?.error?.context?.clone){try{const resp=result.error.context.clone(),raw=await resp.text();if(raw.length<3000)code=JSON.parse(raw)?.code}catch(e){}}
  return {text:trans(tutorErrors[code]||[ "خدمة الذكاء الاصطناعي لم تُعِد إجابة قابلة للعرض؛ قد تحتاج الإدارة إلى فحص إعداداتها وحصتها.","AI Tutor did not return an answer. The academy may need to check provider configuration and quota."]),links:[["learning/","افتح المساعد من مساحة التعلم","Open official AI Tutor"]]};
 }
 return {text:onlyText(result.data.answer),kind:say("إجابة توليدية؛ تحقق من المصادر","Generated answer · verify sources"),links:[["learning/","المراجع ومساحة التعلم","Learning resources"]]};
}
async function submitQuestion(raw){
 const q=String(raw??input.value).trim();if(!q||state.busy)return;if(q.length>900){announce(say("السؤال طويل جدًا","Question is too long"));return}
 input.value="";updateCount();historyAdd("user",{text:q});setBusy(true);
 const mode=state.mode,language=state.lang,req=++state.request;
 try{
  const result=mode==="guide"?guidance(q):await tutorRequest(q);
  if(req!==state.request)return;
  if(mode!==state.mode)state.mode=mode;
  const kind=result.kind|| (mode==="guide"?say("إرشاد من دليل نبض","NABD academy guide"):say("مساعدة تعليمية","Learning assistance"));
  historyAdd("bot",{text:result.text,links:result.links,kind});
 }catch(e){if(req===state.request)historyAdd("bot",{text:say("حدث خطأ غير متوقع. يمكن الاستمرار في دليل الأكاديمية أو التواصل رسميًا.","An unexpected error occurred. You can use the academy guide or official support."),links:[["index.html#feedback","تواصل","Support"]]})}
 finally{if(req===state.request){setBusy(false);input.focus()}}
}
function startDictation(){
 const Recognizer=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognizer){announce(say("الإملاء الصوتي غير متاح","Voice dictation unavailable"));return}
 if(state.recognition){try{state.recognition.stop()}catch(e){}state.recognition=null;return}
 try{
  const r=new Recognizer();state.recognition=r;r.lang=state.lang==="ar"?"ar-SA":"en-US";r.interimResults=false;r.maxAlternatives=1;
  r.onresult=e=>{const phrase=e.results?.[0]?.[0]?.transcript||"";input.value=(input.value?input.value+" ":"")+phrase.slice(0,900-input.value.length);updateCount();input.focus()};
  r.onend=()=>{state.recognition=null;$("nb-chat-mic").classList.remove("listening")};
  r.onerror=()=>announce(say("تعذّر الإملاء أو رُفض إذن الميكروفون.","Speech input unavailable or microphone permission denied."));
  $("nb-chat-mic").classList.add("listening");
  announce(say("يُرجى مراجعة النص قبل الإرسال؛ قد يستخدم الإملاء خدمة المتصفح.","Review the transcript before sending; browser speech services may process audio."));
  r.start()
 }catch(e){state.recognition=null;announce(say("تعذّر تشغيل الإملاء الصوتي.","Could not start voice dictation."))}
}
function openChat(){
 if(state.open)return;
 state.focus=D.activeElement;state.priorOverflow=D.body.style.overflow;D.body.style.overflow="hidden";state.open=true;
 panel.hidden=false;shade.hidden=false;launcher.setAttribute("aria-expanded","true");launcher.classList.add("open");
 input.focus();stream.scrollTop=stream.scrollHeight
}
function closeChat(){
 if(!state.open)return;
 state.open=false;panel.hidden=true;shade.hidden=true;launcher.setAttribute("aria-expanded","false");launcher.classList.remove("open");D.body.style.overflow=state.priorOverflow||"";
 if(state.recognition){try{state.recognition.stop()}catch(e){}state.recognition=null}
 (state.focus?.isConnected?state.focus:launcher).focus()
}
function setMode(mode){
 if(state.busy||!["guide","ai"].includes(mode))return;
 state.mode=mode;updateLabels();
 historyAdd("bot",{text:mode==="ai"?say("أنت الآن في وضع المعلم الذكي الاختياري. يجب تسجيل الدخول أولًا. اكتب سؤالًا علميًا عامًا فقط؛ لا تضع بيانات شخصية أو بيانات مرضى.","You are now in opt-in AI Tutor mode. Sign-in is required. Ask general science questions only; never share private or patient data."):say("عدنا إلى دليل نبض المحلي. اسأل عن الخدمات والبوابات، دون إرسال السؤال إلى خادم.","Back to the local NABD guide. Ask about academy routes without sending your question to a server."),kind:say("تنبيه الوضع","Mode notice")})
}
launcher.addEventListener("click",openChat);
$("nb-chat-close").addEventListener("click",closeChat);shade.addEventListener("click",closeChat);
$("nb-chat-support").addEventListener("click",closeChat);
stream.addEventListener("click",e=>{if(e.target.closest("a[href]"))closeChat()});
$("nb-chat-lang").addEventListener("click",()=>{state.lang=state.lang==="ar"?"en":"ar";updateLabels()});
$("nb-chat-clear").addEventListener("click",()=>{state.request++;setBusy(false);state.history=[];welcome();renderSuggestions();input.value="";updateCount();input.focus()});
$("nb-chat-guide").addEventListener("click",()=>setMode("guide"));
$("nb-chat-ai").addEventListener("click",()=>setMode("ai"));
$("nb-chat-mic").addEventListener("click",startDictation);
input.addEventListener("input",updateCount);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!state.busy)void submitQuestion()}});
form.addEventListener("submit",e=>{e.preventDefault();void submitQuestion()});
D.addEventListener("keydown",e=>{
 if(!state.open)return;
 if(e.key==="Escape"){e.preventDefault();closeChat();return}
 if(e.key!=="Tab")return;
 const focusable=[...panel.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled])')].filter(x=>x.getClientRects().length&&x.offsetParent!==null);
 if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&D.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&D.activeElement===last){e.preventDefault();first.focus()}
});
D.addEventListener("nabd-chat-open",openChat);
D.body.append(root);
updateLabels();welcome();renderSuggestions();updateCount();
})();
