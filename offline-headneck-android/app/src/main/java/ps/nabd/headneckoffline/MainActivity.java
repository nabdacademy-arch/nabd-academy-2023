package ps.nabd.headneckoffline;

import android.app.Activity;
import android.view.View;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import android.widget.ImageView;
import android.graphics.Bitmap;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.LinkedHashMap;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.LinkedHashSet;
import java.util.Locale;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

public class MainActivity extends Activity {
    // Public browser key only. Never place a secret/service-role key in the APK.
    private static final String BASE="https://zsmmmljgguycrvyrmakl.supabase.co";
    private static final String PUBLISHABLE="sb_publishable_PEDwhSNvOky8CIP79ihA4Q_ozLI2CnM";
    private static final int CHUNK=500;
    private static final int PICK_FILE=2732;
    private static final String BANK_FILE="nabd_headneck_private_bank_v2.enc";
    private volatile String availableBank=null;
    private WebView browser;
    private LinearLayout rootView;
    private ScrollView pageScroll;
    private EditText emailInput, passwordInput;
    private TextView loginMessage;
    private Button loginButton;
    private boolean english=false;
    private JSONObject nativeBank;
    private final ArrayList<JSONObject> questions=new ArrayList<>();
    private final ArrayList<Integer> session=new ArrayList<>();
    private int sessionIndex=0,bankOffset=0;
    private String chosenChapter="all",chosenPool="all";
    private int chosenCount=20,quizCorrect=0,quizIncorrect=0,quizUnscored=0;
    private boolean quizMode=false;
    private static final int PICK_SLIDES=3814;
    private PdfRenderer pdfRenderer;
    private PdfRenderer.Page pdfPage;
    private ParcelFileDescriptor pdfFd;
    private int pdfIndex=0;
    private String slideChapter="Skull";

