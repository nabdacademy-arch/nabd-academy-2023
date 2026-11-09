package ps.nabd.mohammedaitwin;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.*;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Visible, opt-in microphone foreground service.
 * Started only from visible UI after RECORD_AUDIO permission; never from BOOT_COMPLETED.
 * Recognized commands in background produce an approval notification; no covert action is taken.
 */
public final class VoiceListeningService extends Service implements RecognitionListener {
    public static final String ACTION_START="ps.nabd.mohammedaitwin.voice.START";
    public static final String ACTION_STOP="ps.nabd.mohammedaitwin.voice.STOP";
    public static final String EXTRA_COMMAND="approved_voice_command";
    private static final String CHANNEL_VOICE="twin_voice_visible";
    private static final String CHANNEL_COMMANDS="twin_voice_approval";
    private static final int FOREGROUND_ID=4411, COMMAND_ID=4412;
    private SpeechRecognizer recognizer;
    private final Handler main=new Handler(Looper.getMainLooper());
    private boolean active=false;
    private int failures=0, commands=0;
    private final Runnable retry=this::startRecognition;

    @Override public void onCreate(){
        super.onCreate();
        if(Build.VERSION.SDK_INT>=26){
            NotificationManager manager=getSystemService(NotificationManager.class);
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_VOICE,
               "MOHAMMED AI TWIN • الميكروفون فعال",NotificationManager.IMPORTANCE_LOW));
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_COMMANDS,
               "تأكيد أوامر التوأم الرقمي",NotificationManager.IMPORTANCE_HIGH));
        }
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        String action=intent==null?"":intent.getAction();
        if(ACTION_STOP.equals(action)){stopListening();return START_NOT_STICKY;}
        if(!ACTION_START.equals(action))return START_NOT_STICKY;
        if(active)return START_NOT_STICKY;
        if(checkSelfPermission(Manifest.permission.RECORD_AUDIO)!=PackageManager.PERMISSION_GRANTED){
            stopSelf();return START_NOT_STICKY;
        }
        try{
            Notification notification=visibleNotification();
            if(Build.VERSION.SDK_INT>=29)
                startForeground(FOREGROUND_ID,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            else startForeground(FOREGROUND_ID,notification);
            active=true;
            if(!SpeechRecognizer.isRecognitionAvailable(this)){
                showNotification("لا توجد خدمة تعرّف صوتي على الهاتف.");stopListening();return START_NOT_STICKY;
            }
            recognizer=SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(this);
            startRecognition();
        }catch(Exception e){stopListening();}
        return START_NOT_STICKY;
    }
    private Notification visibleNotification(){
        Intent stop=new Intent(this,VoiceListeningService.class).setAction(ACTION_STOP);
        PendingIntent stopAction=PendingIntent.getService(this,0,stop,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Intent open=new Intent(this,MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openAction=PendingIntent.getActivity(this,0,open,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?
            new Notification.Builder(this,CHANNEL_VOICE):new Notification.Builder(this);
        return builder.setSmallIcon(R.drawable.ic_twin)
            .setContentTitle("MOHAMMED AI TWIN — الميكروفون يعمل")
            .setContentText("استماع صوتي بإذنك، اضغط إيقاف لإنهائه.")
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(true).setContentIntent(openAction)
            .addAction(new Notification.Action.Builder(
                android.R.drawable.ic_media_pause,"إيقاف الاستماع",stopAction).build())
            .build();
    }
    private void startRecognition(){
        if(!active||recognizer==null)return;
        try{
            Intent intent=new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE,"ar-PS");
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS,1);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS,false);
            recognizer.startListening(intent);
        }catch(Exception e){
            failures++;if(failures>=3)stopListening();
            else scheduleRetry(1800);
        }
    }
    private void scheduleRetry(long ms){
        main.removeCallbacks(retry);
        if(active)main.postDelayed(retry,ms);
    }
    @Override public void onResults(Bundle bundle){
        if(!active)return;
        failures=0;
        ArrayList<String> list=bundle==null?null:
            bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if(list!=null&&!list.isEmpty()){
            String phrase=list.get(0)==null?"":list.get(0).trim();
            if(!phrase.isEmpty())handlePhrase(phrase);
        }
        scheduleRetry(900);
    }
    private void handlePhrase(String phrase){
        final String normalized=phrase.toLowerCase(Locale.ROOT)
          .replace('أ','ا').replace('إ','ا').replace('آ','ا')
          .replaceAll("[\\u064B-\\u065F]","").trim();
        if(normalized.equals("اوقف الاستماع")||normalized.equals("ايقاف الاستماع")
          ||normalized.equals("وقف الاستماع")||normalized.equals("stop listening")){
            stopListening();return;
        }
        // No instructions are executed while the app is hidden. User must tap and confirm.
        commands++;
        Intent approve=new Intent(this,MainActivity.class)
          .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP)
          .putExtra(EXTRA_COMMAND,phrase);
        PendingIntent confirm=PendingIntent.getActivity(this,commands,approve,
          PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?
          new Notification.Builder(this,CHANNEL_COMMANDS):new Notification.Builder(this);
        Notification n=builder.setSmallIcon(R.drawable.ic_twin)
          .setContentTitle("التوأم التقط أمرًا صوتيًا")
          .setContentText("اضغط لمراجعة الأمر والموافقة على تنفيذه.")
          .setVisibility(Notification.VISIBILITY_PRIVATE)
          .setAutoCancel(true).setContentIntent(confirm)
          .build();
        getSystemService(NotificationManager.class).notify(COMMAND_ID,n);
    }
    private void showNotification(String message){
        Notification.Builder builder=Build.VERSION.SDK_INT>=26?
          new Notification.Builder(this,CHANNEL_COMMANDS):new Notification.Builder(this);
        getSystemService(NotificationManager.class).notify(COMMAND_ID,builder
            .setSmallIcon(R.drawable.ic_twin).setContentTitle("MOHAMMED AI TWIN")
            .setContentText(message).setAutoCancel(true).build());
    }
    @Override public void onError(int error){
        if(!active)return;
        if(error==SpeechRecognizer.ERROR_NO_MATCH || error==SpeechRecognizer.ERROR_SPEECH_TIMEOUT){
            scheduleRetry(1100);return;
        }
        failures++;
        if(error==SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS||failures>=3){
            showNotification("توقف الصوت بسبب الأذونات أو قيود خدمة التعرف. افتح التطبيق لإعادة التشغيل.");
            stopListening();return;
        }
        scheduleRetry(1200L*failures);
    }
    private void stopListening(){
        active=false;main.removeCallbacksAndMessages(null);
        if(recognizer!=null){
            try{recognizer.cancel();recognizer.destroy();}catch(Exception ignored){}
            recognizer=null;
        }
        if(Build.VERSION.SDK_INT>=24)stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        stopSelf();
    }
    @Override public void onDestroy(){stopListening();super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onReadyForSpeech(Bundle params){}
    @Override public void onBeginningOfSpeech(){}
    @Override public void onRmsChanged(float rmsdB){}
    @Override public void onBufferReceived(byte[] buffer){}
    @Override public void onEndOfSpeech(){}
    @Override public void onPartialResults(Bundle partialResults){}
    @Override public void onEvent(int eventType,Bundle params){}
}