/* NABD fixed participation certificate — institutional edition v2.
   Director dashboard: single recipient-name input; A4 landscape printing.
   Existing verified certificate issuance remains unchanged. */
(function() {
  'use strict';
  const ID = 'fixed-cert-studio';
  const STYLE_ID = 'nabd-fixed-certificate-premium';
  const MARKUP = "\n<div class=\"nc-ui\" dir=\"rtl\" lang=\"ar\">\n  <div class=\"nc-heading\">\n    <div><span class=\"nc-kicker\">NABD ACADEMY • CERTIFICATE STUDIO</span><h2>إصدار الشهادات المؤسسية</h2>\n      <p>هوية واحدة ثابتة: الشعار، النص، الأبعاد، والألوان. فقط اكتب اسم الطالب واطبع.</p></div>\n    <span class=\"nc-tag\">INSTITUTIONAL EDITION • A4 LANDSCAPE</span>\n  </div>\n  <div class=\"nc-controls\">\n    <div class=\"nc-field\"><label for=\"nc-student-name\">اسم الطالب على الشهادة</label>\n      <input id=\"nc-student-name\" class=\"input\" dir=\"auto\" type=\"text\" maxlength=\"100\" autocomplete=\"off\" placeholder=\"اكتب الاسم بالعربية أو الإنجليزية\" aria-describedby=\"nc-privacy\">\n      <small id=\"nc-privacy\">راجع الاسم بعناية. لا يُحفظ الاسم ولا يُرسل إلى أي خادم.</small></div>\n    <div class=\"nc-buttons\"><button class=\"btn\" id=\"nc-print\" type=\"button\" disabled>طباعة / حفظ بصيغة PDF</button>\n      <button class=\"btn secondary\" id=\"nc-clear\" type=\"button\">مسح الاسم</button></div>\n  </div>\n  <p class=\"nc-feedback\" id=\"nc-feedback\" role=\"status\" aria-live=\"polite\">أدخل اسم الطالب أولًا.</p>\n  <div class=\"nc-sheet-wrap\">\n    <article class=\"nc-sheet\" id=\"nabd-cert-sheet\" aria-label=\"معاينة شهادة مشاركة أكاديمية نبض للعلوم الطبية\">\n      <div class=\"nc-accent-edge\"></div><div class=\"nc-top-rule\"></div><div class=\"nc-frame\"></div>\n      <div class=\"nc-corner nc-corner-a\"></div><div class=\"nc-corner nc-corner-b\"></div><div class=\"nc-corner nc-corner-c\"></div><div class=\"nc-corner nc-corner-d\"></div>\n      <div class=\"nc-watermark\" aria-hidden=\"true\"></div>\n      <div class=\"nc-brand-lockup\"><div class=\"nc-logo-box\" aria-hidden=\"true\">\n        <span class=\"nc-logo-letter\">N</span><span class=\"nc-logo-star\">✦</span></div>\n        <div class=\"nc-brand-copy\"><div class=\"nc-brand-ar\">أكاديمية نبض للعلوم الطبية</div>\n          <div class=\"nc-brand-en\" lang=\"en\">NABD ACADEMY OF MEDICAL SCIENCES</div>\n          <div class=\"nc-brand-place\" lang=\"en\">GAZA • PALESTINE · EST. 2023</div></div></div>\n      <div class=\"nc-header-divider\"></div>\n      <div class=\"nc-overline\" dir=\"ltr\">NABD ACADEMY</div>\n      <div class=\"nc-title\">شهادة مشاركة</div>\n      <div class=\"nc-title-en\" dir=\"ltr\">CERTIFICATE OF PARTICIPATION</div>\n      <div class=\"nc-recipient\">تُمنح هذه الشهادة إلى</div>\n      <div class=\"nc-name-wrap\"><span class=\"nc-name\" id=\"nc-preview-name\" dir=\"auto\">اسم الطالب / Student Name</span></div>\n      <div class=\"nc-name-pips\"></div>\n      <div class=\"nc-desc-ar\">تقديرًا لمشاركته/مشاركتها في الأنشطة التعليمية والعلمية للأكاديمية</div>\n      <div class=\"nc-desc-en\" dir=\"ltr\" lang=\"en\">In recognition of participation in the Academy’s educational and scientific activities.</div>\n      <div class=\"nc-footer-rule\"></div>\n      <div class=\"nc-footer\">\n        <div class=\"nc-footer-unit\" dir=\"rtl\"><div class=\"nc-signature-line\"></div><span>التوقيع المعتمد</span><small>Authorized Signature</small></div>\n        <div class=\"nc-slogan\" dir=\"ltr\"><div class=\"nc-slogan-mark\">✦</div>\n          <strong>FROM GAZA TO THE WORLD</strong><span>Because Knowledge Should Have No Borders</span></div>\n        <div class=\"nc-footer-unit\" dir=\"rtl\"><strong>محمد خالد العرجا</strong><span>المؤسس والمدير العام</span>\n          <small>Founder &amp; General Director</small></div>\n      </div>\n      <div id=\"nc-placeholder\" class=\"nc-placeholder\">نموذج معاينة</div>\n    </article>\n  </div>\n  <p class=\"nc-advisory\">هذه نسخة مشاركة للطباعة، وليست إثباتًا تلقائيًا لإكمال مقرر أو شهادة موثّقة. لا تُنشئ رقمًا أو رمز تحقق أو سجل إصدار. يجب التحقق من أهلية المستفيد واعتماد الوثيقة وتوقيعها قبل تسليمها.</p>\n</div>";
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const el=document.createElement('link');
    el.id=STYLE_ID; el.rel='stylesheet';
    el.href='assets/css/nabd-fixed-certificate-premium.css?v=2';
    document.head.appendChild(el);
  }
  function clean(raw){
    return String(raw||'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim();
  }
  function render(panel,context){
    if(!context||!context.user){panel.textContent='يرجى تسجيل الدخول بحساب مدير الأكاديمية.';return;}
    ensureStyle();
    if(panel.querySelector('.nc-ui'))return;
    panel.innerHTML=MARKUP;
    const input=panel.querySelector('#nc-student-name'), name=panel.querySelector('#nc-preview-name');
    const wrap=panel.querySelector('.nc-name-wrap'),print=panel.querySelector('#nc-print');
    const sample=panel.querySelector('#nc-placeholder'),message=panel.querySelector('#nc-feedback');
    function fit(){
      if(!wrap.clientWidth)return true;
      let size=4.35;
      name.style.fontSize=size+'cqw';
      const limit=wrap.clientWidth*.94;
      while(size>1.8 && name.scrollWidth>limit){
        size=+(size-.12).toFixed(2);
        name.style.fontSize=size+'cqw';
      }
      return name.scrollWidth<=limit;
    }
    function update(){
      const value=clean(input.value), valid=value.length>=2&&value.length<=100;
      name.textContent=valid?value:'اسم الطالب / Student Name';
      name.dir='auto';
      sample.hidden=valid;
      const fits=fit();
      print.disabled=!valid||!fits;
      message.textContent=!valid?'اكتب الاسم الذي سيظهر على الشهادة.':
        !fits?'الاسم طويل على مساحة الشهادة. يرجى استخدام الاسم الرسمي دون إضافات.':
        'المعاينة جاهزة. راجع صحة الاسم ثم اطبع على ورق A4 أفقي.';
    }
    input.addEventListener('input',update);
    panel.querySelector('#nc-clear').addEventListener('click',function(){input.value='';update();input.focus();});
    print.addEventListener('click',function(){update();if(!print.disabled)window.print();});
    window.addEventListener('beforeprint',fit);
    update();
  }
  if(typeof window.NABD_ADMIN_REGISTER_MODULE==='function')
    window.NABD_ADMIN_REGISTER_MODULE({id:ID,title:'✦ إصدار شهادات ثابتة',render:render});
})();