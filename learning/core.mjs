export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function gradePractice(lesson,answers){
 const feedback=lesson.quiz.map(q=>({id:q.id,correct:Number.isInteger(answers[q.id])&&answers[q.id]===q.answer,explanation:q.explanation}));
 return {score:feedback.filter(x=>x.correct).length,total:feedback.length,feedback};
}
export const normalizeSearch=value=>String(value).toLocaleLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا');
export function searchLessons(catalog,query){const tokens=normalizeSearch(query).trim().split(/\s+/).filter(Boolean);return catalog.lessons.filter(l=>tokens.every(token=>normalizeSearch(JSON.stringify([l.title,l.objectives,l.sections,l.topic,l.quiz])).includes(token)))}
export function relatedSources(catalog,lessons){return catalog.sources.filter(s=>new Set(lessons.flatMap(l=>l.source_ids)).has(s.id))}
export function progressSummary(lessons,progress){const completed=lessons.filter(l=>progress[l.id]?.completed).length;const passed=lessons.filter(l=>progress[l.id]?.score===l.quiz.length).length;return {completed,passed,percent:Math.round(completed/Math.max(1,lessons.length)*100),points:completed*10+passed*20}}
export const GRAPH={nodes:[
 {id:'heart',label:{ar:'القلب',en:'Heart'},group:'anatomy',x:280,y:160,summary:{ar:'عضو عضلي يضخ الدم خلال الدورتين الرئوية والجهازية.',en:'Muscular organ pumping blood through pulmonary and systemic circuits.'},sources:['openstax','heart']},
 {id:'blood',label:{ar:'الدم',en:'Blood'},group:'physiology',x:140,y:95,summary:{ar:'نسيج ينقل الغازات والمغذيات ومواد أخرى بين أجزاء الجسم.',en:'Tissue transporting gases, nutrients and other substances.'},sources:['openstax']},
 {id:'lungs',label:{ar:'الحويصلات',en:'Alveoli'},group:'anatomy',x:425,y:70,summary:{ar:'بنى رئوية يحدث عبر حاجزها مع الشعيرات تبادل الغازات.',en:'Lung structures exchanging gases across the alveolar–capillary barrier.'},sources:['openstax']},
 {id:'oxygen',label:{ar:'الأكسجين',en:'Oxygen'},group:'physiology',x:535,y:185,summary:{ar:'غاز أساسي للتنفس الخلوي؛ يرتبط معظمه بالهيموغلوبين في الدم.',en:'Gas essential for cellular respiration; most blood oxygen binds hemoglobin.'},sources:['openstax']},
 {id:'hemoglobin',label:{ar:'الهيموغلوبين',en:'Hemoglobin'},group:'physiology',x:420,y:290,summary:{ar:'بروتين في كريات الدم الحمراء يرتبط بالأكسجين.',en:'Protein in red blood cells that binds oxygen.'},sources:['openstax']},
 {id:'pressure',label:{ar:'ضغط الدم',en:'Blood pressure'},group:'physiology',x:130,y:260,summary:{ar:'ضغط الدم على جدران الأوعية، ويتأثر بنتاج القلب ومقاومة الأوعية.',en:'Pressure exerted on vessel walls, influenced by cardiac output and vascular resistance.'},sources:['openstax']},
 {id:'hypertension',label:{ar:'ارتفاع الضغط',en:'Hypertension'},group:'disease',x:85,y:385,summary:{ar:'حالة تتطلب قياسات وتقييمًا مناسبين؛ هذه الخريطة لا تشخّصها.',en:'A condition requiring appropriate measurements and assessment; this map does not diagnose it.'},sources:['medline','who']},
 {id:'medicines',label:{ar:'خافضات الضغط',en:'Antihypertensives'},group:'pharmacology',x:270,y:405,summary:{ar:'فئات دوائية تؤثر في تنظيم ضغط الدم بآليات مختلفة. ليست الخريطة توصية علاجية.',en:'Drug classes acting on blood-pressure regulation through different mechanisms. This map is not treatment advice.'},sources:['medline']}
],edges:[['heart','blood'],['heart','pressure'],['blood','hemoglobin'],['lungs','oxygen'],['oxygen','hemoglobin'],['blood','oxygen'],['pressure','hypertension'],['hypertension','medicines'],['medicines','pressure']]};

