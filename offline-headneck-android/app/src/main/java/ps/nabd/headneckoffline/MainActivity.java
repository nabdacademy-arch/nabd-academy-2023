package ps.nabd.headneckoffline;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

public class MainActivity extends Activity {
    private WebView browser;
    private ValueCallback<android.net.Uri[]> chooseFile;
    private static final int FILE_PICKER_REQUEST = 2732;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(6, 22, 37));
        getWindow().setNavigationBarColor(Color.rgb(6, 22, 37));
        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(6, 22, 37));
        setContentView(browser);
        WebSettings config=browser.getSettings();
        config.setJavaScriptEnabled(true);
        config.setDomStorageEnabled(true);
        config.setAllowFileAccess(true);
        config.setAllowContentAccess(true);
        config.setJavaScriptCanOpenWindowsAutomatically(false);
        config.setSupportMultipleWindows(false);
        config.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView w, WebResourceRequest r) {
                return !r.getUrl().toString().startsWith("file:///android_asset/");
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView w, WebResourceRequest r) {
                if (!r.getUrl().toString().startsWith("file:///android_asset/")) {
                    return new WebResourceResponse("text/plain","UTF-8",
                        new java.io.ByteArrayInputStream(new byte[0]));
                }
                return super.shouldInterceptRequest(w,r);
            }
        });
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView webView,
                    ValueCallback<android.net.Uri[]> callback, FileChooserParams params) {
                if (chooseFile != null) chooseFile.onReceiveValue(null);
                chooseFile=callback;
                try {
                    Intent intent=params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent,FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception ex) {
                    chooseFile=null;
                    return false;
                }
            }
        });
        browser.loadUrl("file:///android_asset/index.html");
    }
    @Override protected void onActivityResult(int req,int result,Intent data) {
        super.onActivityResult(req,result,data);
        if (req==FILE_PICKER_REQUEST && chooseFile!=null) {
            chooseFile.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
            chooseFile=null;
        }
    }
    @Override public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (chooseFile!=null) {chooseFile.onReceiveValue(null);chooseFile=null;}
        if (browser!=null) {browser.destroy();browser=null;}
        super.onDestroy();
    }
}
