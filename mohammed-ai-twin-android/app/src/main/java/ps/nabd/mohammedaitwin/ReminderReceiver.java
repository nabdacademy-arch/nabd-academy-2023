package ps.nabd.mohammedaitwin;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

public final class ReminderReceiver extends BroadcastReceiver {
    private static final String CHANNEL="moh_twin_owner_reminders";
    public static void createNotificationChannel(Context context){
        if(Build.VERSION.SDK_INT<26)return;
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        NotificationChannel channel=new NotificationChannel(CHANNEL,
            context.getString(R.string.notification_channel_name),NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription(context.getString(R.string.notification_channel_description));
        manager.createNotificationChannel(channel);
    }
    @Override public void onReceive(Context context,Intent intent){
        if(intent==null || intent.getAction()==null ||
          !intent.getAction().startsWith("ps.nabd.mohammedaitwin.LOCAL_REMINDER."))return;
        int id=intent.getIntExtra("id",-1);
        String title=intent.getStringExtra("title");
        if(id<0||title==null)return;
        ReminderScheduler.removeDelivered(context,id);
        if(Build.VERSION.SDK_INT>=33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return;
        createNotificationChannel(context);
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        Intent open=new Intent(context,MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent click=PendingIntent.getActivity(context,id,open,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification note=new Notification.Builder(context,CHANNEL)
            .setContentTitle("MOHAMMED AI TWIN · تذكير")
            .setContentText(title)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(click).setAutoCancel(true)
            .setVisibility(Notification.VISIBILITY_PRIVATE).build();
        manager.notify(id,note);
    }
}