// Show stable support codes only. Never render upstream error text, tokens or request headers.
const TUTOR_FAILURES={
 GATEWAY_INVALID_JWT:['رفضت بوابة Supabase رمز الجلسة قبل وصول الطلب إلى المساعد. تحتاج الإدارة إلى مراجعة إعداد مصادقة الدالة.','Supabase rejected the session token before the tutor ran. The academy must review function authentication settings.'],
 AUTH_REQUIRED:['سجّل الدخول بحساب الأكاديمية ثم أعد المحاولة.','Sign in with your academy account and try again.'],
 AUTH_INVALID:['تعذّر التحقق من جلسة حسابك. أعد تسجيل الدخول ثم حاول مجددًا.','Your account session could not be verified. Sign in again and retry.'],
 FUNCTION_NOT_FOUND:['لم يُعثر على دالة المساعد المحددة في إعدادات الموقع. على الإدارة مراجعة رابط الدالة والمشروع.','The configured tutor function was not found. The academy must check its URL slug and project.'],
 CONFIG_MISSING:['وصل الطلب إلى المساعد، لكن إعدادات الخدمة على الخادم غير مكتملة. على الإدارة مراجعة الأسرار المطلوبة.','The tutor received the request, but its server configuration is incomplete. The academy must review the required secrets.'],
 QUOTA_DATABASE_UNAVAILABLE:['وصل الطلب إلى المساعد، لكن تعذّر فحص حصة الاستخدام في قاعدة البيانات. على الإدارة مراجعة تفعيل دالة الحصة وصلاحياتها.','The tutor received the request but could not check its database usage quota. The academy must review quota setup and permissions.'],
 TUTOR_RATE_LIMIT:['وصلت إلى حد طلبات المساعد لهذه الدقيقة. انتظر قليلًا ثم حاول مجددًا.','You reached the tutor request limit for this minute. Wait briefly before retrying.'],
 PROVIDER_KEY_INVALID:['خدمة التوليد رفضت مفتاح الخادم. على الإدارة مراجعة مفتاح OpenAI المحفوظ وصلاحيته.','The generation provider rejected the server key. The academy must review the stored OpenAI key and its validity.'],
 PROVIDER_PERMISSION_DENIED:['مفتاح خدمة التوليد لا يملك الصلاحية المطلوبة لهذا الطلب. على الإدارة مراجعة صلاحيات Responses والوصول للنموذج.','The generation key lacks permission for this request. The academy must review Responses permissions and model access.'],
 PROVIDER_QUOTA_EXHAUSTED:['خدمة OpenAI أبلغت بنفاد الحصة أو بلوغ حد الفوترة. على الإدارة مراجعة رصيد API وحدود الاستخدام.','OpenAI reported an exhausted quota or billing limit. The academy must review API credit and usage limits.'],
 PROVIDER_RATE_LIMIT:['خدمة التوليد مشغولة أو تجاوزت حد الطلبات مؤقتًا. انتظر قليلًا ثم حاول مجددًا.','The generation provider is busy or temporarily rate-limited. Wait briefly and retry.'],
 PROVIDER_MODEL_UNAVAILABLE:['النموذج المحدد غير متاح لمشروع خدمة التوليد. على الإدارة مراجعة إعداد النموذج.','The configured model is unavailable to the provider project. The academy must review the model setting.'],
 PROVIDER_REQUEST_REJECTED:['خدمة التوليد رفضت صيغة الطلب. على الإدارة مراجعة توافق الدالة مع النموذج.','The generation provider rejected the request format. The academy must review function and model compatibility.'],
 PROVIDER_UPSTREAM_ERROR:['خادم خدمة OpenAI أعاد خطأ مؤقتًا. على الإدارة فحص الحالة في سجلات الدالة وانتظار تعافي الخدمة.','OpenAI returned a server-side error. Check the safe provider status in Edge Function logs and retry later.'],
 PROVIDER_HTTP_ERROR:['أعادت خدمة التوليد حالة HTTP غير متوقعة. راجع حالة المزوّد في سجلات الدالة دون مشاركة المفاتيح.','The provider returned an unexpected HTTP status. Review Edge Function logs without sharing credentials.'],
 PROVIDER_CONNECTION_ERROR:['تعذّر اتصال خادم الأكاديمية بخدمة التوليد. راجع اتصال الدالة بالخدمة.','The academy server could not reach the provider. Check Edge Function connectivity.'],
 PROVIDER_INVALID_RESPONSE:['وصل رد غير صالح من خدمة التوليد، ويحتاج الفريق لمراجعة توافق الاستجابة.','The provider returned an invalid response; review response compatibility.'],
 IMAGE_PROVIDER_UNAVAILABLE:['تحليل الصور يحتاج إعداد مفتاح Gemini على الخادم. لا ترفع صور مرضى أو بيانات شخصية.','Educational image analysis requires a configured Gemini server key. Do not upload patient images or identifying information.'],
 PROVIDER_SAFETY_BLOCK:['رفض المزوّد تحليل هذا المحتوى لأسباب تتعلق بالسلامة. استخدم أمثلة تعليمية غير شخصية.','The provider declined this content for safety reasons. Use non-identifying educational examples.'],
 PROVIDER_UNAVAILABLE:['وصل الطلب إلى المساعد، لكن الاتصال بخدمة التوليد فشل. على الإدارة مراجعة طلب OpenAI في سجلات الدالة.','The tutor received the request, but its generation provider failed. The academy must inspect the OpenAI request in function logs.'],
 ORIGIN_NOT_ALLOWED:['عنوان الموقع غير مضاف إلى النطاق المسموح لخدمة المساعد. على الإدارة مراجعة إعداد النطاق.','This site origin is not allowed by the tutor. The academy must review its origin configuration.'],
 NETWORK_OR_CORS_ERROR:['تعذّر الوصول إلى دالة المساعد من المتصفح. قد يكون السبب الاتصال أو إعداد السماح لعنوان الموقع.','The browser could not reach the tutor function. Check connectivity and the function’s allowed site origin.'],
 REQUEST_TIMEOUT:['استغرقت خدمة المساعد وقتًا أطول من المتوقع. حاول مجددًا بعد قليل.','The tutor request took too long. Try again shortly.'],
 INVALID_REQUEST:['تعذّر قبول السؤال أو الصورة. راجع طول السؤال ونوع الصورة وحجمها.','The question or image could not be accepted. Check question length and image type and size.'],
 EMPTY_RESPONSE:['انتهى طلب المساعد دون إجابة قابلة للعرض. حاول مجددًا أو أرسل رمز الدعم للإدارة.','The tutor request finished without a displayable answer. Retry or share the support code with the academy.'],
 EDGE_FUNCTION_ERROR:['فشل تنفيذ دالة المساعد على الخادم. أرسل رمز الدعم للإدارة لتحديد السبب.','The tutor function failed on the server. Share the support code with the academy.'],
 SERVICE_RATE_LIMIT:['بلغت الخدمة حد الطلبات مؤقتًا. انتظر قليلًا ثم أعد المحاولة.','The service is temporarily rate-limited. Wait briefly before retrying.'],
 UNKNOWN_ERROR:['تعذّر إكمال طلب المساعد. أرسل رمز الدعم للإدارة.','The tutor request could not be completed. Share the support code with the academy.']
};
const LEGACY_TUTOR_FAILURES={
 'Authentication required':'AUTH_INVALID','Tutor service has not been activated':'CONFIG_MISSING',
 'Tutor quota database is unavailable':'QUOTA_DATABASE_UNAVAILABLE','Please wait before asking another question':'TUTOR_RATE_LIMIT',
 'Tutor provider unavailable':'PROVIDER_UNAVAILABLE','Tutor returned no answer':'EMPTY_RESPONSE',
 'Tutor request could not be completed':'EDGE_FUNCTION_ERROR','Origin not allowed':'ORIGIN_NOT_ALLOWED',
 'Invalid educational image':'INVALID_REQUEST','Invalid image signature':'INVALID_REQUEST',
 'Question must be 1–1500 characters':'INVALID_REQUEST'
};
export async function tutorFailure(result){
 const error=result?.error,response=error?.context;
 const status=Number.isInteger(response?.status)&&response.status>=100&&response.status<=599?response.status:0;
 let payload=result?.data&&typeof result.data==='object'?result.data:{};
 if(response&&typeof response.clone==='function'){
  try{const text=await response.clone().text();if(text.length<=8192){const parsed=JSON.parse(text);if(parsed&&typeof parsed==='object')payload=parsed}}catch{}
 }
 let code=typeof payload.code==='string'&&Object.hasOwn(TUTOR_FAILURES,payload.code)?payload.code:null;
 if(!code&&status===401&&payload.message==='Invalid JWT')code='GATEWAY_INVALID_JWT';
 if(!code&&typeof payload.error==='string')code=Object.hasOwn(LEGACY_TUTOR_FAILURES,payload.error)?LEGACY_TUTOR_FAILURES[payload.error]:null;
 if(!code&&status===404)code='FUNCTION_NOT_FOUND';
 if(!code&&status===401)code='AUTH_INVALID';
 if(!code&&status===429)code='SERVICE_RATE_LIMIT';
 if(!code&&status>=500)code='EDGE_FUNCTION_ERROR';
 if(!code&&error?.name==='FunctionsFetchError')code='NETWORK_OR_CORS_ERROR';
 if(!code&&error?.name==='AbortError')code='REQUEST_TIMEOUT';
 if(!code)code=error?'UNKNOWN_ERROR':'EMPTY_RESPONSE';
 return {code,status};
}
export function tutorFailureText(failure,language='ar'){
 const code=Object.hasOwn(TUTOR_FAILURES,failure?.code)?failure.code:'UNKNOWN_ERROR';
 const message=TUTOR_FAILURES[code][language==='en'?1:0];
 const status=Number.isInteger(failure?.status)&&failure.status>=100&&failure.status<=599?` · HTTP ${failure.status}`:'';
 return message+'\n\n'+(language==='en'?'Support code: ':'رمز الدعم: ')+code+status;
}
