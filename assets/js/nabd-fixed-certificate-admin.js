/* NABD fixed-name certificate studio (director-only UI).
   Print-ready participation template. No database issuance, no verification QR.
   The existing verified-certificates workflow remains unchanged. */
(function () {
  'use strict';
  const ID = 'fixed-cert-studio';
  const STYLE_ID = 'nabd-fixed-cert-style';
  const html = [
    '<div class="nc-ui" dir="rtl" lang="ar">',
      '<div class="nc-heading">',
        '<div><span class="nc-kicker">NABD ACADEMY • CERTIFICATE STUDIO • EDITION 01</span>',
        '<h2>استوديو الشهادات الثابتة</h2>',
        '<p>تصميم رسمي واحد لا يتغير. أدخل اسم الطالب فقط، ثم عاين الشهادة واطبعها أو احفظها PDF.</p></div>',
        '<span class="nc-tag">قالب ثابت • A4 أفقي</span>',
      '</div>',
      '<div class="nc-controls">',
        '<div class="nc-field"><label for="nc-student-name">اسم الطالب كما يجب أن يظهر على الشهادة</label>',
          '<input class="input" id="nc-student-name" type="text" dir="auto" maxlength="100" autocomplete="off" placeholder="مثال: محمد أحمد محمود / Mohammed Ahmad" aria-describedby="nc-privacy">',
          '<small id="nc-privacy">لا يُرسل الاسم إلى الخادم، ولا يُحفظ تلقائيًا. تأكد من صحة الكتابة قبل الطباعة.</small>',
        '</div>',
        '<div class="nc-buttons"><button class="btn" id="nc-print" type="button" disabled>🖨 طباعة / حفظ PDF</button>',
          '<button class="btn secondary" id="nc-clear" type="button">تفريغ الاسم</button></div>',
      '</div>',
      '<p class="nc-feedback" id="nc-feedback" role="status" aria-live="polite">اكتب اسم الطالب لتفعيل الطباعة.</p>',
      '<div class="nc-sheet-wrap">',
        '<div id="nabd-cert-sheet" class="nc-sheet" role="img" aria-label="معاينة شهادة مشاركة أكاديمية نبض للعلوم الطبية">',
          '<div class="nc-frame-outer"></div><div class="nc-frame-inner"></div>',
          '<div class="nc-corner nc-corner-tl"></div><div class="nc-corner nc-corner-tr"></div>',
          '<div class="nc-corner nc-corner-bl"></div><div class="nc-corner nc-corner-br"></div>',
          '<div class="nc-emblem"><div class="nc-seal-letter">N</div><div class="nc-seal-line"></div><div class="nc-seal-small">NABD</div></div>',
          '<div class="nc-brand-ar">أكاديمية نبض للعلوم الطبية</div>',
          '<div class="nc-brand-en" dir="ltr">NABD ACADEMY OF MEDICAL SCIENCES</div>',
          '<div class="nc-rule"></div>',
          '<div class="nc-title-ar">شهادة مشاركة</div>',
          '<div class="nc-title-en" dir="ltr">CERTIFICATE OF PARTICIPATION</div>',
          '<div class="nc-description">تُمنح هذه الشهادة تقديرًا لمشاركة</div>',
          '<div class="nc-name-row"><span id="nc-preview-name" class="nc-name" dir="auto">اسم الطالب / Student Name</span></div>',
          '<div class="nc-description nc-after">في الأنشطة العلمية والتعليمية التي تقدمها الأكاديمية،',
          '<span class="nc-second-line">وتشجيعًا لطلب العلم والتطوير المستمر.</span></div>',
          '<div class="nc-english" dir="ltr">In recognition of participation in the Academy’s educational and scientific activities.</div>',
          '<div class="nc-footer">',
            '<div class="nc-footer-block nc-footer-left"><div class="nc-sig-line"></div>',
              '<span>توقيع المدير العام</span><small>General Director’s Signature</small></div>',
            '<div class="nc-footer-middle"><div class="nc-gold-icon">✦</div><b>FROM GAZA TO THE WORLD</b>',
              '<span>Because Knowledge Should Have No Borders</span></div>',
            '<div class="nc-footer-block nc-footer-right"><b>محمد خالد العرجا</b>',
              '<span>المؤسس والمدير العام</span><small>Founder & General Director</small></div>',
          '</div>',
          '<div id="nc-sample" class="nc-sample">نموذج للمعاينة — أدخل اسم الطالب</div>',
        '</div>',
      '</div>',
      '<p class="nc-advisory">هذه الأداة مخصصة لإعداد نسخة قابلة للطباعة من شهادة مشاركة فقط؛ لا تُنشئ سجل إصدار رسميًا، أو رقم شهادة، أو رمز تحقق. لإصدار شهادة مقرّر موثّقة استخدم قسم Certificates الموجود في لوحة المدير بعد التحقق من الإنجاز.</p>',
    '</div>'
  ].join('');

  const css = [
    '.nc-ui{font-family:Tahoma,Arial,sans-serif;color:#173744;max-width:1170px;margin:auto}',
    '.nc-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}',
    '.nc-heading h2{font-size:26px;margin:8px 0;color:#083c4b}.nc-heading p{margin:0;line-height:1.8;color:#476976}',
    '.nc-kicker{letter-spacing:.13em;font:700 10px Arial;color:#947a3e}.nc-tag{background:#fff4d9;border:1px solid #e2d1a7;color:#78601e;padding:8px 12px;border-radius:100px;font-size:12px;font-weight:700}',
    '.nc-controls{display:flex;gap:20px;align-items:end;justify-content:space-between;flex-wrap:wrap;background:#eff8f8;border:1px solid #c7e3e2;border-radius:14px;padding:17px;margin:20px 0 11px}',
    '.nc-field{min-width:230px;flex:1}.nc-field label{display:block;font-weight:700;margin-bottom:8px}.nc-field .input{height:48px;background:white;font-size:18px}.nc-field small{display:block;margin:7px 0 0;color:#607f84;font-size:12px}',
    '.nc-buttons{display:flex;flex-wrap:wrap;gap:8px}.nc-buttons button{min-height:46px}.nc-buttons button:disabled{opacity:.5;cursor:not-allowed}',
    '.nc-feedback{color:#35676c;font-size:13px;margin:6px 0 12px}.nc-advisory{line-height:1.8;color:#667b82;font-size:12px;margin:12px 0 4px}',
    '.nc-sheet-wrap{background:#dbe8e8;border:1px solid #c2d5d7;border-radius:17px;padding:clamp(6px,2vw,22px);overflow:auto}',
    '.nc-sheet{container-type:inline-size;aspect-ratio:297/210;position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 50% 38%,#fff 35%,#f8f7f0 100%);color:#193f4a;text-align:center;box-shadow:0 8px 30px #0f39452c;font-family:Georgia, "Times New Roman",serif;box-sizing:border-box;min-width:280px}',
    '.nc-frame-outer,.nc-frame-inner{pointer-events:none;position:absolute;inset:2.2%;border:3px solid #c2a563}.nc-frame-inner{inset:3.2%;border:1px solid #c2a563}',
    '.nc-corner{pointer-events:none;position:absolute;width:9%;height:12%;border-color:#0b5561;border-style:solid;z-index:1}.nc-corner-tl{top:4.1%;left:4.1%;border-width:3px 0 0 3px}.nc-corner-tr{top:4.1%;right:4.1%;border-width:3px 3px 0 0}.nc-corner-bl{bottom:4.1%;left:4.1%;border-width:0 0 3px 3px}.nc-corner-br{bottom:4.1%;right:4.1%;border-width:0 3px 3px 0}',
    '.nc-emblem{position:absolute;top:6.5%;left:calc(50% - 4.1%);width:8.2%;aspect-ratio:1;border:2px solid #be9f56;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#fffdf8;box-shadow:0 0 0 4px #fffdf8,0 0 0 5px #d8c58f}',
    '.nc-seal-letter{font:bold 5cqw Georgia;color:#0b5361;line-height:.9}.nc-seal-line{width:40%;height:1px;background:#be9f56;margin-top:1.5%}.nc-seal-small{font:bold 1cqw Arial;letter-spacing:.12em;color:#a98b46}',
    '.nc-brand-ar{position:absolute;top:22.4%;left:8%;width:84%;font:700 3.4cqw Tahoma,Arial,sans-serif;color:#0b5260}',
    '.nc-brand-en{position:absolute;top:29.3%;left:8%;width:84%;font:700 1.4cqw Arial,sans-serif;letter-spacing:.22em;color:#947333}',
    '.nc-rule{position:absolute;top:33.5%;left:36%;width:28%;border-top:1px solid #ba9b53}',
    '.nc-title-ar{position:absolute;top:36%;left:7%;width:86%;font:700 5.7cqw Tahoma,Arial,sans-serif;color:#123c49}',
    '.nc-title-en{position:absolute;top:46%;left:8%;width:84%;font:bold 2.1cqw Georgia,serif;letter-spacing:.18em;color:#ad8b40}',
    '.nc-description{position:absolute;top:54%;left:8%;width:84%;font:500 2.15cqw Tahoma,Arial,sans-serif;color:#395863;line-height:1.6}',
    '.nc-name-row{position:absolute;top:59.5%;height:10%;left:9%;width:82%;display:flex;justify-content:center;align-items:center;border-bottom:1px solid #d6c7a1}',
    '.nc-name{color:#0b5363;font-weight:800;font-family:Tahoma,Arial,sans-serif;font-size:4.1cqw;white-space:nowrap;line-height:1.15;max-width:100%;direction:auto}',
    '.nc-after{top:70%;line-height:1.55}.nc-second-line{display:block}',
    '.nc-english{position:absolute;top:79.7%;width:88%;left:6%;font:italic 1.3cqw Georgia,serif;color:#647178}',
    '.nc-footer{position:absolute;bottom:7%;left:8%;width:84%;display:grid;grid-template-columns:1fr 1.1fr 1fr;gap:3%;align-items:end;color:#344f59}',
    '.nc-footer-block{font-family:Tahoma,Arial,sans-serif;font-size:1.4cqw;display:flex;flex-direction:column;align-items:center;gap:.25em}.nc-footer-block b{font-size:1.7cqw;color:#174653}.nc-footer-block small{font:1.15cqw Arial;color:#7d8d90}',
    '.nc-sig-line{width:80%;height:1px;background:#6e8389;margin-bottom:2%;margin-top:11%}',
    '.nc-footer-middle{display:flex;flex-direction:column;gap:.4em;font:700 1.15cqw Arial;letter-spacing:.08em;color:#a58236}.nc-footer-middle span{font:1.05cqw Georgia;letter-spacing:0;color:#748085}.nc-gold-icon{font-size:3.7cqw;line-height:1}',
    '.nc-sample{position:absolute;z-index:3;left:18%;top:63%;width:64%;font:700 2.2cqw Tahoma,Arial,sans-serif;color:#b66131;transform:rotate(-7deg);opacity:.85;pointer-events:none}',
    '@page{size:A4 landscape;margin:0}',
    '@media print{body *{visibility:hidden!important}#nabd-cert-sheet,#nabd-cert-sheet *{visibility:visible!important}#nabd-cert-sheet{position:fixed!important;left:0!important;top:0!important;z-index:999999!important;width:297mm!important;height:210mm!important;min-width:0!important;box-shadow:none!important;border:0!important;margin:0!important;break-inside:avoid!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0!important;padding:0!important;width:297mm!important;height:210mm!important;overflow:hidden!important}}'
  ].join('\n');

  function cleanName(raw) {
    return String(raw || '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function render(panel, ctx) {
    if (!ctx || !ctx.user) {
      panel.textContent = 'يجب تسجيل الدخول بحساب المدير للوصول إلى استوديو الشهادات.';
      return;
    }
    if (panel.querySelector('.nc-ui')) return;
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style'); s.id = STYLE_ID; s.textContent = css;
      document.head.appendChild(s);
    }
    panel.innerHTML = html;
    const input = panel.querySelector('#nc-student-name');
    const name = panel.querySelector('#nc-preview-name');
    const sample = panel.querySelector('#nc-sample');
    const button = panel.querySelector('#nc-print');
    const status = panel.querySelector('#nc-feedback');

    function update() {
      const value = cleanName(input.value);
      const valid = value.length >= 2 && value.length <= 100;
      name.textContent = valid ? value : 'اسم الطالب / Student Name';
      name.setAttribute('dir', /[\u0600-\u06ff]/.test(value) ? 'rtl' : 'ltr');
      sample.hidden = valid;
      button.disabled = !valid;
      status.textContent = valid ? 'جاهزة للمعاينة والطباعة. راجع الاسم حرفًا حرفًا.' : 'اكتب اسم الطالب لتفعيل الطباعة.';
      // Long names shrink, while the remaining design stays exactly the same.
      const n = value.length;
      name.style.fontSize = (n > 55 ? 2.1 : n > 42 ? 2.6 : n > 31 ? 3.1 : n > 22 ? 3.65 : 4.1) + 'cqw';
    }
    input.addEventListener('input', update);
    panel.querySelector('#nc-clear').addEventListener('click', function () { input.value = ''; update(); input.focus(); });
    button.addEventListener('click', function () {
      update();
      if (button.disabled) return;
      window.print();
    });
    update();
  }

  if (typeof window.NABD_ADMIN_REGISTER_MODULE === 'function') {
    window.NABD_ADMIN_REGISTER_MODULE({id: ID, title: '✦ إصدار شهادات ثابتة', render: render});
  }
})();
