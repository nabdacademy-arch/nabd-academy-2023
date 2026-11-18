package ps.nabd.headneckoffline;

import android.app.Activity;
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
    private ValueCallback<android.net.Uri[]> chooser;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(6,22,37));
        getWindow().setNavigationBarColor(Color.rgb(6,22,37));
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
    }
    @Override public void onBackPressed(){
        if(browser!=null&&browser.canGoBack())browser.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(chooser!=null){chooser.onReceiveValue(null);chooser=null;}
        availableBank=null;
        if(browser!=null){browser.removeJavascriptInterface("NABDApp");browser.destroy();browser=null;}
        super.onDestroy();
    }
}
