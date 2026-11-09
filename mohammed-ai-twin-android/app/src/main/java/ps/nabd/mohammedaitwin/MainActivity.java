package ps.nabd.mohammedaitwin;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import org.json.JSONObject;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.MediaStore;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String TWIN_URL="https://nabdacademy-arch.github.io/nabd-academy-2023/mohammed-ai-twin/";
    private static final String ACADEMY_URL="https://nabdacademy-arch.github.io/nabd-academy-2023/";
    private static final int VOICE_REQUEST=202, CONTACT_REQUEST=203, NOTIFY_REQUEST=204, MIC_REQUEST=205;
    private static final int NAVY=Color.rgb(7,17,31), PANEL=Color.rgb(14,33,51);
    private static final int CYAN=Color.rgb(40,215,229), SOFT=Color.rgb(184,218,231);
    private WebView web;
    private EditText commandField;
    private TextView status;
    private boolean loaded=false;
    private String pendingSharedText=null;

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        setTitle("MOHAMMED AI TWIN");
        buildInterface();
        if(state!=null)web.restoreState(state);
        else web.loadUrl(TWIN_URL);
        ReminderReceiver.createNotificationChannel(this);
        status("جاهز. الأوامر تعمل بإذنك فقط، ولا يوجد استماع خفي.");
        reviewIncoming(getIntent());
    }
    private int dp(float n){return Math.round(getResources().getDisplayMetrics().density*n);}
    private GradientDrawable pill(int fill,int stroke,int radius){
        GradientDrawable bg=new GradientDrawable();bg.setColor(fill);bg.setCornerRadius(dp(radius));
        bg.setStroke(dp(1),stroke);return bg;
    }
    private TextView text(String label,int size,int color,boolean bold){
        TextView t=new TextView(this);
        t.setText(label);t.setTextColor(color);t.setTextSize(size);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return t;
    }
    private Button action(String text,Runnable runnable){
        Button b=new Button(this);
        b.setText(text);b.setTextColor(CYAN);b.setTextSize(12);
        b.setAllCaps(false);b.setPadding(dp(14),dp(6),dp(14),dp(6));
        b.setBackground(pill(PANEL,Color.rgb(43,98,116),13));
        b.setOnClickListener(v->runnable.run());
        return b;
    }
    private void buildInterface(){
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);root.setBackgroundColor(NAVY);
        if(Build.VERSION.SDK_INT>=30){
            root.setOnApplyWindowInsetsListener((v,insets)->{
                android.graphics.Insets bar=insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(0,bar.top,0,bar.bottom);return insets;
            });
        }
        setContentView(root);

        LinearLayout hero=new LinearLayout(this);hero.setOrientation(LinearLayout.VERTICAL);
        hero.setPadding(dp(17),dp(15),dp(17),dp(9));
        TextView heading=text("✦  MOHAMMED AI TWIN",20,CYAN,true);
        heading.setContentDescription("Mohammed AI Twin");
        TextView subtitle=text("مساعد Android شخصي · أوامر ظاهرة · موافقتك أولًا",11,SOFT,false);
        hero.addView(heading);hero.addView(subtitle);
        root.addView(hero,new LinearLayout.LayoutParams(-1,-2));

        HorizontalScrollView strip=new HorizontalScrollView(this);strip.setHorizontalScrollBarEnabled(false);
        LinearLayout commands=new LinearLayout(this);commands.setOrientation(LinearLayout.HORIZONTAL);
        commands.setPadding(dp(10),dp(8),dp(10),dp(10));
        String[] keys={"🧠 التوأم","🎙️ صوت","🎧 جلسة مستمرة","⏹ إيقاف الصوت","📲 التطبيقات","👤 جهة اتصال","☎️ اتصال","✉️ رسالة","⚙️ الإعدادات","⏰ تذكير","🌐 المتصفح"};
        Runnable[] tasks={
          ()->web.loadUrl(TWIN_URL),
          this::listenVoice,
          this::startContinuousVoice,
          this::stopContinuousVoice,
          this::showLaunchableApps,
          this::pickPhoneContact,
          ()->askNumber(false),
          ()->askNumber(true),
          ()->runIntent(new Intent(Settings.ACTION_SETTINGS)),
          this::newReminder,
          ()->openExternal(Uri.parse(TWIN_URL))
        };
        for(int i=0;i<keys.length;i++){
            Button b=action(keys[i],tasks[i]);
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(45));
            p.setMargins(dp(4),0,dp(4),0);commands.addView(b,p);
        }
        strip.addView(commands);root.addView(strip);

        LinearLayout bar=new LinearLayout(this);bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setPadding(dp(12),0,dp(12),dp(8));
        commandField=new EditText(this);
        commandField.setTextColor(Color.WHITE);commandField.setHintTextColor(Color.rgb(133,168,187));
        commandField.setSingleLine(true);
        commandField.setInputType(InputType.TYPE_CLASS_TEXT);
        commandField.setTextSize(13);
        commandField.setHint("مثال: افتح واتساب، اتصل 059...، افتح الذاكرة");
        commandField.setBackground(pill(PANEL,Color.rgb(52,84,105),12));
        commandField.setPadding(dp(11),dp(8),dp(11),dp(8));
        LinearLayout.LayoutParams fieldParams=new LinearLayout.LayoutParams(0,dp(49),1);
        fieldParams.setMargins(dp(7),0,0,0);
        bar.addView(commandField,fieldParams);
        Button execute=action("تنفيذ",()->handleCommand(commandField.getText().toString()));
        bar.addView(execute,new LinearLayout.LayoutParams(dp(76),dp(49)));
        root.addView(bar);
        status=text("",11,SOFT,false);
        status.setPadding(dp(16),0,dp(16),dp(10));
        status.setMaxLines(2);root.addView(status);

        web=new WebView(this);
        WebSettings setting=web.getSettings();
        setting.setJavaScriptEnabled(true);
        setting.setDomStorageEnabled(true);
        setting.setAllowContentAccess(false);
        setting.setAllowFileAccess(false);
        setting.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        setting.setJavaScriptCanOpenWindowsAutomatically(false);
        setting.setMediaPlaybackRequiresUserGesture(true);
        if(Build.VERSION.SDK_INT>=26)setting.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setBackgroundColor(NAVY);
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onPermissionRequest(PermissionRequest request){
                // Native voice is explicitly user launched; never grant background web capture.
                runOnUiThread(request::deny);
            }
        });
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri url=request.getUrl();
                if("https".equalsIgnoreCase(url.getScheme())
                  &&"nabdacademy-arch.github.io".equalsIgnoreCase(url.getHost())
                  &&url.getPath()!=null &&url.getPath().startsWith("/nabd-academy-2023/mohammed-ai-twin/")){
                    return false;
                }
                if("https".equalsIgnoreCase(url.getScheme())){
                    openExternal(url);
                }else{
                    status("الرابط غير مدعوم داخل التطبيق؛ افتحه بنفسك إذا كنت تثق به.");
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){
                loaded=true;status("واجهة التوأم جاهزة. استخدم الأزرار لفتح تطبيقات Android المسموحة.");
                insertReviewedShareIntoChat();
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,android.webkit.WebResourceError error){
                if(request.isForMainFrame())status("تعذر فتح الموقع. تحقق من الاتصال بالإنترنت.");
            }
        });
        LinearLayout.LayoutParams page=new LinearLayout.LayoutParams(-1,0,1);
        root.addView(web,page);
    }
    private void status(String message){
        if(status!=null)status.setText(message);
    }
    private void notify(String message){
        status(message);
        Toast.makeText(this,message,Toast.LENGTH_LONG).show();
    }
    private void runIntent(Intent intent){
        try{startActivity(intent);}
        catch(ActivityNotFoundException|SecurityException e){notify("لا يوجد تطبيق مسموح للتعامل مع هذا الطلب.");}
    }
    private void openExternal(Uri url){
        if(!"https".equalsIgnoreCase(url.getScheme())){notify("يُسمح بفتح روابط HTTPS فقط.");return;}
        runIntent(new Intent(Intent.ACTION_VIEW,url));
    }
    private void listenVoice(){
        // System-operated, one-shot microphone UI. No RECORD_AUDIO permission or hidden recording.
        Intent speech=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speech.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        speech.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"ar-PS");
        speech.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
        speech.putExtra(RecognizerIntent.EXTRA_PROMPT,"تحدث بأمر واضح؛ الاستماع يتوقف عند انتهاء هذا الطلب");
        try{startActivityForResult(speech,VOICE_REQUEST);}
        catch(ActivityNotFoundException e){notify("لا يوجد محرك تعرّف صوتي على هذا الهاتف. استعمل مربع الكتابة.");}
    }
    private void startContinuousVoice(){
        if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){
            if(Build.VERSION.SDK_INT>=33)
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.POST_NOTIFICATIONS},MIC_REQUEST);
            else requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO},MIC_REQUEST);
            return;
        }
        new AlertDialog.Builder(this)
            .setTitle("تشغيل استماع صوتي مستمر بإذنك")
            .setMessage("سيعمل الميكروفون عبر خدمة أمامية بإشعار Android ظاهر وزر إيقاف. قد يعالج مزوّد التعرف الصوتي على الجهاز أو عبر الإنترنت الصوت. الأوامر تُعرض عليك للموافقة، ولن تُنفذ تلقائيًا أثناء إغلاق التطبيق. قد يوقف النظام الجلسة لتوفير الطاقة. هل توافق؟")
            .setPositiveButton("تشغيل", (d,w)->{
                try{
                    Intent intent=new Intent(this,VoiceListeningService.class)
                      .setAction(VoiceListeningService.ACTION_START);
                    startForegroundService(intent);
                    notify("بدأ استماع مرئي بإشعار دائم. اضغط إيقاف متى أردت.");
                }catch(Exception e){notify("تعذر تشغيل خدمة الاستماع على هذا الجهاز.");}
            })
            .setNegativeButton("إلغاء",null).show();
    }
    private void stopContinuousVoice(){
        stopService(new Intent(this,VoiceListeningService.class));
        notify("تم إيقاف الاستماع المستمر وطلب تحرير الميكروفون.");
    }
    private void reviewIncoming(Intent intent){
        if(intent==null)return;
        if(Intent.ACTION_SEND.equals(intent.getAction())){
            // Deliberate share-target workflow: user chooses the text in another app.
            // No background access, clipboard scraping or automatic AI submission.
            if("text/plain".equals(intent.getType())){
                CharSequence supplied=intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
                intent.removeExtra(Intent.EXTRA_TEXT);
                if(supplied!=null){
                    String text=supplied.toString().trim();
                    if(!text.isEmpty()){
                        final String safeText=text.length()>2000?text.substring(0,2000):text;
                        String preview=safeText.length()>230?safeText.substring(0,230)+"…":safeText;
                        new AlertDialog.Builder(this)
                            .setTitle("مشاركة نص مع التوأم الرقمي")
                            .setMessage("أنت اخترت مشاركة هذا النص من تطبيق آخر:\n\n"+
                                preview+"\n\nسيُضاف إلى مربع المحادثة فقط، ولن يُرسل للذكاء الاصطناعي إلا إذا ضغطت إرسال بنفسك.")
                            .setPositiveButton("إدراج النص",(d,w)->{
                                pendingSharedText=safeText;
                                insertReviewedShareIntoChat();
                            })
                            .setNegativeButton("إلغاء",null).show();
                    }
                }
            }
            return;
        }
        String phrase=intent.getStringExtra(VoiceListeningService.EXTRA_COMMAND);
        if(phrase==null||phrase.isBlank())return;
        intent.removeExtra(VoiceListeningService.EXTRA_COMMAND);
        new AlertDialog.Builder(this)
           .setTitle("أمر صوتي يحتاج موافقتك")
           .setMessage("التقط التوأم: «"+phrase+"»\nهل تريد تنفيذ هذا الأمر؟")
           .setPositiveButton("تأكيد وتنفيذ",(d,w)->handleCommand(phrase))
           .setNegativeButton("إلغاء",null).show();
    }
    @Override protected void onNewIntent(Intent intent){
        super.onNewIntent(intent);
        setIntent(intent);
        reviewIncoming(intent);
    }
    private void insertReviewedShareIntoChat(){
        if(pendingSharedText==null||pendingSharedText.isBlank())return;
        if(web==null||!loaded){status("تمت الموافقة على النص. سيتم إدراجه بعد تحميل التوأم.");return;}
        String current=web.getUrl();
        Uri location=Uri.parse(current==null?"":current);
        if(!"https".equalsIgnoreCase(location.getScheme()) ||
          !"nabdacademy-arch.github.io".equalsIgnoreCase(location.getHost()) ||
          location.getPath()==null ||
          !location.getPath().startsWith("/nabd-academy-2023/mohammed-ai-twin/")){
            status("اربط النص بصفحة التوأم الموثوقة أولًا.");return;
        }
        String text=pendingSharedText;
        String encoded=JSONObject.quote(text); // safely encodes external text as a JavaScript string literal.
        String script="(function(){var input=document.getElementById('chatInput');"+
          "if(!input)return 'missing';"+
          "input.value="+encoded+";"+
          "document.querySelector('[data-page=\"chat\"]')?.click();"+
          "return 'inserted';})()";
        web.evaluateJavascript(script,result->{
            if("\"inserted\"".equals(result)){
                pendingSharedText=null;
                status("تم إدراج النص للمراجعة. اضغط «إرسال» بنفسك إذا أردت.");
            }else status("النص ينتظر فتح صفحة التوأم ثم يمكنك إعادة إدراجه.");
        });
    }
    private void pickPhoneContact(){
        Intent pick=new Intent(Intent.ACTION_PICK);
        pick.setType(ContactsContract.CommonDataKinds.Phone.CONTENT_TYPE);
        try{startActivityForResult(pick,CONTACT_REQUEST);}
        catch(ActivityNotFoundException|SecurityException e){notify("تطبيق جهات الاتصال غير متاح.");}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(resultCode!=RESULT_OK||data==null)return;
        if(requestCode==VOICE_REQUEST){
            ArrayList<String> heard=data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if(heard!=null&&!heard.isEmpty()){
                commandField.setText(heard.get(0));
                handleCommand(heard.get(0));
            }
        }else if(requestCode==CONTACT_REQUEST){
            Uri selected=data.getData();
            if(selected==null)return;
            try(Cursor c=getContentResolver().query(selected,new String[]{
                 ContactsContract.CommonDataKinds.Phone.NUMBER,
                 ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
            },null,null,null)){
                if(c==null||!c.moveToFirst()){notify("تعذّر قراءة جهة الاتصال التي اخترتها.");return;}
                String number=c.getString(0);
                String name=c.getString(1);
                new AlertDialog.Builder(this)
                  .setTitle(name==null?"جهة الاتصال":name)
                  .setMessage("الرقم: "+number+"\nهل تريد فتح الاتصال أم تجهيز رسالة؟")
                  .setPositiveButton("فتح الاتصال",(d,w)->openDialer(number))
                  .setNeutralButton("تجهيز رسالة",(d,w)->openSms(number))
                  .setNegativeButton("إلغاء",null).show();
            }catch(SecurityException e){notify("لم يُسمح بقراءة رقم جهة الاتصال المحددة.");}
        }
    }
    private String cleanNumber(String v){
        if(v==null)return "";
        return v.replaceAll("[^0-9+]","");
    }
    private void openDialer(String input){
        String n=cleanNumber(input);
        if(n.replace("+","").length()<3){notify("أدخل رقمًا صحيحًا.");return;}
        // Opens the system dialer: user initiates the call.
        runIntent(new Intent(Intent.ACTION_DIAL,Uri.parse("tel:"+n)));
        status("فُتحت شاشة الاتصال. الضغط على اتصال يتم بيدك.");
    }
    private void openSms(String input){
        String n=cleanNumber(input);
        if(n.replace("+","").length()<3){notify("أدخل رقمًا صحيحًا.");return;}
        // Only prepares a message in the default SMS app; never sends it autonomously.
        runIntent(new Intent(Intent.ACTION_SENDTO,Uri.parse("smsto:"+Uri.encode(n))));
        status("فُتحت شاشة كتابة الرسالة. لن تُرسل إلا عندما تضغط إرسال.");
    }
    private void askNumber(boolean sms){
        EditText field=new EditText(this);field.setInputType(InputType.TYPE_CLASS_PHONE);
        field.setHint("رقم الهاتف");field.setSingleLine(true);
        new AlertDialog.Builder(this).setTitle(sms?"تجهيز رسالة":"فتح الاتصال")
            .setView(field).setPositiveButton("متابعة",(d,w)->{
                if(sms)openSms(field.getText().toString());
                else openDialer(field.getText().toString());
            }).setNegativeButton("إلغاء",null).show();
    }
    private static final class Openable{
        final String title;final String packageName;final String className;
        Openable(String t,String p,String c){title=t;packageName=p;className=c;}
    }
    private List<Openable> apps(){
        Intent query=new Intent(Intent.ACTION_MAIN);
        query.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> results=getPackageManager().queryIntentActivities(query,0);
        ArrayList<Openable> items=new ArrayList<>();
        HashSet<String> used=new HashSet<>();
        for(ResolveInfo r:results){
            if(r.activityInfo==null)continue;
            String pkg=r.activityInfo.packageName,clazz=r.activityInfo.name;
            if(!used.add(pkg+"|"+clazz))continue;
            items.add(new Openable(safeLabel(r.loadLabel(getPackageManager()).toString()),pkg,clazz));
        }
        items.sort(Comparator.comparing(x->x.title.toLowerCase(Locale.ROOT)));
        return items;
    }
    private String safeLabel(String v){return v.length()>75?v.substring(0,75):v;}
    private void showLaunchableApps(){
        List<Openable> items=apps();
        if(items.isEmpty()){notify("لا تظهر تطبيقات قابلة للفتح. تحقق من إعدادات النظام.");return;}
        String[] names=new String[items.size()];
        for(int i=0;i<items.size();i++)names[i]=items.get(i).title;
        new AlertDialog.Builder(this).setTitle("التطبيقات الظاهرة لنظام Android")
            .setItems(names,(dialog,index)->launchApp(items.get(index)))
            .setNegativeButton("إغلاق",null).show();
    }
    private void launchApp(Openable app){
        Intent launch=new Intent(Intent.ACTION_MAIN);
        launch.addCategory(Intent.CATEGORY_LAUNCHER);
        launch.setClassName(app.packageName,app.className);
        runIntent(launch);
        status("تم طلب فتح "+app.title+" عبر Android، دون الوصول لبياناته الداخلية.");
    }
    private void openTwinSection(String section){
        if(!loaded){web.loadUrl(TWIN_URL);status("يُحمّل التوأم أولًا؛ ثم افتح القسم المطلوب.");return;}
        web.evaluateJavascript("document.querySelector('[data-page=\""+section+"\"]')?.click();",null);
        status("تم توجيه واجهة التوأم إلى القسم المطلوب.");
    }
    private String normalize(String value){
        return value.trim().toLowerCase(Locale.ROOT)
           .replace('أ','ا').replace('إ','ا').replace('آ','ا')
           .replace('ؤ','و').replace('ئ','ي').replace('ى','ي')
           .replaceAll("[\\u064B-\\u065F]","")
           .replaceAll("\\s+"," ");
    }
    private void handleCommand(String raw){
        String cmd=normalize(raw);
        if(cmd.isEmpty()){notify("اكتب أمرًا أولًا.");return;}
        if(cmd.equals("التطبيقات")||cmd.contains("افتح التطبيقات")){showLaunchableApps();return;}
        if(cmd.contains("التوام")||cmd.contains("موقع محمد")){web.loadUrl(TWIN_URL);return;}
        if(cmd.contains("افتح الذاكره")){openTwinSection("memory");return;}
        if(cmd.contains("افتح المحادثه")){openTwinSection("chat");return;}
        if(cmd.contains("افتح المهام")){openTwinSection("tasks");return;}
        if(cmd.contains("افتح التحدي")){openTwinSection("challenge");return;}
        if(cmd.contains("افتح الهويه")){openTwinSection("identity");return;}
        if(cmd.contains("افتح الخصوصيه")){openTwinSection("privacy");return;}
        if(cmd.contains("اعدادات الواي")||cmd.contains("افتح الواي")){runIntent(new Intent(Settings.ACTION_WIFI_SETTINGS));return;}
        if(cmd.contains("اعدادات البلوتوث")||cmd.contains("افتح البلوتوث")){runIntent(new Intent(Settings.ACTION_BLUETOOTH_SETTINGS));return;}
        if(cmd.equals("الاعدادات")||cmd.contains("افتح الاعدادات")){runIntent(new Intent(Settings.ACTION_SETTINGS));return;}
        if(cmd.contains("اختر جهه اتصال")||cmd.contains("جهات الاتصال")){pickPhoneContact();return;}
        if(cmd.contains("ذكرني")||cmd.contains("تذكير")){newReminder();return;}
        if(cmd.contains("افتح الكاميرا")){runIntent(new Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA));return;}
        if(cmd.contains("افتح نبض")||cmd.contains("الاكاديميه")){openExternal(Uri.parse(ACADEMY_URL));return;}
        if(cmd.startsWith("اتصل ")||cmd.startsWith("اتصال ")){openDialer(cmd.substring(cmd.indexOf(' ')+1));return;}
        if(cmd.startsWith("رساله ")||cmd.startsWith("رسالة ")){openSms(cmd.substring(cmd.indexOf(' ')+1));return;}
        if(cmd.startsWith("ابحث عن ")){
            String query=raw.trim().substring(Math.min(raw.length(),7));
            openExternal(Uri.parse("https://www.google.com/search?q="+Uri.encode(query)));return;
        }
        if(cmd.startsWith("افتح ")){
            String name=cmd.substring(5).trim();
            List<Openable> matches=new ArrayList<>();
            for(Openable a:apps()){
                String label=normalize(a.title);
                if(label.equals(name)||label.contains(name))matches.add(a);
            }
            if(matches.size()==1){launchApp(matches.get(0));return;}
            if(matches.size()>1){
                String[] names=new String[matches.size()];
                for(int i=0;i<matches.size();i++)names[i]=matches.get(i).title;
                new AlertDialog.Builder(this).setTitle("أي تطبيق تقصد؟")
                  .setItems(names,(d,i)->launchApp(matches.get(i)))
                  .setNegativeButton("إلغاء",null).show();
                return;
            }
        }
        notify("لم أتعرف على الأمر. جرّب: افتح واتساب، افتح الذاكرة، اتصل 059...، أو افتح التطبيقات.");
    }
    private void newReminder(){
        if(Build.VERSION.SDK_INT>=33
          &&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},NOTIFY_REQUEST);
            notify("امنح إذن الإشعارات، ثم اضغط زر التذكير مرة ثانية.");
            return;
        }
        EditText field=new EditText(this);field.setSingleLine(true);
        field.setHint("عنوان التذكير — مثلاً مراجعة المحاضرات");
        new AlertDialog.Builder(this).setTitle("تذكير محلي على الهاتف")
          .setView(field)
          .setPositiveButton("التالي",(dialog,which)->{
              String label=field.getText().toString().trim();
              if(label.isEmpty()||label.length()>120){notify("أدخل عنوانًا لا يتجاوز 120 حرفًا.");return;}
              Calendar cal=Calendar.getInstance();
              DatePickerDialog date=new DatePickerDialog(this,(picker,year,month,day)->{
                  cal.set(Calendar.YEAR,year);cal.set(Calendar.MONTH,month);cal.set(Calendar.DAY_OF_MONTH,day);
                  TimePickerDialog time=new TimePickerDialog(this,(p,hour,minute)->{
                      cal.set(Calendar.HOUR_OF_DAY,hour);cal.set(Calendar.MINUTE,minute);
                      cal.set(Calendar.SECOND,0);cal.set(Calendar.MILLISECOND,0);
                      if(cal.getTimeInMillis()<System.currentTimeMillis()+60000){
                          notify("اختر موعدًا لا يقل عن دقيقة من الآن.");return;
                      }
                      try{
                          ReminderScheduler.schedule(this,label,cal.getTimeInMillis());
                          notify("حُفظ التذكير محليًا. سيظهر إشعار Android عند موعده أو بعده قليلًا.");
                      }catch(Exception ex){notify("تعذرت جدولة التذكير على الجهاز.");}
                  },cal.get(Calendar.HOUR_OF_DAY),cal.get(Calendar.MINUTE),true);
                  time.show();
              },cal.get(Calendar.YEAR),cal.get(Calendar.MONTH),cal.get(Calendar.DAY_OF_MONTH));
              date.getDatePicker().setMinDate(System.currentTimeMillis()-86400000L);
              date.show();
          }).setNeutralButton("مسح تذكيرات الهاتف",(d,w)->{
              new AlertDialog.Builder(this).setTitle("تأكيد")
                .setMessage("هل تريد إلغاء جميع تذكيرات الهاتف التي أنشأها هذا التطبيق؟")
                .setPositiveButton("إلغاء التذكيرات",(a,b)->{
                    ReminderScheduler.cancelAll(this);notify("أُلغيت تذكيرات الهاتف.");
                }).setNegativeButton("رجوع",null).show();
          }).setNegativeButton("إلغاء",null).show();
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants){
        super.onRequestPermissionsResult(code,permissions,grants);
        if(code==NOTIFY_REQUEST && grants.length>0 && grants[0]==PackageManager.PERMISSION_GRANTED)
            notify("إذن الإشعارات مفعّل. اضغط تذكير لتحديد الموعد.");
        if(code==MIC_REQUEST){
            if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)==PackageManager.PERMISSION_GRANTED)
                startContinuousVoice();
            else notify("لم تمنح إذن الميكروفون. لم يبدأ الاستماع.");
        }
    }
    @Override public void onBackPressed(){
        if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();
    }
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onSaveInstanceState(Bundle out){
        if(web!=null)web.saveState(out);super.onSaveInstanceState(out);
    }
    @Override protected void onDestroy(){
        if(web!=null){
            web.stopLoading();web.loadUrl("about:blank");
            ((ViewGroup)web.getParent()).removeView(web);web.destroy();web=null;
        }
        super.onDestroy();
    }
}
