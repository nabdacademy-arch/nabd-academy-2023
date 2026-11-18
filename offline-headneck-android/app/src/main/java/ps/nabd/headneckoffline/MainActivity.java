package ps.nabd.headneckoffline;

import android.app.Activity;
import android.view.View;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.RadioButton;
import android.content.ActivityNotFoundException;
import android.net.Uri;
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
    private int examCorrect=0,examWrong=0,examUngraded=0;
    private boolean examMode=false,questionSubmitted=false;
    private String activeJwt=null,activeDirectorEmail="",chosenChapter="all",chosenPool="all";
    private SecretKey activeBankKey=null;
    private byte[] activeBankSalt=null;
    private int lessonIndex=0;
    private String pdfForChapter="";
    private static final int PICK_PDF=2733;
    private int practiceCount=20;

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

    private String statusLabel(JSONObject q){
        String v=q.optString("answerVerified","not_verified");
        if("externally_checked".equals(v))return "✅ إجابة خضعت لمراجعة إضافية";
        if("curated_fact".equals(v))return "🟢 تدريب مبني على حقيقة منتقاة";
        if("source_key".equals(v))return "🟠 إجابة من مفتاح المصدر؛ لم تُراجع مستقلًا";
        return "⚪ بلا مفتاح إجابة موثوق - غير محسوب";
    }
    private boolean hasKey(JSONObject q){
        int ans=q.optInt("answer",-1);
        JSONArray list=q.optJSONArray("opts");
        return !q.isNull("answer")&&list!=null&&ans>=0&&ans<list.length()
          &&!"not_verified".equals(q.optString("answerVerified",""));
    }
    private String chapterLabel(String chapter){
        if(!english){
            switch(chapter){
                case "Skull":return "الجمجمة";
                case "ScalpFace":return "فروة الرأس والوجه";
                case "Neck":return "الرقبة";
                case "Orbit":return "الحجاج والعين";
                case "EarMandible":return "الأذن والفك السفلي";
                case "Oral":return "جوف الفم والغدد اللعابية";
                case "TonguePharynx":return "اللسان والبلعوم";
                case "Larynx":return "الحنجرة والرغامى";
                case "Nose":return "الأنف والجيوب الأنفية";
                case "Mixed":return "امتحانات تاريخية متنوعة";
            }
        }
        if(nativeBank!=null){
            JSONArray c=nativeBank.optJSONArray("chapters");
            if(c!=null)for(int i=0;i<c.length();i++){
                JSONObject o=c.optJSONObject(i);
                if(o!=null&&chapter.equals(o.optString("id")))return o.optString(english?"en":"ar",chapter);
            }
        }
        return chapter;
    }
    private String questionText(JSONObject q){
        if(english)return q.optString("q","سؤال بدون نص");
        String ar=q.optString("qAr","");
        return ar.trim().isEmpty()?q.optString("q","سؤال بدون نص"):ar;
    }
    private JSONArray options(JSONObject q){
        JSONArray en=q.optJSONArray("opts"),ar=q.optJSONArray("optsAr");
        return !english&&ar!=null&&en!=null&&ar.length()==en.length()?ar:en;
    }
    private String explanation(JSONObject q){
        String a=q.optString(english?"why":"whyAr","");
        return a.trim().isEmpty()?q.optString("why",""):a;
    }
    private String id(JSONObject q){return q.optString("id",String.valueOf(q.hashCode()));}
    private void goBottom(){if(pageScroll!=null)pageScroll.post(()->pageScroll.fullScroll(View.FOCUS_DOWN));}
    private void menu(){
        action("🏠 الرئيسية",this::showNativeHome);
        action(english?"🌐 العربية":"🌐 English",()->{english=!english;showNativeHome();});
    }
    private int reviewedCount(){
        int n=0;for(JSONObject q:questions)if(hasKey(q))n++;return n;
    }
    private int translatedCount(){
        int n=0;for(JSONObject q:questions)if(q.optString("qAr","").trim().length()>0) n++;return n;
    }
    private int explainedCount(){
        int n=0;for(JSONObject q:questions)if(!q.optString("why","").trim().isEmpty())n++;return n;
    }
    private void showNativeHome(){
        newPage("🧠 NABD • Head & Neck","مدير أكاديمية نبض • النسخة الخاصة • دراسة دون إنترنت");
        card("📚 "+questions.size()+" سؤالًا  |  🔑 "+reviewedCount()+" بمفتاح إجابة\n🌐 "+translatedCount()+" بترجمة عربية  |  💡 "+explainedCount()+" بشرح\n\nالمحتوى مطابق للبنك المخزن لهذا الحساب. بعض أسئلة المصادر التاريخية غير مصححة.");
        action("📖 جميع الأسئلة + الإجابات",()->showNativeList("",0));
        action("🎓 قيّم مستواي • اختبار بدرجة",this::showTrainingSetup);
        action("⚡ تدرب على شابتر / الأخطاء",this::showPracticeSetup);
        action("🖼 شرائح شرح الشابترات",this::showChapters);
        action("🤖 اسأل بوت التشريح",this::showNativeSearch);
        action("🎯 سجل أخطائي",this::showNativeWrong);
        action("📎 المصادر العلمية",this::showNativeSources);
        action(english?"🌐 العربية":"🌐 English",()->{english=!english;showNativeHome();});
        action("🔒 تسجيل خروج",()->{
            activeJwt=null;activeBankKey=null;nativeBank=null;questions.clear();
            session.clear();availableBank=null;showNativeLogin();
        });
    }
    private boolean matches(JSONObject q,String search){
        if(!"all".equals(chosenChapter)&&!chosenChapter.equals(q.optString("chapter","")))return false;
        if(!"all".equals(chosenPool)&&!chosenPool.equals(q.optString("kind",""))
            &&!(chosenPool.equals("original")&&q.optString("id","").startsWith("AYAM"))
            &&!(chosenPool.equals("archived")&&q.optString("id","").startsWith("ARCH"))
            &&!(chosenPool.equals("generated")&&q.optString("id","").startsWith("NEW")))return false;
        if(search==null||search.trim().isEmpty())return true;
        String hay=(q.optString("q","")+" "+q.optString("qAr","")+" "+
            q.optString("chapter","")+" "+q.optString("why","")+" "+q.optString("source","")).toLowerCase(Locale.ROOT);
        for(String token:search.toLowerCase(Locale.ROOT).trim().split("\\s+"))
            if(token.length()>1&&!hay.contains(token))return false;
        return true;
    }
    private void showNativeList(String search,int offset){
        bankOffset=offset;
        ArrayList<JSONObject> subset=new ArrayList<>();
        for(JSONObject q:questions)if(matches(q,search))subset.add(q);
        int start=Math.min(offset,subset.size()),end=Math.min(start+12,subset.size());
        newPage("📖 بنك أسئلة التشريح", "عرض "+(subset.isEmpty()?0:start+1)+"–"+end+" من "+subset.size());
        action("🏠 الرئيسية",this::showNativeHome);
        EditText query=edit("ابحث باسم العصب أو العظم أو المصطلح",false);
        query.setInputType(InputType.TYPE_CLASS_TEXT);
        if(search!=null)query.setText(search);
        action("🔎 بحث",()->showNativeList(query.getText().toString(),0));
        action("🧩 تصفية حسب الشابتر",this::showChapterFilter);
        action("🌐 تبديل عربي / English",()->{english=!english;showNativeList(search,offset);});
        if(subset.isEmpty())card("لا توجد أسئلة مطابقة. جرّب مسح البحث أو الفلاتر.");
        for(int i=start;i<end;i++){
            JSONObject q=subset.get(i);
            card((i+1)+". "+questionText(q)+"\n"+statusLabel(q));
            action("📖 الحل والشرح",()->showNativeQuestion(q,()->showNativeList(search,offset),false));
        }
        if(end<subset.size())action("الصفحة التالية ◀",()->showNativeList(search,offset+12));
        if(start>0)action("▶ الصفحة السابقة",()->showNativeList(search,Math.max(0,offset-12)));
    }
    private void showChapterFilter(){
        newPage("🧩 تصفية بنك الأسئلة","اختر شابتر أو اعرض الجميع");
        action("الكل",()->{chosenChapter="all";showNativeList("",0);});
        if(nativeBank!=null){
            JSONArray arr=nativeBank.optJSONArray("chapters");
            if(arr!=null)for(int i=0;i<arr.length();i++){
                JSONObject chapter=arr.optJSONObject(i);
                if(chapter==null)continue;
                String cid=chapter.optString("id","");
                action(chapterLabel(cid),()->{chosenChapter=cid;showNativeList("",0);});
            }
        }
    }
    private void recordResult(JSONObject q,boolean correct){
        getSharedPreferences("nabd-anatomy-progress-v4",MODE_PRIVATE)
            .edit().putString(id(q),correct?"correct":"wrong").apply();
    }
    private String answerText(JSONObject q,JSONArray choices){
        if(!hasKey(q))return "⚠ هذا السؤال لم تُثبت له إجابة موثوقة، لذا لا أصحّحه آليًا.";
        int answer=q.optInt("answer",-1);
        String a=choices.optString(answer);
        String why=explanation(q);
        return "✅ الإجابة: "+(char)('A'+answer)+". "+a+"\n"
            +statusLabel(q)+(why.isEmpty()?"\n💡 لا يوجد شرح علمي محفوظ لهذا السؤال.":"\n\n💡 السبب:\n"+why)
            +"\n\n📚 المصدر: "+q.optString("source","غير محدد");
    }
    private void showNativeQuestion(JSONObject q,Runnable next,boolean grade){
        newPage("📚 سؤال التشريح", chapterLabel(q.optString("chapter",""))+" • "+statusLabel(q));
        card(questionText(q));
        final JSONArray choices=options(q);
        if(choices==null){card("لا توجد خيارات محفوظة لهذا السؤال.");action("العودة",next);return;}
        if(!english&&q.optString("qAr","").isEmpty()){
            card("🌐 الترجمة العربية لهذا السؤال غير محفوظة. ستظهر الإنجليزية الأصلية.");
            if(activeJwt!=null)action("🌐 ترجمة السؤال والخيارات الآن (تحتاج إنترنت)",()->translateQuestion(q,next,grade));
        }
        final RadioGroup group=new RadioGroup(this);
        group.setOrientation(RadioGroup.VERTICAL);
        for(int i=0;i<choices.length();i++){
            RadioButton radio=new RadioButton(this);
            radio.setId(4100+i);
            radio.setButtonTintList(android.content.res.ColorStateList.valueOf(mint));
            radio.setText((char)('A'+i)+". "+choices.optString(i));
            radio.setTextColor(ink);radio.setTextSize(16);
            radio.setPadding(px(10),px(9),px(10),px(9));
            radio.setBackground(fill(panel,Color.rgb(35,80,100)));
            LinearLayout.LayoutParams item=new LinearLayout.LayoutParams(-1,-2);
            item.setMargins(0,px(4),0,px(4));group.addView(radio,item);
        }
        rootView.addView(group);
        TextView response=text("اختر إجابتك ثم اضغط تأكيد، أو اكشف الإجابة والشرح مباشرة.",15);
        response.setTextColor(ink);response.setPadding(px(13),px(12),px(13),px(12));
        response.setBackground(fill(panel,Color.rgb(35,80,100)));
        final boolean[] submitted={false};
        action("✅ تأكيد إجابتي",()->{
            if(submitted[0])return;
            int selected=group.getCheckedRadioButtonId()-4100;
            if(selected<0||selected>=choices.length()){response.setText("⚠ اختر إجابة أولًا.");return;}
            submitted[0]=true;group.setEnabled(false);
            for(int i=0;i<group.getChildCount();i++)group.getChildAt(i).setEnabled(false);
            if(!hasKey(q)){
                if(grade)examUngraded++;
                response.setText(answerText(q,choices));
            }else{
                boolean ok=selected==q.optInt("answer",-1);
                recordResult(q,ok);
                if(grade){if(ok)examCorrect++;else examWrong++;}
                response.setText((ok?"✅ إجابة صحيحة\n\n":"❌ إجابة خاطئة\n\n")+answerText(q,choices));
            }
            goBottom();
        });
        action("🗝 إظهار الإجابة والشرح دون احتساب درجة",()->{
            response.setText(answerText(q,choices));goBottom();
        });
        rootView.addView(response);
        action("🌐 العربية / English",()->{english=!english;showNativeQuestion(q,next,false);});
        action("➡️ التالي / العودة",next);
    }
    private void translateQuestion(JSONObject q,Runnable next,boolean grade){
        if(activeJwt==null){Toast.makeText(this,"يجب توفر الإنترنت وتسجيل دخول حديث للترجمة",Toast.LENGTH_LONG).show();return;}
        newPage("🌐 ترجمة علمية", "جارٍ الاتصال بخدمة ترجمة الأسئلة الخاصة...");
        card("عند اكتمال الترجمة ستظهر صياغة السؤال وخياراته بالعربية. لا تُعدّ الترجمة الآلية بديلًا عن المراجعة الطبية.");
        new Thread(()->{
            try{
                JSONObject body=new JSONObject();body.put("question_id",id(q));
                JSONObject result=new JSONObject(request("POST","/functions/v1/nabd-exam-translate",body,activeJwt));
                String ar=result.optString("qAr","");
                JSONArray opts=result.optJSONArray("optsAr");
                if(!result.optBoolean("ok",false)||ar.isEmpty()||opts==null||opts.length()!=q.getJSONArray("opts").length())
                    throw new IOException("الترجمة غير متاحة في الخدمة حاليًا.");
                q.put("qAr",ar);q.put("optsAr",opts);
                persistCurrentBank();
                runOnUiThread(()->{english=false;showNativeQuestion(q,next,grade);});
            }catch(Exception ex){
                runOnUiThread(()->{
                    card("⚠ تعذرت الترجمة الآن: "+ex.getMessage());
                    action("العودة إلى السؤال",()->showNativeQuestion(q,next,grade));
                });
            }
        },"nabd-anatomy-translate").start();
    }
    private void showTrainingSetup(){showSetup(true);}
    private void showPracticeSetup(){showSetup(false);}
    private void showSetup(boolean graded){
        newPage(graded?"🎓 قيّم مستواي":"⚡ خطة تدريب خاصة", "اختر فصلًا وعدد أسئلة، ثم ابدأ");
        card(graded?"امتحان بدرجة نهائية، مع توضيح الإجابات الموثوقة وغير المصححة.":"تدريب على الشابتر أو الأخطاء السابقة مع شرح كل إجابة.");
        action("🧩 اختيار الشابتر: "+("all".equals(chosenChapter)?"الكل":chapterLabel(chosenChapter)),()->showSetupChapters(graded));
        action("📚 المصدر: "+chosenPool,()->{
            chosenPool=chosenPool.equals("all")?"generated":chosenPool.equals("generated")?"original":chosenPool.equals("original")?"archived":"all";
            showSetup(graded);
        });
        action("🔢 عدد الأسئلة: "+practiceCount,()->{
            practiceCount=practiceCount==10?20:practiceCount==20?40:practiceCount==40?80:10;
            showSetup(graded);
        });
        action("▶️ ابدأ "+(graded?"الامتحان":"التدريب"),()->startNativeQuiz(graded,false));
        action("🎯 تدريب على أخطائي فقط",()->startNativeQuiz(graded,true));
        action("🏠 الرئيسية",this::showNativeHome);
    }
    private void showSetupChapters(boolean graded){
        newPage("🧩 اختر الشابتر","يمكنك اختيار فصل محدد أو جميع الفصول");
        action("جميع الشابترات",()->{chosenChapter="all";showSetup(graded);});
        if(nativeBank!=null){
            JSONArray arr=nativeBank.optJSONArray("chapters");
            if(arr!=null)for(int i=0;i<arr.length();i++){
                JSONObject c=arr.optJSONObject(i);if(c==null)continue;
                String cid=c.optString("id","");
                action(chapterLabel(cid),()->{chosenChapter=cid;showSetup(graded);});
            }
        }
    }
    private void startNativeQuiz(boolean graded,boolean mistakesOnly){
        examMode=graded;examCorrect=0;examWrong=0;examUngraded=0;
        session.clear();ArrayList<Integer> indexes=new ArrayList<>();
        for(int i=0;i<questions.size();i++){
            JSONObject q=questions.get(i);
            if(!matches(q,""))continue;
            if(mistakesOnly&&!getSharedPreferences("nabd-anatomy-progress-v4",MODE_PRIVATE).getString(id(q),"").equals("wrong"))continue;
            indexes.add(i);
        }
        Collections.shuffle(indexes);
        for(int i=0;i<Math.min(practiceCount,indexes.size());i++)session.add(indexes.get(i));
        sessionIndex=0;
        if(session.isEmpty()){
            newPage("⚠ لا توجد أسئلة","لا توجد أسئلة مطابقة لهذه الخيارات.");
            action("تغيير الإعدادات",()->showSetup(graded));return;
        }
        nativeQuizQuestion();
    }
    private void nativeQuizQuestion(){
        if(sessionIndex>=session.size()){showExamResults();return;}
        JSONObject q=questions.get(session.get(sessionIndex));
        showNativeQuestion(q,()->{sessionIndex++;nativeQuizQuestion();},true);
        card("🔢 السؤال "+(sessionIndex+1)+" / "+session.size()+" • "+(examMode?"محاكي":"تدريب"));
    }
    private void showExamResults(){
        int scored=examCorrect+examWrong;
        int percent=scored==0?0:(100*examCorrect/scored);
        newPage("🏆 تقييم الجلسة",examMode?"النتيجة النهائية للمحاكي":"ملخص التدريب");
        card("✅ صحيح: "+examCorrect+"\n❌ خطأ: "+examWrong+"\n⚪ غير محسوب: "+examUngraded+"\n📊 الدقة من الأسئلة المصححة: "+percent+"%");
        if(scored==0)card("لم تتوفر إجابات موثوقة كافية لحساب درجة هذه الجلسة.");
        else if(percent>=85)card("ممتاز! انتقل إلى أسئلة أصعب ومراجعة الأخطاء المتبقية.");
        else if(percent>=65)card("جيد، ركّز على الأسئلة التي أخطأت بها، ثم أعد الاختبار.");
        else card("راجع شرح الشابتر أولًا ثم تدرب على الأخطاء.");
        action("🎯 راجع الأخطاء",this::showNativeWrong);
        action("🔁 اختبار جديد",()->showSetup(examMode));
        action("🏠 الرئيسية",this::showNativeHome);
    }
    private ArrayList<JSONObject> slidesOf(String chapter){
        ArrayList<JSONObject> slides=new ArrayList<>();
        LinkedHashSet<String> seen=new LinkedHashSet<>();
        for(JSONObject q:questions){
            if(!chapter.equals(q.optString("chapter","")))continue;
            if(!hasKey(q)||q.optString("why","").trim().length()<10)continue;
            if(!q.optString("kind","").equals("generated"))continue;
            String fact=q.optString("factRef",id(q));
            if(seen.add(fact))slides.add(q);
        }
        // Historical questions are included only as documented question cards, not invented lessons.
        if(slides.isEmpty())for(JSONObject q:questions){
            if(chapter.equals(q.optString("chapter",""))&&hasKey(q)&&!q.optString("why","").isEmpty()){
                slides.add(q);if(slides.size()>=30)break;
            }
        }
        return slides;
    }
    private void showChapters(){
        newPage("🖼 سلايدات شرح الشابترات","شرائح مراجعة مُشتقة من تفسيرات الأسئلة، وليست ملفات محاضرات أصلية");
        action("🏠 الرئيسية",this::showNativeHome);
        JSONArray chapters=nativeBank==null?null:nativeBank.optJSONArray("chapters");
        if(chapters==null)return;
        for(int i=0;i<chapters.length();i++){
            JSONObject c=chapters.optJSONObject(i);if(c==null)continue;
            String chapter=c.optString("id","");
            int total=0;for(JSONObject q:questions)if(chapter.equals(q.optString("chapter","")))total++;
            card("📚 "+chapterLabel(chapter)+" • "+total+" سؤالًا\n🖼 "+slidesOf(chapter).size()+" شريحة مراجعة مبنية على الشروحات");
            action("📖 شرح وسلايدات "+chapterLabel(chapter),()->showChapterSlide(chapter,0));
            action("📎 ملفات PDF لهذا الشابتر",()->showChapterDocuments(chapter));
            action("⚡ تدرب على هذا الشابتر",()->{
                chosenChapter=chapter;chosenPool="all";showSetup(false);
            });
        }
    }
    private void showChapterSlide(String chapter,int number){
        ArrayList<JSONObject> slides=slidesOf(chapter);
        newPage("🖼 شرح "+chapterLabel(chapter),
            slides.isEmpty()?"لا توجد شرائح مدقّقة":"الشريحة "+(number+1)+" من "+slides.size());
        action("📚 جميع الشابترات",this::showChapters);
        if(slides.isEmpty()){card("لم يتوفر شرح معتمد في البنك لهذا الشابتر.");return;}
        JSONObject q=slides.get(Math.max(0,Math.min(number,slides.size()-1)));
        card("🎯 الفكرة التشريحية\n"+questionText(q));
        if(hasKey(q)){
            int ans=q.optInt("answer",-1);JSONArray opts=options(q);
            if(opts!=null&&ans>=0&&ans<opts.length())card("✅ المعلومة الأساسية\n"+opts.optString(ans));
        }
        card("💡 الشرح العلمي من بنك الأسئلة:\n"+explanation(q));
        card("📚 المصدر: "+q.optString("source","")+"\n"+statusLabel(q));
        action("📝 حل سؤال هذه الشريحة",()->showNativeQuestion(q,()->showChapterSlide(chapter,number),false));
        action("🌐 العربية / English",()->{english=!english;showChapterSlide(chapter,number);});
        if(number>0)action("▶ السابقة",()->showChapterSlide(chapter,number-1));
        if(number+1<slides.size())action("التالية ◀",()->showChapterSlide(chapter,number+1));
    }
    private void showChapterDocuments(String chapter){
        newPage("📎 ملفات وسلايدات الشابتر",chapterLabel(chapter));
        card("يمكنك إضافة ملف PDF الأصلي من هاتفك؛ سيبقى متاحًا دون اتصال إذا ظل الملف على الجهاز. هذه الملفات غير مضمَّنة تلقائيًا، لأنها لم تكن ضمن بنك الأسئلة.");
        pdfForChapter=chapter;
        action("📥 ربط ملف شرح PDF من الهاتف",()->{
            Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.setType("application/pdf");intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
            startActivityForResult(intent,PICK_PDF);
        });
        String saved=getSharedPreferences("nabd-chapter-pdfs",MODE_PRIVATE).getString("pdf-"+chapter,"");
        if(!saved.isEmpty())action("📄 افتح السلايدات المحفوظة",()->{
            try{
                Intent it=new Intent(Intent.ACTION_VIEW);
                it.setDataAndType(Uri.parse(saved),"application/pdf");
                it.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(it);
            }catch(ActivityNotFoundException err){
                card("لا يوجد تطبيق PDF لفتح الملف على هذا الهاتف.");
            }
        });
        action("🖼 الشرائح التعليمية",()->showChapterSlide(chapter,0));
        action("🏠 الرئيسية",this::showNativeHome);
    }
    private void showNativeSearch(){
        newPage("🤖 مساعد التشريح الخاص","بحث داخل بنك الأسئلة لا يختلق معلومات من خارج المصادر");
        action("🏠 الرئيسية",this::showNativeHome);
        EditText term=edit("مثال: facial nerve / foramen ovale",false);
        term.setInputType(InputType.TYPE_CLASS_TEXT);
        action("🔎 ابحث وفسّر",()->{
            String key=term.getText().toString().trim();
            if(!key.isEmpty()){chosenChapter="all";chosenPool="all";showNativeList(key,0);}
        });
        card("المساعد يعمل دون إنترنت بالبحث عن المصطلحات داخل الأسئلة والخيارات والشروح المحفوظة.");
    }
    private void showNativeWrong(){
        newPage("🎯 مراجعة أخطائي","أسئلة بحاجة إلى مراجعة إضافية");
        action("🏠 الرئيسية",this::showNativeHome);
        ArrayList<JSONObject> wrong=new ArrayList<>();
        for(JSONObject q:questions)
            if(getSharedPreferences("nabd-anatomy-progress-v4",MODE_PRIVATE).getString(id(q),"").equals("wrong"))
                wrong.add(q);
        card("أخطاؤك المسجلة: "+wrong.size());
        for(int i=0;i<Math.min(wrong.size(),45);i++){
            JSONObject q=wrong.get(i);card(questionText(q));
            action("📚 راجع الحل والشرح",()->showNativeQuestion(q,this::showNativeWrong,false));
        }
        action("⚡ أعد التدريب على أخطائي",()->{
            chosenChapter="all";chosenPool="all";startNativeQuiz(false,true);
        });
    }
    private void showNativeSources(){
        newPage("📎 المصادر العلمية","المصادر المسجَّلة مع بنك أسئلة التشريح");
        action("🏠 الرئيسية",this::showNativeHome);
        if(nativeBank==null)return;
        JSONArray refs=nativeBank.optJSONArray("references");
        if(refs==null)return;
        for(int i=0;i<refs.length();i++){
            JSONObject ref=refs.optJSONObject(i);
            if(ref!=null)card("📚 "+ref.optString("name","Reference")+"\n"+ref.optString("note",""));
        }
    }
    private void persistCurrentBank(){
        if(activeBankKey==null||activeBankSalt==null||nativeBank==null)return;
        try{
            SecureRandom rng=new SecureRandom();byte[] nonce=new byte[12];rng.nextBytes(nonce);
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE,activeBankKey,new GCMParameterSpec(128,nonce));
            cipher.updateAAD(activeDirectorEmail.getBytes(StandardCharsets.UTF_8));
            byte[] encrypted=cipher.doFinal(nativeBank.toString().getBytes(StandardCharsets.UTF_8));
            File tmp=new File(getFilesDir(),BANK_FILE+".tmp");
            try(FileOutputStream stream=new FileOutputStream(tmp)){
                stream.write(new byte[]{'N','A','B','2'});stream.write(activeBankSalt);stream.write(nonce);stream.write(encrypted);
                stream.getFD().sync();
            }
            File dest=new File(getFilesDir(),BANK_FILE);
            if(!tmp.renameTo(dest)){if(dest.exists()&&!dest.delete())throw new IOException("Save");if(!tmp.renameTo(dest))throw new IOException("Rename");}
        }catch(Exception e){android.util.Log.w("NabdAnatomy","Could not persist translated bank");}
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
        activeJwt=jwt;

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
        activeDirectorEmail=email;activeBankSalt=salt;activeBankKey=key(password.toCharArray(),salt);
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
        activeDirectorEmail=email;activeBankSalt=salt;activeBankKey=key(password.toCharArray(),salt);activeJwt=null;
        return new String(clear,StandardCharsets.UTF_8);
    }

    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_PDF&&result==RESULT_OK&&data!=null&&data.getData()!=null){
            Uri uri=data.getData();
            try{getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
            getSharedPreferences("nabd-chapter-pdfs",MODE_PRIVATE).edit().putString("pdf-"+pdfForChapter,uri.toString()).apply();
            showChapterDocuments(pdfForChapter);
        }
        if(request==PICK_FILE&&chooser!=null){
            chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
            chooser=null;
        }
    }
    @Override public void onBackPressed(){
        if(browser!=null&&browser.canGoBack())browser.goBack();
        else if(!questions.isEmpty()){showNativeHome();}
        else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
        availableBank=null;
        if(browser!=null){browser.removeJavascriptInterface("NABDApp");browser.destroy();browser=null;}
        super.onDestroy();
    }
}
