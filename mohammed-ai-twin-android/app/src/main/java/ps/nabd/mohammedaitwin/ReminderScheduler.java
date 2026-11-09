package ps.nabd.mohammedaitwin;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

public final class ReminderScheduler {
    private static final String STORAGE="moh_twin_local_reminders";
    private static final String KEY="entries";
    private static final String NEXT="next_id";
    private ReminderScheduler(){}

    private static PendingIntent broadcast(Context context,int id,String title){
        Intent intent=new Intent(context,ReminderReceiver.class)
            .setAction("ps.nabd.mohammedaitwin.LOCAL_REMINDER."+id);
        intent.putExtra("id",id);
        intent.putExtra("title",title);
        return PendingIntent.getBroadcast(context,id,intent,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private static AlarmManager alarm(Context context){
        return (AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
    }
    private static SharedPreferences pref(Context context){
        return context.getSharedPreferences(STORAGE,Context.MODE_PRIVATE);
    }
    private static JSONArray saved(Context context){
        try{return new JSONArray(pref(context).getString(KEY,"[]"));}
        catch(JSONException e){return new JSONArray();}
    }
    private static void persist(Context context,JSONArray values){
        pref(context).edit().putString(KEY,values.toString()).apply();
    }
    private static void arm(Context context,int id,String title,long due){
        AlarmManager am=alarm(context);
        if(am==null)throw new IllegalStateException("AlarmManager missing");
        // Inexact allowance: Android is allowed to delay, no exact alarm permission requested.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,due,broadcast(context,id,title));
    }
    public static synchronized int schedule(Context context,String title,long due) throws JSONException {
        if(due<=System.currentTimeMillis())throw new IllegalArgumentException("Future date required");
        String safeTitle=title.trim();
        if(safeTitle.isEmpty()||safeTitle.length()>120)throw new IllegalArgumentException("Bad title");
        SharedPreferences prefs=pref(context);
        int id=prefs.getInt(NEXT,1000)+1;
        JSONArray values=saved(context);
        if(values.length()>=30)throw new IllegalStateException("30 local reminders max");
        JSONObject value=new JSONObject();
        value.put("id",id);
        value.put("title",safeTitle);
        value.put("due",due);
        arm(context,id,safeTitle,due);
        values.put(value);
        prefs.edit().putInt(NEXT,id).putString(KEY,values.toString()).apply();
        return id;
    }
    public static synchronized void removeDelivered(Context context,int id){
        JSONArray values=saved(context),out=new JSONArray();
        for(int i=0;i<values.length();i++){
            JSONObject item=values.optJSONObject(i);
            if(item!=null&&item.optInt("id")!=id)out.put(item);
        }
        persist(context,out);
    }
    public static synchronized void restore(Context context){
        JSONArray values=saved(context),out=new JSONArray();
        long now=System.currentTimeMillis();
        for(int i=0;i<values.length();i++){
            JSONObject item=values.optJSONObject(i);
            if(item==null)continue;
            int id=item.optInt("id",-1);
            String title=item.optString("title","");
            long due=item.optLong("due",0);
            if(id<0||title.isEmpty()||due<=now)continue;
            try{arm(context,id,title,due);out.put(item);}
            catch(SecurityException|IllegalStateException ignored){}
        }
        persist(context,out);
    }
    public static synchronized void cancelAll(Context context){
        JSONArray values=saved(context);
        AlarmManager am=alarm(context);
        if(am!=null){
            for(int i=0;i<values.length();i++){
                JSONObject item=values.optJSONObject(i);if(item==null)continue;
                PendingIntent p=broadcast(context,item.optInt("id"),item.optString("title"));
                am.cancel(p);p.cancel();
            }
        }
        persist(context,new JSONArray());
    }
}