    private ValueCallback<android.net.Uri[]> chooser;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(6,22,37));
        getWindow().setNavigationBarColor(Color.rgb(6,22,37));
        showNativeLogin();
    }

    private void launchOriginalWebView(){
        WebView.setWebContentsDebuggingEnabled(false);
        browser=new WebView(this);
        browser.setBackgroundColor(Color.rgb(6,22,37));
        setContentView(browser);
        WebSettings options=browser.getSettings();
        options.setJavaScriptEnabled(true);
        options.setDomStorageEnabled(true);
        options.setAllowFileAccess(true);
        options.setAllowContentAccess(false);
        options.setAllowFileAccessFromFileURLs(false);
        options.setAllowUniversalAccessFromFileURLs(false);
        options.setJavaScriptCanOpenWindowsAutomatically(false);
        options.setSupportMultipleWindows(false);
        options.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        browser.addJavascriptInterface(new PrivateDirectorBridge(),"NABDApp");
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest r) {
                return !r.getUrl().toString().startsWith("file:///android_asset/");
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest r) {
                if(!r.getUrl().toString().startsWith("file:///android_asset/"))
                    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
                return super.shouldInterceptRequest(view,r);
            }
        });
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<android.net.Uri[]> cb,FileChooserParams params) {
                if(chooser!=null)chooser.onReceiveValue(null);
                chooser=cb;
                try {
                    Intent intent=params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent,PICK_FILE);
                    return true;
                } catch(Exception e) {
                    chooser=null;
                    return false;
                }
            }
        });
        browser.loadUrl("file:///android_asset/index.html");
    }


    private int px(int dp){return (int)(dp*getResources().getDisplayMetrics().density+0.5f);}
    private int bg=Color.rgb(6,22,37),panel=Color.rgb(10,38,58),ink=Color.rgb(237,250,255),mint=Color.rgb(34,217,202);
    private GradientDrawable fill(int color,int border){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(px(14));
        if(border!=0)d.setStroke(px(1),border);return d;
    }
    private LinearLayout stack(){
        LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);l.setPadding(px(14),px(12),px(14),px(18));return l;
    }
    private void newPage(String title,String subtitle){
        ScrollView scroll=new ScrollView(this);pageScroll=scroll;scroll.setFillViewport(true);scroll.setBackgroundColor(bg);
        rootView=stack();scroll.addView(rootView);
        setContentView(scroll);
        TextView name=title(title,22);name.setGravity(Gravity.CENTER);rootView.addView(name);
        TextView sub=text(subtitle,14);sub.setGravity(Gravity.CENTER);sub.setTextColor(Color.rgb(168,202,214));rootView.addView(sub);
        space(rootView,12);
    }
    private TextView title(String s,int size){
        TextView t=text(s,size);t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);return t;
    }
    private TextView text(String s,int size){
        TextView t=new TextView(this);t.setText(s);t.setTextColor(ink);t.setTextSize(size);t.setPadding(px(5),px(7),px(5),px(7));
        t.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG);
        return t;
    }
    private void space(LinearLayout parent,int dp){
        View v=new View(this);parent.addView(v,new LinearLayout.LayoutParams(1,px(dp)));
    }
    private void scrollToAnswer(){if(pageScroll!=null)pageScroll.post(()->pageScroll.fullScroll(View.FOCUS_DOWN));}
    private void card(String text){
        TextView v=text(text,15);v.setPadding(px(14),px(14),px(14),px(14));
        v.setBackground(fill(panel,Color.rgb(37,80,100)));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,px(5),0,px(6));rootView.addView(v,p);
    }
    private Button action(String caption,Runnable run){
        Button b=new Button(this);b.setText(caption);b.setTextColor(ink);b.setTextSize(14);b.setAllCaps(false);
        b.setBackground(fill(Color.rgb(23,64,85),Color.rgb(44,102,117)));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,px(52));p.setMargins(0,px(5),0,px(5));
        rootView.addView(b,p);b.setOnClickListener(v->run.run());return b;
    }
    private EditText edit(String hint,boolean password){
        EditText t=new EditText(this);t.setTextColor(ink);t.setHintTextColor(Color.rgb(155,185,200));
        t.setHint(hint);t.setSingleLine(true);t.setTextSize(16);t.setPadding(px(14),0,px(14),0);
        t.setBackground(fill(Color.rgb(7,28,42),Color.rgb(53,98,116)));
        t.setInputType(password?(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD):(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS));
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,px(54));p.setMargins(0,px(8),0,px(8));rootView.addView(t,p);return t;
    }
    private void showNativeLogin(){
        newPage("🧠 NABD • Head & Neck Lab","🔐 مساحة المدير الخاصة • Anatomy III");
        space(rootView,18);
        card("تسجيل الدخول\nأدخل نفس البريد الإلكتروني وكلمة المرور الخاصين بصفحة مدير الأكاديمية. يحتاج أول دخول إلى اتصال بالإنترنت، ثم يُحفظ بنك الأسئلة مشفرًا لاستخدامه دون نت.");
        emailInput=edit("البريد الإلكتروني للمدير",false);
        passwordInput=edit("كلمة مرور المدير",true);
        loginButton=action("🔐 تسجيل الدخول • Sign in",()->{
            String email=emailInput.getText().toString().trim(),pass=passwordInput.getText().toString();
            if(email.isEmpty()||pass.isEmpty()){loginMessage.setText("أدخل البريد الإلكتروني وكلمة المرور.");return;}
            loginButton.setEnabled(false);loginMessage.setText("جارٍ التحقق من بيانات المدير...");
            passwordInput.setText("");
            new Thread(()->nativeLogin(email,pass),"nabd-native-login").start();
        });
        loginMessage=text("يلزم الإنترنت عند تسجيل الدخول لأول مرة.",14);rootView.addView(loginMessage);
    }
    private void nativeLogin(String email,String password){
        String user=email.trim().toLowerCase(Locale.ROOT);
        try{
            runOnUiThread(()->loginMessage.setText("جارٍ التحقق من صلاحيات المدير وتنزيل بنك الأسئلة..."));
            String data=fetchOnlineBank(user,password);
            if(questionCount(data)<1)throw new IOException("البنك فارغ.");
            encryptToDevice(user,password,data);
            openNativeBank(data);
        }catch(SecurityException wrong){
            runOnUiThread(()->{loginButton.setEnabled(true);loginMessage.setText("⚠ "+wrong.getMessage());});
        }catch(Exception err){
            runOnUiThread(()->loginMessage.setText("جارٍ البحث عن نسخة مشفّرة على الجهاز..."));
            try{openNativeBank(decryptFromDevice(user,password));}
            catch(Exception noLocal){
                runOnUiThread(()->{
                    loginButton.setEnabled(true);
                    loginMessage.setText("⚠ تعذّر الاتصال أو فتح النسخة المحلية. استخدم الإنترنت أول مرة، أو تأكد من استخدام نفس بيانات المدير السابقة.");
                });
            }
        }
    }
    private void openNativeBank(String raw)throws Exception{
        final JSONObject data=new JSONObject(raw);
        final JSONArray fresh=data.getJSONArray("new"),old=data.getJSONArray("original"),history=data.getJSONArray("archived");
        final ArrayList<JSONObject> parsed=new ArrayList<>();
        for(JSONArray a:new JSONArray[]{fresh,old,history})for(int i=0;i<a.length();i++)parsed.add(a.getJSONObject(i));
        if(parsed.isEmpty())throw new IOException("لم تُسترجع الأسئلة.");
        runOnUiThread(()->{
            nativeBank=data;questions.clear();questions.addAll(parsed);
            showNativeHome();
        });
    }
    private void menu(){
        action(english?"🏠 Home":"🏠 الرئيسية",this::showNativeHome);
        action(english?"🌐 العربية":"🌐 English",()->{english=!english;showNativeHome();});
    }

    private static final String[] CHAPTER_IDS={"Skull","ScalpFace","Neck","Orbit","EarMandible","Oral","TonguePharynx","Larynx","Nose","Mixed"};
    private static final String[] CHAPTER_AR={"الجمجمة","فروة الرأس والوجه","الرقبة","الحجاج والعين","الأذن والفك السفلي","جوف الفم والغدد اللعابية","اللسان والبلعوم","الحنجرة والرغامى","الأنف والتجويف الأنفي","أسئلة متنوعة"};
    private static final String[] CHAPTER_EN={"Skull","Scalp & Face","Neck","Orbit & Eye","Ear & Mandible","Oral Cavity & Salivary Glands","Tongue & Pharynx","Larynx & Trachea","Nose","Mixed questions"};
    private String chapterTitle(String id){
        for(int i=0;i<CHAPTER_IDS.length;i++)if(CHAPTER_IDS[i].equals(id))return english?CHAPTER_EN[i]:CHAPTER_AR[i];
        return id;
    }
    private int chapterCount(String chapter) {
        int n=0;for(JSONObject q:questions)if(chapter.equals(q.optString("chapter","")))n++;
        return n;
    }
    private boolean matchesChapter(JSONObject q) {
        return "all".equals(chosenChapter)||chosenChapter.equals(q.optString("chapter",""));
    }
    private void showNativeHome(){
        quizMode=false;
        newPage("🧠 NABD • Head & Neck","مساحة المدير • النسخة التعليمية الخاصة");
        card("✅ بنك الأسئلة متاح على الهاتف\n"+questions.size()+" سؤالًا • تصحيح + شرح + ترجمة متى توفرت\n"+
             "🔐 تم التحقق من الحساب، والبيانات مخزنة مشفّرة للاستخدام دون إنترنت");
        action("📚 الشابترات • شرح + سلايدات + تدريب",this::showNativeChapters);
        action("📖 بنك الأسئلة مع الإجابات والشروحات",()->showNativeList(null,0));
        action("🎯 محاكي الامتحانات حسب الفصل والصعوبة",this::showQuizSetup);
        action("🖥️ قسم السلايدات وملفات PDF",this::showNativeSlideLibrary);
        action("🤖 اسأل بوت التشريح",this::showNativeSearch);
        action("❌ مراجعة أخطائي",this::showNativeWrong);
        action("📊 نتائجي وإحصاءاتي",this::showNativeStats);
        action("📎 المصادر والمراجع",this::showNativeSources);
        action(english?"🌐 العربية":"🌐 English",()->{english=!english;showNativeHome();});
        action("🔒 تسجيل الخروج",()->{
            nativeBank=null;questions.clear();session.clear();availableBank=null;quizMode=false;showNativeLogin();
        });
    }
    private void showNativeChapters(){
        newPage("📚 فصول التشريح","اختر فصلًا لشرح نقاطه العلمية أو التدرب على أسئلته");
        menu();
        for(String chapter:CHAPTER_IDS){
            int n=chapterCount(chapter);
            action("📁 "+chapterTitle(chapter)+" • "+n+" سؤال",()->showChapterMenu(chapter));
        }
    }
    private void showChapterMenu(String chapter){
        chosenChapter=chapter;
        newPage("📚 "+chapterTitle(chapter),"Anatomy III • "+chapterCount(chapter)+" سؤالًا");
        menu();
        action("📘 ملف شرح الشابتر كاملًا",()->showChapterStudyGuide(chapter,0));
        action("🖥️ بطاقات السلايدات التعليمية",()->showChapterLesson(chapter,0));
        action("📄 سلايدات PDF المرتبطة بالفصل",()->showPdfForChapter(chapter));
        action("📖 جميع أسئلة هذا الشابتر",()->showNativeList(null,0));
        action("📝 اختبرني في هذا الشابتر",this::showQuizSetup);
        action("📎 مصادر ومراجع",this::showNativeSources);
        action("⬅️ باقي الشابترات",this::showNativeChapters);
    }
    private ArrayList<JSONObject> concepts(String chapter){
        ArrayList<JSONObject> result=new ArrayList<>();
        LinkedHashSet<String> ids=new LinkedHashSet<>();
        for(JSONObject q:questions){
            if(!chapter.equals(q.optString("chapter","")))continue;
            if(!"generated".equals(q.optString("kind","")))continue;
            String key=q.optString("factRef",q.optString("id",""));
            if(ids.add(key))result.add(q);
        }
        return result;
    }

    private void showChapterStudyGuide(String chapter,int page){
        ArrayList<JSONObject> concepts=concepts(chapter);
        int start=Math.min(page*12,concepts.size()),end=Math.min(start+12,concepts.size());
        newPage("📘 ملف شرح: "+chapterTitle(chapter),"شرح الفصل من المفاهيم العلمية الموثقة في بنك الأسئلة • صفحة "+(page+1));
        menu();
        if(concepts.isEmpty()){
            card("لا يحتوي هذا الشابتر على مفاهيم جديدة ذات شروح مستقلة في البنك المحفوظ. لا يمكن عرض ملف محاضرة غير متوفر.");
            action("➕ إضافة PDF للفصل",()->showPdfForChapter(chapter));return;
        }
        card("يتضمن هذا الدليل "+concepts.size()+" مفهومًا، مستخلصًا من الإجابات وشروحها. لا تُعرض الأسئلة بدلًا من المحاضرات.");
        for(int i=start;i<end;i++){
            JSONObject q=concepts.get(i);
            int answer=q.optInt("answer",-1);
            JSONArray o=options(q);
            if(o==null||answer<0||answer>=o.length())continue;
            String fact=o.optString(answer);
            String expl=explanation(q);
            card("📌 "+(i+1)+". "+fact+
                (expl.isEmpty()?"":"\n\n📖 "+expl));
        }
        action("🌐 العربية / English",()->{english=!english;showChapterStudyGuide(chapter,page);});
        if(page>0)action("◀ السابق",()->showChapterStudyGuide(chapter,page-1));
        if(end<concepts.size())action("التالي ▶",()->showChapterStudyGuide(chapter,page+1));
        action("🖥️ بطاقات الشرح واحدة واحدة",()->showChapterLesson(chapter,0));
        action("🎯 اختبر معلوماتك بالفصل",()->{chosenChapter=chapter;showQuizSetup();});
    }
    private void showChapterLesson(String chapter,int pos){
        ArrayList<JSONObject> slides=concepts(chapter);
        if(slides.isEmpty()){
            newPage("🖥️ "+chapterTitle(chapter),"بطاقات شرح المفاهيم");
            menu();card("لا توجد بطاقات شرح موثقة لهذا القسم داخل بنك الأسئلة الحالي. يمكنك إضافة سلايدات PDF.");
            action("📄 إضافة سلايدات PDF",()->showPdfForChapter(chapter));return;
        }
        int index=Math.min(Math.max(pos,0),slides.size()-1);
        JSONObject q=slides.get(index);
        newPage("🖥️ "+chapterTitle(chapter),"شرح مفهوم "+(index+1)+" من "+slides.size()+" • بناءً على نقاط علمية من البنك وليست المحاضرة الأصلية");
        menu();
        int answer=q.optInt("answer",-1);
        JSONArray o=options(q);
        if(o!=null&&answer>=0&&answer<o.length()){
            card("📌 النقطة العلمية الأساسية\n"+o.optString(answer));
        }
        String exp=explanation(q);
        if(!exp.trim().isEmpty())card("📖 الشرح\n"+exp);
        else card("لا يوجد شرح إضافي مدقق لهذه النقطة.");
        if(!english&&(q.optString("whyAr","").isEmpty()||q.optJSONArray("optsAr")==null))
            card("المصدر لا يحتوي شرحًا عربيًا كاملًا لهذا المفهوم، لذلك يظهر نصه الإنجليزي الأصلي.");
        card("📚 المرجع: "+q.optString("source","مستخلص من بنك التشريح"));
        action("🌐 العربية / English",()->{english=!english;showChapterLesson(chapter,index);});
        action("📝 سؤال تطبيقي عن هذه النقطة",()->showNativeQuestion(q,()->showChapterLesson(chapter,index)));
        if(index>0)action("◀ السابق",()->showChapterLesson(chapter,index-1));
        if(index<slides.size()-1)action("التالي ▶",()->showChapterLesson(chapter,index+1));
        action("📘 ملف شرح الشابتر كاملًا",()->showChapterStudyGuide(chapter,0));
        action("📄 سلايدات PDF الخاصة",()->showPdfForChapter(chapter));
    }
    private void showNativeSlideLibrary(){
        newPage("🖥️ سلايدات التشريح","ملفات PDF محفوظة على جهازك + بطاقات شرح الفصول");
        menu();
        card("يمكن إضافة سلايدات PDF لكل شابتر من ملفات الهاتف. تبقى الملفات على جهازك وتُفتح دون إنترنت عند حفظ نسخة محلية منها.");
        for(String id:CHAPTER_IDS){
            action("📁 "+chapterTitle(id),()->showPdfForChapter(id));
        }
    }
    private String slideKey(String chapter){return "slides_pdf_uri_"+chapter;}
    private void showPdfForChapter(String chapter){
        slideChapter=chapter;
        newPage("📄 "+chapterTitle(chapter),"السلايدات الأصلية المضافة من هاتفك");
        menu();
        action("📘 ملف شرح الشابتر",()->showChapterStudyGuide(chapter,0));
        action("🖥️ بطاقات الشرح",()->showChapterLesson(chapter,0));
        String saved=getSharedPreferences("nabd-anatomy-slides",MODE_PRIVATE).getString(slideKey(chapter),"");
        if(saved.isEmpty())card("لم تضف ملف سلايدات PDF لهذا الشابتر بعد.");
        else action("📖 فتح ملف PDF المحفوظ",()->openPdf(saved,0));
        action("➕ إضافة أو استبدال ملف سلايدات PDF",()->{
            try{
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("application/pdf");intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(intent,PICK_SLIDES);
            }catch(Exception e){card("تعذر فتح منتقي الملفات: "+e.getMessage());}
        });
    }
    private void closePdf(){
        try{if(pdfPage!=null){pdfPage.close();pdfPage=null;}}catch(Exception ignored){}
        try{if(pdfRenderer!=null){pdfRenderer.close();pdfRenderer=null;}}catch(Exception ignored){}
        try{if(pdfFd!=null){pdfFd.close();pdfFd=null;}}catch(Exception ignored){}
    }
    private void openPdf(String uri,int page){
        try{
            closePdf();
            File saved=new File(uri);
            if(!saved.getCanonicalPath().startsWith(getFilesDir().getCanonicalPath()+File.separator))throw new IOException("مسار ملف غير موثوق.");
            pdfFd=ParcelFileDescriptor.open(saved,ParcelFileDescriptor.MODE_READ_ONLY);
            if(pdfFd==null)throw new IOException("ملف PDF غير متاح.");
            pdfRenderer=new PdfRenderer(pdfFd);
            renderPdfPage(page);
        }catch(Exception e){
            closePdf();newPage("📄 خطأ في السلايدات","تعذر فتح ملف PDF");
            card("اختر الملف مرة أخرى من هاتفك.\n"+e.getMessage());
            action("عودة",()->showPdfForChapter(slideChapter));
        }
    }
    private void renderPdfPage(int index){
        try{
            if(pdfPage!=null){pdfPage.close();pdfPage=null;}
            if(pdfRenderer==null)return;
            int total=pdfRenderer.getPageCount();
            pdfIndex=Math.min(Math.max(0,index),total-1);
            pdfPage=pdfRenderer.openPage(pdfIndex);
            newPage("🖥️ سلايدات "+chapterTitle(slideChapter),"صفحة "+(pdfIndex+1)+" / "+total);
            Bitmap bitmap=Bitmap.createBitmap(Math.min(pdfPage.getWidth()*2,1700),Math.min(pdfPage.getHeight()*2,2300),Bitmap.Config.ARGB_8888);
            bitmap.eraseColor(Color.WHITE);
            pdfPage.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            ImageView img=new ImageView(this);
            img.setImageBitmap(bitmap);img.setAdjustViewBounds(true);
            img.setScaleType(ImageView.ScaleType.FIT_CENTER);
            rootView.addView(img,new LinearLayout.LayoutParams(-1,-2));
            if(pdfIndex>0)action("◀ الصفحة السابقة",()->renderPdfPage(pdfIndex-1));
            if(pdfIndex+1<total)action("الصفحة التالية ▶",()->renderPdfPage(pdfIndex+1));
            action("إغلاق السلايدات",()->{closePdf();showPdfForChapter(slideChapter);});
        }catch(Exception e){closePdf();showPdfForChapter(slideChapter);}
    }
    private void showNativeStats(){
        newPage("📊 نتائج التدريب","إحصاءات الإجابات المحفوظة على الهاتف");
        menu();
        android.content.SharedPreferences p=getSharedPreferences("nabd-anatomy-stats",MODE_PRIVATE);
        card("✅ الصحيحة: "+p.getInt("correct",0)+"\n❌ الخاطئة: "+p.getInt("wrong",0)+"\n"+
            "⚠ دون مفتاح موثوق: "+p.getInt("ungraded",0));
        action("🎯 ابدأ تدريبًا جديدًا",this::showQuizSetup);
        action("❌ مراجعة الأسئلة الخاطئة",this::showNativeWrong);
    }
    private String questionText(JSONObject q){String s=q.optString(english?"q":"qAr","");return s.isEmpty()?q.optString("q",""):s;}
    private JSONArray options(JSONObject q){JSONArray opts=q.optJSONArray(english?"opts":"optsAr");if(opts==null||opts.length()==0)opts=q.optJSONArray("opts");return opts;}
    private String explanation(JSONObject q){String s=q.optString(english?"why":"whyAr","");return s.isEmpty()?q.optString("why",""):s;}
    private String id(JSONObject q){return q.optString("id",String.valueOf(q.hashCode()));}

    private void showNativeList(String search,int offset){
        ArrayList<JSONObject> subset=new ArrayList<>();
        String needle=search==null?"":search.trim().toLowerCase(Locale.ROOT);
        for(JSONObject q:questions){
            if(!matchesChapter(q))continue;
            String hay=q.optString("q","")+" "+q.optString("qAr","")+" "+
                q.optString("why","")+" "+q.optString("whyAr","")+" "+
                q.optString("chapter","")+" "+q.optString("source","");
            JSONArray o=q.optJSONArray("opts");if(o!=null)hay+=" "+o.toString();
            JSONArray ar=q.optJSONArray("optsAr");if(ar!=null)hay+=" "+ar.toString();
            if(needle.isEmpty()||hay.toLowerCase(Locale.ROOT).contains(needle))subset.add(q);
        }
        int start=Math.min(offset,subset.size()),end=Math.min(start+12,subset.size());
        newPage("📖 بنك أسئلة التشريح",chapterTitle(chosenChapter)+" • "+(subset.isEmpty()?0:start+1)+"–"+end+" / "+subset.size());
        menu();
        action("🔎 البحث داخل البنك",this::showNativeSearch);
        for(int i=start;i<end;i++){
            final JSONObject q=subset.get(i);
            card((i+1)+". "+questionText(q)+"\n"+
                (q.optString("answerVerified","not_verified").equals("not_verified")?"⚠ المفتاح غير موثق":"✓ خيار الإجابة والشرح داخل السؤال"));
            action("📝 عرض الخيارات والحل والشرح",()->showNativeQuestion(q,()->showNativeList(search,start)));
        }
        if(end<subset.size())action("التالي ◀",()->showNativeList(search,end));
        if(start>0)action("▶ السابق",()->showNativeList(search,Math.max(0,start-12)));
        if(subset.isEmpty())card("لا توجد أسئلة بهذه التصفية.");
    }

    private boolean hasKey(JSONObject q,int index){
        JSONArray original=q.optJSONArray("opts");
        return index>=0&&original!=null&&index<original.length()&&
             !q.optString("answerVerified","not_verified").equals("not_verified");
    }
    private void recordAnswer(JSONObject q,boolean correct,boolean graded){
        android.content.SharedPreferences p=getSharedPreferences("nabd-anatomy-stats",MODE_PRIVATE);
        String counter=graded?(correct?"correct":"wrong"):"ungraded";
        p.edit().putInt(counter,p.getInt(counter,0)+1).apply();
        if(graded)getSharedPreferences("nabd-anatomy-progress-v3",MODE_PRIVATE).edit()
                .putBoolean(id(q),!correct).apply();
        if(quizMode){if(!graded)quizUnscored++;else if(correct)quizCorrect++;else quizIncorrect++;}
    }
    private void showNativeQuestion(JSONObject q,Runnable next){
        newPage("📚 سؤال تشريح",chapterTitle(q.optString("chapter",""))+
                " • "+q.optString("sourceLevel",q.optString("kind","")));
        card(questionText(q));
        JSONArray choices=options(q);
        if(choices==null||choices.length()==0){card("⚠ لا تتوفر خيارات هذا السؤال.");action("رجوع",next);return;}
        boolean bilingual=q.optString("qAr","").length()>0&&q.optJSONArray("optsAr")!=null;
        if(!english&&!bilingual){
            card("🌐 لا توجد ترجمة عربية كاملة ومحفوظة لهذا السؤال من المصدر؛ يظهر نصه الإنجليزي الأصلي بدل إنشاء ترجمة غير دقيقة.");
        }
        int answer=q.optInt("answer",-1);
        boolean graded=hasKey(q,answer);
        final boolean[] answered={false};
        final int correct=answer;
        for(int i=0;i<choices.length();i++){
            int selected=i;
            String label=String.valueOf((char)('A'+i))+". "+choices.optString(i);
            action(label,()->{
                if(answered[0])return;answered[0]=true;
                boolean right=graded&&selected==correct;
                recordAnswer(q,right,graded);
                if(graded){
                    String correctText=choices.optString(correct);
                    card((right?"✅ إجابة صحيحة":"❌ إجابة خاطئة")+
                         "\nالإجابة الصحيحة: "+String.valueOf((char)('A'+correct))+" • "+correctText);
                }else{
                    card("⚠ هذه المسألة لا تمتلك مفتاح إجابة موثوقًا بعد. لن نضع علامة صح عشوائية ولن تحتسب ضمن نتيجة الامتحان.");
                }
                String expl=explanation(q);
                if(!expl.trim().isEmpty())card("💡 شرح الإجابة\n"+expl);
                else card("📚 لا يتوفر شرح مدقق مرتبط بالسؤال في بنك المصدر.");
                card("📎 المصدر: "+q.optString("source","غير محدد")+
                    "\nدرجة توثيق المفتاح: "+q.optString("answerVerified","غير مراجع"));
                scrollToAnswer();
            });
        }
        action("👁 إظهار الحل والشرح دون احتساب",()->{
            if(answered[0])return;answered[0]=true;
            if(graded){
                card("✅ الإجابة: "+String.valueOf((char)('A'+correct))+" • "+choices.optString(correct));
            }else card("⚠ لا يتوفر مفتاح إجابة موثوق.");
            if(!explanation(q).trim().isEmpty())card("💡 "+explanation(q));
            else card("لا يوجد شرح مدقق لهذا السؤال.");
            scrollToAnswer();
        });
        action("🌐 تبديل اللغة • العربية / English",()->{english=!english;showNativeQuestion(q,next);});
        action(quizMode?"السؤال التالي ▶":"⬅️ رجوع إلى الأسئلة",next);
    }

    private void showQuizSetup(){
        quizMode=false;
        newPage("🎯 محاكي امتحانات التشريح","اختر الفصل والمصدر والعدد، ثم ابدأ");
        menu();
        card("الشابتر الحالي: "+("all".equals(chosenChapter)?"كل الشابترات":chapterTitle(chosenChapter))+
            "\nالمصدر: "+chosenPool+"\nعدد الأسئلة: "+chosenCount);
        action("📚 اختر الشابتر",()->{
            newPage("تحديد شابتر الامتحان","اختر نطاق التدريب");
            action("🌐 كل الفصول",()->{chosenChapter="all";showQuizSetup();});
            for(String chapter:CHAPTER_IDS)action(chapterTitle(chapter)+" • "+chapterCount(chapter),()->{
                chosenChapter=chapter;showQuizSetup();
            });
        });
        action("📂 اختر مصدر الأسئلة",()->{
            newPage("مصادر الأسئلة","حدد بنك التدريب");
            action("الكل",()->{chosenPool="all";showQuizSetup();});
            action("الأسئلة الجديدة (1000)",()->{chosenPool="new";showQuizSetup();});
            action("أسئلة المصادر السابقة",()->{chosenPool="original";showQuizSetup();});
            action("الامتحانات التاريخية",()->{chosenPool="archived";showQuizSetup();});
        });
        action("🔢 عدد الأسئلة (10 / 20 / 40 / 80)",()->{
            newPage("عدد الأسئلة","اختر عدد أسئلة جلسة الامتحان");
            for(int n:new int[]{10,20,40,80})action(n+" سؤال",()->{chosenCount=n;showQuizSetup();});
        });
        action("✅ ابدأ امتحانًا جديدًا",this::startNativeQuiz);
    }
    private void startNativeQuiz(){
        session.clear();
        ArrayList<Integer> indexes=new ArrayList<>();
        for(int i=0;i<questions.size();i++){
            JSONObject q=questions.get(i);
            if(!matchesChapter(q))continue;
            String pool=q.optString("kind","original");
            if(!"all".equals(chosenPool)){
                if(chosenPool.equals("new")&&!pool.equals("generated"))continue;
                if(chosenPool.equals("original")&&!pool.equals("original"))continue;
                if(chosenPool.equals("archived")&&!pool.equals("archived"))continue;
            }
            indexes.add(i);
        }
        Collections.shuffle(indexes);
        for(int i=0;i<Math.min(chosenCount,indexes.size());i++)session.add(indexes.get(i));
        sessionIndex=0;quizCorrect=0;quizIncorrect=0;quizUnscored=0;
        quizMode=true;
        if(session.isEmpty()){
            quizMode=false;newPage("⚠ لا توجد أسئلة","غيّر الفصل أو المصدر وعدد الأسئلة.");
            action("الإعدادات",this::showQuizSetup);return;
        }
        nativeQuizQuestion();
    }
    private void nativeQuizQuestion(){
        if(sessionIndex>=session.size()){showQuizResult();return;}
        JSONObject q=questions.get(session.get(sessionIndex));
        showNativeQuestion(q,()->{sessionIndex++;nativeQuizQuestion();});
        card("السؤال "+(sessionIndex+1)+" من "+session.size()+
             "\nالإجابات الصحيحة: "+quizCorrect+" • الخاطئة: "+quizIncorrect);
    }
    private void showQuizResult(){
        quizMode=false;
        newPage("🏁 نتيجة الامتحان","انتهت جلسة التدريب");
        int graded=quizCorrect+quizIncorrect;
        int percent=graded==0?0:(int)Math.round(quizCorrect*100.0/graded);
        card("✅ صحيح: "+quizCorrect+"\n❌ خطأ: "+quizIncorrect+
            "\n⚠ غير محتسب: "+quizUnscored+
            "\n🎯 الدقة: "+(graded==0?"—":percent+"%"));
        action("❌ راجع أخطاءك",this::showNativeWrong);
        action("🔁 امتحان جديد",this::showQuizSetup);
        action("🏠 الرئيسية",this::showNativeHome);
    }
    private void showNativeSearch(){
        newPage("🤖 اسأل بوت التشريح","بحث محلي داخل جميع الأسئلة والإجابات والشروحات");
        menu();
        EditText term=edit("مثل: facial nerve / foramen ovale",false);
        term.setInputType(InputType.TYPE_CLASS_TEXT);
        action("🔎 ابحث",()->{
            String q=term.getText().toString().trim();
            if(q.isEmpty())return;
            showNativeList(q,0);
        });
        card("يعمل هذا البحث دون إنترنت اعتمادًا على بنك الأسئلة المحفوظ. لا يولّد إجابات طبية جديدة من خارج مصادر البنك.");
    }
    private void showNativeWrong(){
        newPage("🎯 مراجعة أخطائي","الأسئلة التي أجبت عنها بشكل غير صحيح");
        menu();
        ArrayList<JSONObject> wrong=new ArrayList<>();
        for(JSONObject q:questions)if(getSharedPreferences("nabd-anatomy-progress-v3",MODE_PRIVATE).getBoolean(id(q),false))wrong.add(q);
        card("عدد الأسئلة التي تحتاج مراجعة: "+wrong.size());
        for(int i=0;i<Math.min(wrong.size(),30);i++){
            JSONObject q=wrong.get(i);
            card(questionText(q));
            action("راجع السؤال",()->showNativeQuestion(q,this::showNativeWrong));
        }
    }
    private void showNativeSources(){
        newPage("📎 المصادر العلمية","المراجع المسجلة في بنك التشريح الخاص");
        menu();
        if(nativeBank==null)return;
        JSONArray refs=nativeBank.optJSONArray("references");
        if(refs==null)return;
        for(int i=0;i<refs.length();i++){
            JSONObject ref=refs.optJSONObject(i);
            if(ref!=null)card("📚 "+ref.optString("name","Reference"));
        }
    }

    private class PrivateDirectorBridge {
        @JavascriptInterface public void signIn(String email,String password) {
            new Thread(() -> {
                String user=email==null?"":email.trim().toLowerCase(Locale.ROOT);
                if(user.isEmpty()||password==null||password.isEmpty()){
                    report(false,"يرجى إدخال بريد المدير وكلمة المرور.",false,0);return;
                }
                try {
                    status("جارٍ التحقق من صلاحيات المدير في أكاديمية نبض...");
                    String data=fetchOnlineBank(user,password);
                    if(data.length()<1000)throw new IOException("بيانات بنك الأسئلة فارغة.");
                    encryptToDevice(user,password,data);
                    availableBank=data;
                    int count=questionCount(data);
                    report(true,"تم تنزيل بنك الأسئلة وحفظه مشفرًا.",false,count);
                } catch(SecurityException badCredentials){
                    report(false,badCredentials.getMessage(),false,0);
                } catch(Exception connectivity){
                    status("تعذر الاتصال، جارٍ التحقق من النسخة المشفرة على هذا الجهاز...");
                    try {
                        String data=decryptFromDevice(user,password);
                        availableBank=data;
                        report(true,"تم الفتح من النسخة المحفوظة دون إنترنت.",true,questionCount(data));
                    } catch(Exception noCache){
                        report(false,"تعذر تسجيل الدخول عبر الإنترنت. إذا كانت هذه أول مرة، اتصل بالإنترنت وتأكد من بريد المدير وكلمة مروره. إذا سبق الدخول، تأكد من استخدام نفس البيانات.",false,0);
                    }
                }
            },"nabd-director-login").start();
        }

        @JavascriptInterface public String takeBank() {
            String result=availableBank;
            availableBank=null;
            return result==null?"":result;
        }

        @JavascriptInterface public void clearSession(){ availableBank=null; }
    }

    private void status(String value){
        runOnUiThread(() -> {
            if(browser!=null)browser.evaluateJavascript(
                "window.NABDLoginStatus && window.NABDLoginStatus("+JSONObject.quote(value)+")",null);
        });
    }

    private void report(boolean success,String message,boolean offline,int count){
        try{
            JSONObject o=new JSONObject();
            o.put("ok",success);o.put("message",message);o.put("offline",offline);o.put("count",count);
            final String js="window.NABDLoginResult && window.NABDLoginResult(JSON.parse("+JSONObject.quote(o.toString())+"))";
            runOnUiThread(()->{if(browser!=null)browser.evaluateJavascript(js,null);});
        }catch(Exception ignored){}
    }

    private int questionCount(String json)throws Exception {
        JSONObject bank=new JSONObject(json);
        return bank.getJSONArray("new").length()+bank.getJSONArray("original").length()+bank.getJSONArray("archived").length();
    }

    private static class HttpStatus extends IOException {
        final int status;
        HttpStatus(int code,String message){super(message);status=code;}
    }

    private String request(String method,String path,JSONObject data,String jwt)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(BASE+path).openConnection();
        c.setConnectTimeout(16000);c.setReadTimeout(25000);
        c.setRequestMethod(method);
        c.setRequestProperty("apikey",PUBLISHABLE);
        c.setRequestProperty("Accept","application/json");
        if(jwt!=null)c.setRequestProperty("Authorization","Bearer "+jwt);
        if(data!=null){
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type","application/json");
            try(OutputStream out=c.getOutputStream()){
                out.write(data.toString().getBytes(StandardCharsets.UTF_8));
            }
        }
        try{
            int status=c.getResponseCode();
            InputStream stream=status>=400?c.getErrorStream():c.getInputStream();
            String body="";
            if(stream!=null){
                try(InputStream input=stream;ByteArrayOutputStream bytes=new ByteArrayOutputStream()){
                    byte[] buf=new byte[8192];int n;
                    while((n=input.read(buf))!=-1)bytes.write(buf,0,n);
                    body=new String(bytes.toByteArray(),StandardCharsets.UTF_8);
                }
            }
            if(status>=400)throw new HttpStatus(status,body.substring(0,Math.min(body.length(),160)));
            return body;
        } finally {c.disconnect();}
    }

    private String fetchOnlineBank(String email,String password)throws Exception {
        JSONObject req=new JSONObject();req.put("email",email);req.put("password",password);
        JSONObject auth;
        try{
            auth=new JSONObject(request("POST","/auth/v1/token?grant_type=password",req,null));
        }catch(HttpStatus e){
            if(e.status==400||e.status==401||e.status==403)
                throw new SecurityException("البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب يحتاج تحققًا إضافيًا.");
            throw e;
        }
        String jwt=auth.optString("access_token","");
        JSONObject user=auth.optJSONObject("user");
        String id=user!=null?user.optString("id",""):"";
        if(jwt.isEmpty()||id.isEmpty())throw new SecurityException("تعذر التحقق من جلسة المدير.");
        JSONArray owners=new JSONArray(request("GET","/rest/v1/nabd_exam_owner?select=user_id&user_id=eq."+id,null,jwt));
        if(owners.length()!=1)throw new SecurityException("هذا الحساب غير مصرح له بدخول بوت التشريح الخاص بالمدير.");

        status("تم التحقق من المدير. جارٍ تنزيل الأسئلة الخاصة...");
        JSONArray newer=new JSONArray(),original=new JSONArray(),archived=new JSONArray();
        LinkedHashSet<String> chapters=new LinkedHashSet<>();
        LinkedHashSet<String> references=new LinkedHashSet<>();
        int rows=0;
        for(int offset=0;offset<10000;offset+=CHUNK){
            String uri="/rest/v1/nabd_exam_questions?select=content,pool,chapter&order=id.asc&limit="+CHUNK+"&offset="+offset;
            JSONArray page=new JSONArray(request("GET",uri,null,jwt));
            for(int i=0;i<page.length();i++){
                JSONObject r=page.getJSONObject(i);
                JSONObject q=r.optJSONObject("content");
                if(q==null)continue;
                String pool=r.optString("pool","original");
                String chapter=q.optString("chapter",r.optString("chapter",""));
                if(!chapter.isEmpty())chapters.add(chapter);
                String source=q.optString("source","");
                if(!source.isEmpty())references.add(source);
                if("new".equals(pool))newer.put(q);
                else if("archived".equals(pool))archived.put(q);
                else original.put(q);
                rows++;
            }
            status("تم تحميل "+rows+" سؤالًا...");
            if(page.length()<CHUNK)break;
        }
        if(rows<1)throw new SecurityException("لم يُسمح بتحميل بنك الأسئلة الخاص. تأكد من صلاحيات المدير.");
        JSONObject result=new JSONObject();
        result.put("new",newer);result.put("original",original);result.put("archived",archived);
        JSONArray ch=new JSONArray();
        for(String value:chapters){
            JSONObject c=new JSONObject();c.put("id",value);c.put("en",value);c.put("ar",value);ch.put(c);
        }
        JSONArray ref=new JSONArray();
        for(String value:references){
            JSONObject item=new JSONObject();item.put("name",value);ref.put(item);
        }
        result.put("chapters",ch);result.put("references",ref);
        return result.toString();
    }

    // PBKDF2 password-derived AES-256-GCM: never retain user password, OAuth token,
    // or plaintext question bank in the device filesystem or public repository.
    private SecretKey key(char[] password,byte[] salt)throws Exception{
        PBEKeySpec spec=new PBEKeySpec(password,salt,180000,256);
        try {
            byte[] bytes=SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            return new SecretKeySpec(bytes,"AES");
        } finally {spec.clearPassword();}
    }

    private void encryptToDevice(String email,String password,String json)throws Exception{
        SecureRandom rng=new SecureRandom();
        byte[] salt=new byte[16],nonce=new byte[12];
        rng.nextBytes(salt);rng.nextBytes(nonce);
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE,key(password.toCharArray(),salt),new GCMParameterSpec(128,nonce));
        cipher.updateAAD(email.getBytes(StandardCharsets.UTF_8));
        byte[] encrypted=cipher.doFinal(json.getBytes(StandardCharsets.UTF_8));
        File tmp=new File(getFilesDir(),BANK_FILE+".tmp");
        try(FileOutputStream f=new FileOutputStream(tmp)){
            f.write(new byte[]{'N','A','B','2'});f.write(salt);f.write(nonce);f.write(encrypted);f.getFD().sync();
        }
        File dst=new File(getFilesDir(),BANK_FILE);
        if(!tmp.renameTo(dst)) {
            // On some devices replacing an existing file needs explicit deletion.
            if(dst.exists()&&!dst.delete())throw new IOException("تعذر تحديث النسخة المحلية.");
            if(!tmp.renameTo(dst))throw new IOException("تعذر حفظ نسخة الأسئلة.");
        }
        getSharedPreferences("offline_auth_v2",MODE_PRIVATE).edit().putString("director_email",email).apply();
    }

    private String decryptFromDevice(String email,String password)throws Exception{
        String saved=getSharedPreferences("offline_auth_v2",MODE_PRIVATE).getString("director_email","");
        if(!email.equalsIgnoreCase(saved))throw new SecurityException("البريد لا يطابق حساب المدير.");
        File file=new File(getFilesDir(),BANK_FILE);
        if(!file.exists())throw new IOException("لا توجد نسخة محفوظة بعد.");
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        try(FileInputStream input=new FileInputStream(file)){
            byte[] chunk=new byte[8192];int n;while((n=input.read(chunk))!=-1)bytes.write(chunk,0,n);
        }
        byte[] all=bytes.toByteArray();
        if(all.length<40||all[0]!='N'||all[1]!='A'||all[2]!='B'||all[3]!='2')throw new IOException("ملف نسخة الأسئلة غير صالح.");
        byte[] salt=new byte[16],nonce=new byte[12];
        System.arraycopy(all,4,salt,0,16);System.arraycopy(all,20,nonce,0,12);
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE,key(password.toCharArray(),salt),new GCMParameterSpec(128,nonce));
        cipher.updateAAD(email.getBytes(StandardCharsets.UTF_8));
        byte[] clear=cipher.doFinal(all,32,all.length-32);
        return new String(clear,StandardCharsets.UTF_8);
    }

    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_FILE&&chooser!=null){
            chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
            chooser=null;
        }
        if(request==PICK_SLIDES&&result==RESULT_OK&&data!=null&&data.getData()!=null){
            try {
                File target=new File(getFilesDir(),"slides_"+slideChapter+".pdf");
                try(InputStream input=getContentResolver().openInputStream(data.getData());
                    FileOutputStream out=new FileOutputStream(target)){
                    if(input==null)throw new IOException("تعذر قراءة ملف السلايدات.");
                    byte[] bytes=new byte[16384];int n;long total=0;
                    while((n=input.read(bytes))!=-1){
                        total+=n;
                        if(total>160L*1024*1024)throw new IOException("حجم السلايدات يتجاوز 160 ميجابايت.");
                        out.write(bytes,0,n);
                    }
                }catch(Exception e){target.delete();throw e;}
                getSharedPreferences("nabd-anatomy-slides",MODE_PRIVATE).edit()
                    .putString(slideKey(slideChapter),target.getAbsolutePath()).apply();
                showPdfForChapter(slideChapter);
            }catch(Exception e){
                showPdfForChapter(slideChapter);
                card("⚠ لم يُحفظ الملف: "+e.getMessage());
            }
        }
    }
    @Override public void onBackPressed(){
        if(browser!=null&&browser.canGoBack())browser.goBack();
        else if(!questions.isEmpty()){closePdf();showNativeHome();}
        else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
        availableBank=null;closePdf();
        if(browser!=null){browser.removeJavascriptInterface("NABDApp");browser.destroy();browser=null;}
        super.onDestroy();
    }
}
