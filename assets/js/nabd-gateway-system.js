/* NABD Gateway Identity · presentation only. Existing auth, access controls & business logic stay intact. */
(function() {
  "use strict";
  const sharedBack = "index.html";
  const C = {
    "portal.html": {theme:"student", icon:"🎓", image:"anatomy.jpg", focus:"#authSection",
      ar:["بوابة الطلاب · NABD STUDENTS","تعليمك اليوم.","مستقبلك غدًا.","مساحة الطالب للوصول إلى المقررات والمصادر التعليمية والشهادات الموثّقة بعد التحقق من حسابك. كل خطوة دراسية في مكانها الصحيح.",["مقرراتك","تقدمك الدراسي","شهاداتك"],"ادخل إلى عالمك الأكاديمي","ابدأ بحساب نبض الحالي، أو أنشئ حسابًا للانتقال إلى مسارك التعليمي.","الوصول إلى تسجيل الدخول ←","يُعرض المحتوى الشخصي بعد تسجيل الدخول والتحقق من الصلاحيات."],
      en:["STUDENT GATEWAY · NABD STUDENTS","Your learning today.","Your future tomorrow.","Your space for courses, learning materials and verifiable certificates. Personal records require an authenticated account.",["Your courses","Study progress","Certificates"],"Access your academic world","Sign in with your NABD account or create an account to begin your learning journey.","Go to sign in →","Private records are shown only after authentication and permission checks."]},
    "portal/index.html":{theme:"council",icon:"◆",image:"founder.jpg",focus:"#app",home:"../index.html",
      ar:["المجلس التنفيذي · NABD COUNCIL","حيث تُدار الرؤية.","وتُصنع القرارات.","مساحة قيادة مخصصة لأعضاء المجلس التنفيذي المخوّلين، لتنظيم المتابعة والمسؤوليات والقرارات الأكاديمية.",["حوكمة مؤسسية","مهام واضحة","مراجعات موثّقة"],"منصة المجلس التنفيذي","هذه المساحة للأعضاء المصرّح لهم فقط. تُعرض أدوات المجلس وفق صلاحيات الحساب.","الدخول إلى مساحة المجلس ←","لا يمنح عرض الصفحة أي صلاحية إدارية."],
      en:["NABD EXECUTIVE COUNCIL","Where vision is guided.","And decisions take shape.","A dedicated workspace for authorised council members to follow responsibilities, decisions and academic governance.",["Governance","Accountable tasks","Review records"],"Executive Council workspace","This space is reserved for authorised members. Access depends on account permissions.","Open council workspace →","Visiting this page does not grant executive permissions."]},
    "lecturers.html":{theme:"faculty",icon:"✧",image:"physiology.jpg",focus:"#studio-login",move:"#studio-login",
      ar:["استوديو المحاضرين · NABD FACULTY","قدّم علمًا يبقى.","واصنع أثرًا يتجدد.","مساحة للمحاضر لترتيب الجلسات وإدارة الموارد التعليمية ومشاركة المحتوى مع طلاب المقررات التي كُلِّف بتدريسها.",["إدارة المحاضرات","محتوى أكاديمي","تكليفات معتمدة"],"حساب المحاضر","الدخول عبر الحساب الأكاديمي المصرح له، من دون إنشاء صلاحيات تدريس تلقائيًا.","الوصول إلى الاستوديو ←","تكليف المحاضر وإتاحة سجلات الطلاب يخضعان لصلاحيات الإدارة."],
      en:["LECTURER STUDIO · NABD FACULTY","Teach with purpose.","Leave a lasting impact.","A dedicated space for lecturers to plan sessions, manage resources and share materials with students in their assigned courses.",["Lecture planning","Academic content","Approved assignments"],"Lecturer account","Sign in with your authorised academy account. Faculty privileges are assigned separately.","Open lecturer studio →","Teaching permissions are granted by the academy, not by opening this page."]},
    "nabd-360-lecturers.html":{theme:"volunteer",icon:"♡",image:"hero-medical.jpg",focus:"#n360-application",
      ar:["التطوع الأكاديمي · NABD GLOBAL FACULTY","خبرتك قد تصنع فرقًا.","ولو بمحاضرة واحدة.","بوابة لطلب التطوع بالتدريس ومشاركة المعرفة الطبية. تتم مراجعة الطلبات قبل تأكيد أي تعاون أو موعد.",["تطوع علمي","طلاب غزة","مشاركة معرفية"],"انضم إلى شبكة المحاضرين","تقديم طلب اهتمام بالتطوع، وليس إعلان انضمام أو شراكة مؤكدة.","استكشف طلب التطوع ←","لا يُنشر اسم المحاضر أو تُبرمج محاضرة إلا بموافقته والإجراءات اللازمة."],
      en:["VOLUNTEER FACULTY · NABD GLOBAL FACULTY","One lecture can matter.","Share what you know.","Apply to volunteer educational expertise. Applications are reviewed before any collaboration or lecture is confirmed.",["Volunteer teaching","Students in Gaza","Knowledge sharing"],"Join the teaching initiative","An expression of interest, not a confirmed faculty appointment or partnership.","Explore volunteer application →","No lecturer is listed or scheduled without consent and approval."]},
    "admin.html":{theme:"administration",icon:"♛",image:"founder.jpg",focus:"#login",move:"#login",
      ar:["الإدارة العامة · NABD ADMINISTRATION","قيادة تستند إلى البيانات.","ومسؤولية يصنعها القرار.","مركز العمل الإداري للمتابعة الأكاديمية والخدمات الطلابية والتحقق من السجلات، مخصص للحسابات الإدارية المخوّلة.",["حوكمة","متابعة الأداء","سجلات موثّقة"],"دخول الإدارة","صلاحيات الإدارة لا تُمنح بواسطة تصميم الواجهة؛ يتطلب الوصول حسابًا مصرحًا له.","فتح تسجيل الدخول ←","المنصة للإدارة المخوّلة فقط؛ حماية السجلات تتم عبر المصادقة وسياسات الوصول."],
      en:["NABD GENERAL ADMINISTRATION","Lead with insight.","Act with accountability.","Academic and student-services administration, follow-up and record review for authorised administrative accounts.",["Governance","Operations","Verified records"],"Admin sign-in","Access requires an authorised account; viewing this page provides no administrative privileges.","Open administrator sign-in →","Actual record security depends on authentication and access-control policies."]},
    "nabd-ai-executive.html":{theme:"administration",icon:"✦",image:"biochemistry.jpg",focus:"#authPanel",move:"#authPanel",
      ar:["العمليات الذكية · NABD EXECUTIVE AI","حوكمة أوضح.","وقرارات أكثر تنظيمًا.","منصة داخلية لتنسيق العمل الإداري وتحليل المتابعة وفق القواعد المعتمدة، مع بقاء القرار البشري والمراجعة المؤسسية أساس العمل.",["متابعة داخلية","تحليل منظم","مراجعة بشرية"],"وصول الإدارة الذكية","تتطلب الجلسة صلاحية إدارية؛ أدوات التحليل لا تستبدل القرار البشري.","فتح مركز العمليات ←","هذا النظام لا يمنح امتيازات من دون مصادقة وصلاحيات."],
      en:["SMART OPERATIONS · NABD EXECUTIVE AI","Clarity for oversight.","Structure for decisions.","An internal workspace for operational follow-up and rule-based decision support, with human review at its core.",["Internal follow-up","Structured analysis","Human oversight"],"Secure operations access","An administrative account is required; analytics do not replace accountable human judgement.","Open operations centre →","All privileges remain subject to actual authentication and permissions."]},
    "university-os.html":{theme:"academic",icon:"▣",image:"anatomy.jpg",focus:"#osGate",
      ar:["النظام الأكاديمي · NABD UNIVERSITY OS","من المقرر إلى الإنجاز.","رحلة أكاديمية مترابطة.","منصة تنظم المساقات والمحاضرات والاختبارات والمتابعة وفق أدوار الطالب والمحاضر والإدارة والصلاحيات المخصصة لكل حساب.",["مقررات","تقييمات","متابعة أكاديمية"],"حسابك الأكاديمي","استخدم حساب نبض المعتمد للوصول إلى الخدمات المسموح بها فقط.","الانتقال إلى دخول النظام ←","الظهور في النظام لا يعني صلاحية الوصول إلى السجلات المحمية."],
      en:["ACADEMIC SYSTEM · NABD UNIVERSITY OS","From course to milestone.","A connected academic journey.","A workspace connecting courses, lectures, assessments and follow-up according to each account's assigned role.",["Courses","Assessments","Academic progress"],"Academic account","Use your existing NABD account to access only your authorised services.","Go to system sign-in →","Protected records require validated access permissions."]},
    "executive-application.html":{theme:"executive",icon:"◇",image:"founder.jpg",focus:"#applicationForm",
      ar:["الترشح القيادي · NABD LEADERSHIP","قيادة تبدأ بالمبادرة.","وتكتمل بالمسؤولية.","نافذة الترشح للعمل المؤسسي والمشاركة في تطوير الأكاديمية، مع مراجعة واضحة للطلبات قبل أي قرار عضوية.",["انضمام مسؤول","مراجعة طلبات","معايير معلنة"],"طلب الانضمام للمجلس","قدّم بياناتك بدقة. تقديم الطلب لا يعني القبول التلقائي أو منح صلاحية.","ابدأ طلب الترشح ←","الاختيار مشروط بالمراجعة والاحتياجات والقرار الإداري."],
      en:["LEADERSHIP APPLICATION · NABD","Leadership begins with initiative.","And grows through responsibility.","Apply to contribute to the academy's leadership and development. Every application is reviewed before membership decisions.",["Responsible service","Application review","Clear criteria"],"Executive Council application","Provide accurate information. Submission does not grant membership or system access.","Start your application →","Selection is subject to review and formal decision."]},
    "application-status.html":{theme:"council",icon:"◎",image:"medical-terminology.jpg",focus:"#app",
      ar:["متابعة الطلب · NABD APPLICATION STATUS","طلبك تحت المتابعة.","وكل خطوة موثقة.","مساحة لمراجعة حالة طلب الترشح ومعرفة تحديثاته عبر وسيلة التحقق المخصصة.",["حالة الطلب","تحديثات","خصوصية"],"متابعة طلبك","انتقل إلى أداة التحقق من حالة الطلب واتبع الإرشادات الظاهرة.","افتح متابعة الطلب ←","لا تنشر أرقام الطلبات أو بياناتك الشخصية علنًا."],
      en:["APPLICATION STATUS · NABD","Follow your application.","With clarity at every step.","Review your leadership application status and updates through the designated verification workflow.",["Status","Updates","Privacy"],"Check application status","Continue to the application tracking tool and follow the on-screen instructions.","Open status tracker →","Keep your application reference and personal details private."]},
    "nabd-connect.html":{theme:"communications",icon:"✉",image:"hero-medical.jpg",focus:"#nc-app",
      ar:["المراسلات · NABD CONNECT","حوار يصنع تواصلًا.","ومتابعة لا تضيع.","مساحة للمراسلات الأكاديمية والطلبات الخاصة، حيث تتابع رسائلك واستجابات الفريق من خلال حسابك.",["رسائل خاصة","تذاكر متابعة","تنظيم التواصل"],"تواصل مع الأكاديمية","تأكد من تسجيل الدخول قبل إنشاء تذكرة أو متابعة مراسلاتك.","افتح المراسلات ←","لا تُرسل معلومات مرضى أو كلمات مرور عبر الرسائل."],
      en:["COMMUNICATIONS · NABD CONNECT","Conversations that connect.","Follow-up that matters.","A private messaging workspace to submit requests and follow updates with the academy through your account.",["Private messages","Support tickets","Organised follow-up"],"Connect with NABD","Sign in before creating a request or checking your private conversations.","Open messages →","Do not share patient information or passwords."]},
    "nabd-campus.html":{theme:"campus",icon:"⌘",image:"anatomy.jpg",focus:"#main",
      ar:["الحرم الرقمي · NABD CAMPUS","تعلمك في مكان واحد.","وخياراتك بلا تشتت.","مساحة تجمع التعلم والمصادر والمسارات والمحاضرات الدولية وفق ما هو متاح لحسابك وخدمات الأكاديمية.",["تعلم رقمي","مسارات أكاديمية","خدمات الطالب"],"ادخل الحرم الرقمي","ابدأ من البوابات التعليمية واكتشف المسارات والخدمات المتاحة.","استكشف الحرم ←","قد تتطلب بعض الأدوات تسجيل الدخول أو صلاحيات خاصة."],
      en:["DIGITAL CAMPUS · NABD CAMPUS","One campus.","A clearer path to learning.","An organised home for learning resources, pathways and global lectures, subject to your account's access.",["Digital learning","Pathways","Student services"],"Enter the digital campus","Discover academic services and pathways available to you.","Explore campus →","Some tools require sign-in and assigned permissions."]},
    "campus.html":{theme:"campus",icon:"⌘",image:"physiology.jpg",focus:"#main",
      ar:["بوابة الحرم · NABD CAMPUS","ابدأ من المكان الصحيح.","وتقدّم بثقة.","بوابة خفيفة للتنقل بين خدمات الأكاديمية ومساراتها دون الحاجة إلى المرور على أقسام متشعبة.",["وصول سريع","تصفح مبسط","كل المسارات"],"اختر وجهتك الأكاديمية","انتقل إلى المسار أو الخدمة التي تناسب هدفك التعليمي.","استكشف البوابات ←","تتطلب بعض الخدمات حسابًا موثّقًا."],
      en:["CAMPUS GATEWAY · NABD","The right starting point.","A clearer route forward.","A lightweight way to discover NABD pathways and academic services without navigating a long list of sections.",["Fast access","Simple navigation","Learning routes"],"Choose your destination","Explore the learning pathway or service that matches your goals.","Explore gateways →","Some services require an authenticated account."]},
    "nabd-university-360.html":{theme:"academic",icon:"◉",image:"anatomy.jpg",focus:"#n360-main",
      ar:["الحرم الجامعي · NABD 360","معرفة مترابطة.","وتجربة تستجيب لك.","بيئة أكاديمية تجمع الدراسة والمساندة والمراسلات والمهام المرتبطة بحساب الطالب ضمن منظومة واحدة.",["دراسة","دعم أكاديمي","متابعة"],"عالمك الدراسي 360","ابدأ من مساحة الطالب ولا تدخل بياناتك خارج أدوات الأكاديمية الرسمية.","افتح بوابة 360 ←","خصوصية بيانات الطالب وصلاحياته محفوظة في الأدوات المعتمدة."],
      en:["UNIVERSITY 360 · NABD","Connected knowledge.","Your academic journey.","A connected academic experience spanning study, support, messages and account-specific tasks.",["Study","Academic support","Follow-up"],"Your 360 learning journey","Start in the student space using the academy's authorised tools.","Open University 360 →","Account-specific records remain subject to access permissions."]},
    "nabd-one.html":{theme:"innovation",icon:"✳",image:"physiology.jpg",focus:"#main",
      ar:["المنظومة الموحدة · NABD ONE","كل خدماتك مترابطة.","في تجربة واحدة.","بوابة تصل بين التعلم المباشر والمقررات والمساعد التعليمي والمراسلات في مساحة تعليمية موحدة.",["مقررات","محاضرات","مراسلات"],"الدخول إلى نبض ONE","استكشف الأدوات المتاحة، وسجّل الدخول عند الحاجة للخدمات الخاصة.","استكشف المنظومة ←","قد تختلف إمكانية استخدام الأدوات وفق حالة التشغيل والصلاحيات."],
      en:["CONNECTED ACADEMY · NABD ONE","One connected learning.","One seamless journey.","A unified route to courses, learning assistance, live sessions and messaging across the academy.",["Courses","Live learning","Messages"],"Open NABD ONE","Discover available tools and sign in when private services require it.","Explore NABD ONE →","Availability depends on the service status and permissions."]},
    "nabd-global-research.html":{theme:"research",icon:"⌬",image:"biochemistry.jpg",focus:"#main",
      ar:["البحث العلمي · NABD GLOBAL RESEARCH","فكرة اليوم.","قد تصبح بحث الغد.","شبكة قيد التطوير لدعم الثقافة البحثية والإرشاد والمنهجية العلمية والتعاون الأكاديمي، من غزة نحو العالم.",["منهجية البحث","إرشاد علمي","تعاون دولي"],"استكشف البحث العلمي","ابدأ بفرص التعلم البحثي والبرامج المقترحة، وتابع ما يُعتمد منها.","ادخل بوابة البحث ←","الشراكات والمشاريع المقترحة ليست موافقات بحثية أو اتفاقيات موقعة."],
      en:["RESEARCH GATEWAY · NABD GLOBAL","Today's curiosity.","Tomorrow's research.","A developing network for research literacy, mentorship, scientific methods and academic collaboration from Gaza to the world.",["Scientific method","Mentorship","Collaboration"],"Explore the research network","Discover proposed learning routes and research opportunities.","Enter research gateway →","Proposed projects and partnerships are not confirmed research approvals or signed agreements."]},
    "research-office.html":{theme:"researchoffice",icon:"▤",image:"biochemistry.jpg",focus:"#loginArea",
      ar:["مكتب الأبحاث · NABD RESEARCH OFFICE","الدقة في المتابعة.","والسرية في التفاصيل.","مكتب مخصص للإدارة المخوّلة لتوثيق التواصل مع الجامعات والجهات البحثية وتتبع الملفات بسرية.",["توثيق","مؤسسات","وصول مقيّد"],"دخول مكتب البحث","تسجيل الدخول مخصص للحسابات الإدارية المعتمدة فقط.","الانتقال إلى دخول المكتب ←","سجلات الشركاء والمراسلات بيانات داخلية غير مخصصة للنشر."],
      en:["RESEARCH OFFICE · NABD","Precision in follow-up.","Confidentiality by design.","An internal office to track institutional contacts and research files for authorised administrators.",["Documentation","Institutions","Restricted access"],"Research-office sign-in","Only approved administrative accounts can access the records.","Go to office sign-in →","Institutional correspondence is private and must not be published."]},
    "research-starter-lab.html":{theme:"research",icon:"◈",image:"biochemistry.jpg",focus:"#main",
      ar:["مختبر الباحث · NABD RESEARCH LAB","كل اكتشاف يبدأ.","بسؤال جيد.","أدوات مبسطة تساعد المتعلم على تنظيم سؤال بحثي وخطة عمل أولية، مع التأكيد على المعايير العلمية وأخلاقيات البحث.",["سؤال بحثي","خطة منهجية","مراجعة علمية"],"ابدأ مشروعك البحثي","انتقل إلى المختبر وصمّم مسودة فكرة قابلة للنقاش والتطوير.","افتح المختبر ←","الخطط التعليمية ليست موافقة أخلاقية أو مراجعة علمية رسمية."],
      en:["RESEARCH STARTER LAB · NABD","Every discovery starts.","With a better question.","Learning tools for drafting research questions and early plans with scientific care and ethical awareness.",["Research question","Methodology","Review"],"Start your research project","Draft a research idea to refine and discuss.","Open research lab →","Educational drafts are not formal scientific or ethics approvals."]},
    "nabd-partners.html":{theme:"partnerships",icon:"◇",image:"hero-medical.jpg",focus:"#main",
      ar:["الشراكات والأثر · NABD GLOBAL IMPACT","معًا نوسّع الفرص.","ونجعل المعرفة أقرب.","مساحة للتعاون الأكاديمي والدعم التعليمي وتطوير المبادرات، تعرض فرص الشراكة المقترحة وما تحقق منها بشفافية.",["شراكات","تمكين تعليمي","أثر مجتمعي"],"شارك في صناعة الأثر","تعرّف إلى البرامج وفرص التعاون وآليات التواصل مع الأكاديمية.","استكشف الشراكات ←","الشراكات قيد النقاش لا تُعرض بوصفها اتفاقيات مؤكدة."],
      en:["PARTNERSHIPS · NABD GLOBAL IMPACT","Stronger together.","Knowledge within reach.","A collaboration space for educational support and academic initiatives, clearly distinguishing proposals from confirmed arrangements.",["Partnerships","Educational access","Community impact"],"Collaborate with NABD","Explore opportunities to partner or support academic initiatives.","Explore partnerships →","Ongoing discussions do not imply confirmed institutional agreements."]},
    "academy.html":{theme:"academic",icon:"✦",image:"medical-terminology.jpg",focus:"#main",
      ar:["المسارات التعليمية · NABD ACADEMY","لكل طموح طريق.","ولكل طالب بداية.","دليل موحد للمسارات والدورات وفرص الاستكشاف داخل الأكاديمية؛ اختر بوابتك حسب هدفك.",["تعلم","بحث","خدمات"],"اكتشف مسارك","ابدأ من دليل البرامج والخدمات المصممة لاهتمامات الطلاب والمحاضرين.","تصفح المسارات ←","يمكن استكشاف المحتوى العام دون تسجيل، بينما تتطلب بعض المزايا حسابًا."],
      en:["ACADEMIC PATHWAYS · NABD","A path for every ambition.","A start for every learner.","A unified directory of pathways, courses and experiences. Choose the route that fits your goals.",["Learning","Research","Services"],"Discover your pathway","Start with the program and service directory for students and educators.","Explore pathways →","Public content is open; some services require an account."]},
    "global-lectures.html":{theme:"faculty",icon:"◎",image:"physiology.jpg",focus:"#main",
      ar:["برنامج المحاضرات الدولية · NABD GLOBAL","من غزة إلى خبرات العالم.","تعليم يتجاوز الحدود.","برنامج قيد الإعداد لإتاحة محاضرات علمية تطوعية مع متخصصين، ويُنشر كل لقاء بعد تثبيت الموعد وموافقة المحاضر.",["خبرات علمية","لقاءات تعليمية","مشاركة دولية"],"اكتشف برنامج المحاضرات","تابع الموضوعات المقترحة والمواعيد المؤكدة عند إعلانها.","استكشف المحاضرات ←","لا تُعد المحاضرة مؤكدة قبل موافقة المحاضر وإعلان الموعد الرسمي."],
      en:["GLOBAL LECTURES · NABD","From Gaza to the world.","Learning across borders.","A developing volunteer lecture programme with specialists. Sessions are published after speaker consent and confirmation.",["Expertise","Educational talks","Global exchange"],"Explore global lectures","Browse proposed topics and confirmed sessions when announced.","Explore lectures →","Proposed talks are not confirmed bookings or partnerships."]},
    "medical-consultations.html":{theme:"consultations",icon:"✚",image:"pathology.jpg",focus:"#main",
      ar:["الاستشارات الطبية · NABD CARE","المعرفة الطبية بدقة.","والمسؤولية أولًا.","مبادرة قيد التحضير للإرشاد الصحي والمعلومات الطبية التعليمية، مع توضيح حدود الخدمة وعدم تقديم بديل عن الرعاية العاجلة.",["إرشاد صحي","معلومات موثوقة","خصوصية"],"استكشف الخدمة المقترحة","اطلع على التخصصات ومراحل الإعداد، ولا ترسل معلومات صحية حساسة قبل فتح قنوات آمنة.","تعرف إلى الخدمة ←","الخدمة قيد الإعداد؛ ليست بديلًا للطوارئ أو تشخيص طبي مباشر."],
      en:["MEDICAL GUIDANCE · NABD CARE","Medical knowledge with care.","Responsibility comes first.","A proposed health guidance service in preparation, focused on information and clear boundaries rather than emergency care.",["Health education","Reliable guidance","Privacy"],"Explore the planned service","Read about potential specialties and preparation status. Do not share sensitive medical data through unsecured channels.","Learn about the service →","Not an active emergency, diagnostic or medical treatment service."]},
    "learning/index.html":{theme:"student",icon:"📖",image:"anatomy.jpg",focus:"#main",home:"../index.html",
      ar:["عالم الطالب · NABD LEARNING","تعلم على طريقتك.","وتقدم بثقة.","مساحة للتعلم والمراجعة والوصول إلى الأدوات الأكاديمية الرقمية وفق توفر المحتوى والصلاحيات.",["مساقات","مراجعة","تقدم ذاتي"],"ادخل عالم التعلم","اكتشف مصادر التعلم المتاحة للمسجّلين والزوار.","استكشف عالم الطالب ←","تتطلب بعض الخدمات التعليمية حسابًا."],
      en:["LEARNING UNIVERSE · NABD","Learn your way.","Keep moving forward.","A learner-centred environment for courses, revision and digital academic tools, subject to available content and permissions.",["Courses","Revision","Progress"],"Enter the learning universe","Discover learning resources for visitors and registered students.","Explore learning →","Some academic services require an account."]},
    "nabd-v10.html":{theme:"innovation",icon:"✳",image:"anatomy.jpg",focus:"#main",
      ar:["عالم نبض الطبي · V10","التشريح أكثر وضوحًا.","والمعرفة أكثر تفاعلًا.","استكشف مسارات تعليمية في الأجهزة والوظائف الطبية من خلال أدوات ومعارف رقمية متطورة.",["أجهزة الجسم","تعليم تفاعلي","أطلس طبي"],"ابدأ الاستكشاف","انتقل إلى المحتوى العلمي المتاح في النسخة التعليمية.","ادخل عالم V10 ←","الأدوات التعليمية لا تعادل تشخيصًا أو تدريبًا سريريًا معتمدًا."],
      en:["MEDICAL UNIVERSE · V10","Anatomy made clearer.","Learning made interactive.","Explore body systems and medical learning pathways through accessible digital content.",["Body systems","Interactive learning","Medical atlas"],"Start exploring","Access the available learning experience.","Enter V10 →","Educational tools do not replace clinical certification or diagnosis."]},
    "nabd-2050.html":{theme:"innovation",icon:"✧",image:"hero-medical.jpg",focus:"#main",
      ar:["مختبر المستقبل · NABD 2050","الخيال مدخل المعرفة.","والابتكار طريقها.","تجارب تعليمية تجريبية تستكشف مستقبل التعلم الطبي والمحاكاة، مع التمييز بين المشاريع المخططة والأدوات المتاحة.",["استكشاف","محاكاة","ابتكار"],"اكتشف مختبر المستقبل","اطلع على التجارب والمفاهيم التعليمية المقترحة.","استكشف 2050 ←","المشاريع المستقبلية لا تعني أنها خدمات مكتملة أو معتمدة."],
      en:["FUTURE LAB · NABD 2050","Imagine what learning can become.","Explore what is possible.","Experimental educational experiences exploring future medical learning and simulation, distinguishing concepts from available tools.",["Exploration","Simulation","Innovation"],"Explore the Future Lab","Browse experimental learning ideas and available experiences.","Explore 2050 →","Concepts are not claims of finished or accredited services."]},
    "nabd-hope.html":{theme:"scholarship",icon:"♥",image:"hero-medical.jpg",focus:"#give",
      ar:["منحة نبض الأمل · NABD HOPE","مئة فرصة للتعلم.","ومستقبل لا يتوقف.","مبادرة تسعى لدعم 100 طالب وطالبة من محافظات غزة، عبر الرسوم والمواصلات والأجهزة والمستلزمات الدراسية بحسب التبرعات المتاحة.",["هدف: 100 طالب","جميع محافظات غزة","شفافية"],"دعم يفتح باب التعليم","استكشف معايير الدعم ومعلومات المساهمة المتاحة في صفحة المبادرة.","تعرّف على المبادرة ←","100 هدف مقترح، وليس منحًا ممولة أو مؤكدة. راجع بيانات المستلم قبل أي تحويل."],
      en:["NABD HOPE SCHOLARSHIP","One hundred opportunities.","A future worth protecting.","A proposed initiative supporting 100 students across Gaza with tuition, transport, devices and learning essentials, subject to resources.",["100-student goal","All Gaza","Transparency"],"Support access to education","Read about eligibility and support information on the initiative page.","Explore the initiative →","100 is a proposed target, not funded awards. Verify the recipient before any transfer."]}
  };

  const path=decodeURIComponent(location.pathname).replace(/\/+/g,"/");
  let key=path.endsWith("/portal/")?"portal/index.html":
    path.endsWith("/learning/")?"learning/index.html":
    Object.keys(C).find(k=>path.endsWith("/"+k));
  if(!key||!C[key]||document.querySelector(".nabd-gate"))return;
  const cfg=C[key], root=document.createElement("section");
  root.className="nabd-gate nabd-gate--"+cfg.theme;
  root.setAttribute("aria-label","NABD Academy · "+(cfg.en[0]||"Gateway"));
  root.setAttribute("lang","ar");root.setAttribute("dir","rtl");
  const inner=document.createElement("div");inner.className="ng-inner";
  const copy=document.createElement("div");copy.className="ng-copy";
  const eye=document.createElement("span");eye.className="ng-eyebrow";
  const title=document.createElement("h2"),lead=document.createElement("p");lead.className="ng-lead";
  title.id="ng-title-"+cfg.theme.replace(/[^a-z]/g,"");
  root.setAttribute("aria-labelledby",title.id);
  const line1=document.createElement("span"),line2=document.createElement("strong");
  title.append(line1,line2);
  const features=document.createElement("div");features.className="ng-points";
  const points=Array.from({length:3},()=>{const p=document.createElement("span");features.append(p);return p});
  const actions=document.createElement("div");actions.className="ng-actions";
  const langBtn=document.createElement("button");langBtn.type="button";langBtn.className="ng-language";langBtn.setAttribute("aria-label","Language / اللغة");
  const back=document.createElement("a");back.className="ng-outline";back.href=cfg.home||sharedBack;
  back.textContent="← الأكاديمية";
  actions.append(back,langBtn);
  copy.append(eye,title,lead,features,actions);
  const access=document.createElement("aside");access.className="ng-access";
  const symbol=document.createElement("span");symbol.className="ng-access-icon";symbol.setAttribute("aria-hidden","true");symbol.textContent=cfg.icon;
  const cardTitle=document.createElement("h3"),cardDesc=document.createElement("p");
  access.append(symbol,cardTitle,cardDesc);
  const destination=cfg.focus||"#ng-content";
  let target=document.querySelector(destination);
  let moved=false;
  if(cfg.move&&target&&target.matches(cfg.move)){
    const slot=document.createElement("div");slot.className="ng-original-slot";
    slot.appendChild(target);
    access.appendChild(slot);
    moved=true;
  }else{
    const go=document.createElement("a");go.className="ng-access-link";go.href=destination;
    go.dataset.ngCta="1";access.appendChild(go);
  }
  const small=document.createElement("small");access.appendChild(small);
  const art=document.createElement("div");art.className="ng-art";
  const img=document.createElement("img");img.src=(key.includes("/")?"../":"")+"assets/images/"+cfg.image;img.alt="";img.loading="lazy";img.width=76;img.height=60;
  const caption=document.createElement("span");caption.textContent="NABD ACADEMY · EDUCATION WITH PURPOSE";
  art.append(img,caption);copy.append(art);
  inner.append(copy,access);root.append(inner);
  const header=document.querySelector("body > header, body > nav");
  const main=document.querySelector("main");
  if(header)header.after(root);
  else if(main)main.before(root);
  else document.body.prepend(root);
  if(!moved&&!target){
    const fallback=main||document.getElementById("app")||document.body.lastElementChild;
    if(fallback){fallback.id=fallback.id||"ng-content";access.querySelector("[data-ng-cta]").href="#"+fallback.id;}
  }
  const content=cfg;
  function update(lang){
    root.lang=lang;root.dir=lang==="ar"?"rtl":"ltr";const values=content[lang];
    eye.textContent=values[0];line1.textContent=values[1];line2.textContent=values[2];lead.textContent=values[3];
    points.forEach((p,i)=>p.textContent=values[4][i]||"");
    cardTitle.textContent=values[5];cardDesc.textContent=values[6];small.textContent=values[8];
    if(!moved){const go=access.querySelector("[data-ng-cta]");if(go)go.textContent=values[7];}
    back.textContent=lang==="ar"?"← الصفحة الرئيسية":"← Academy Home";
    langBtn.textContent=lang==="ar"?"🌐 English":"🌐 العربية";
    langBtn.setAttribute("aria-label",lang==="ar"?"Switch the gateway introduction to English":"اعرض مقدمة البوابة بالعربية");
  }
  let active="ar";
  try {const saved=localStorage.getItem("nabdGatewayLanguage");if(saved==="en"||saved==="ar")active=saved;else if(document.documentElement.lang==="en")active="en";}catch(_){}
  update(active);
  langBtn.addEventListener("click",function(){active=active==="ar"?"en":"ar";update(active);try{localStorage.setItem("nabdGatewayLanguage",active)}catch(_){}});
})();
