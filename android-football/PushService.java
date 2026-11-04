package mm.futurecode.sportsjournal;

import android.app.*;
import android.content.*;
import android.os.Build;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/** Data-only FCM messages; one display per Yangon date and publication slot. */
public final class PushService extends FirebaseMessagingService {
  public static void subscribe(Context context) {
    FirebaseMessaging.getInstance().subscribeToTopic(context.getString(R.string.push_topic));
  }
  @Override public void onNewToken(String token) { subscribe(this); }
  @Override public void onMessageReceived(RemoteMessage message) {
    Map<String,String> d=message.getData();
    String slot=d.get("slot"), date=d.get("date"), route=d.get("route");
    if(!("morning".equals(slot)||"evening".equals(slot)) || !Policy.today().equals(date))return;
    if(!Policy.trustedPage(route))route=Policy.HOME;
    if(Build.VERSION.SDK_INT>=33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
    SharedPreferences prefs=getSharedPreferences("push_seen",0);
    String key=date+":"+slot;
    synchronized(PushService.class){
      if(prefs.getBoolean(key,false))return;
      NotificationManager nm=getSystemService(NotificationManager.class);
      if(!nm.areNotificationsEnabled())return;
      nm.createNotificationChannel(new NotificationChannel("football_daily","နေ့စဉ် ဘောလုံးသတင်း",NotificationManager.IMPORTANCE_DEFAULT));
      Intent intent=new Intent(this,MainActivity.class).putExtra("route",route).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
      PendingIntent tap=PendingIntent.getActivity(this,"morning".equals(slot)?201:202,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
      String title=d.get("title"),body=d.get("body");
      if(title==null||title.isEmpty()||title.length()>120||body==null||body.isEmpty()||body.length()>500)return;
      Notification n=new Notification.Builder(this,"football_daily").setSmallIcon(R.drawable.ic_notification).setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(tap).setAutoCancel(true).build();
      nm.notify("morning".equals(slot)?201:202,n);
      prefs.edit().putBoolean(key,true).apply();
    }
  }
}
