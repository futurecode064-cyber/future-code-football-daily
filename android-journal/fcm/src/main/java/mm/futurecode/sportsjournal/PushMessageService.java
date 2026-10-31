package mm.futurecode.sportsjournal;
import android.content.SharedPreferences;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/** Foreground FCM display. Android displays notification payloads when backgrounded. */
public final class PushMessageService extends FirebaseMessagingService {
 @Override public void onNewToken(String token){super.onNewToken(token);FcmStarter.start(this);}
 @Override public void onMessageReceived(RemoteMessage message){
  Map<String,String> data=message.getData();
  if(data==null)return;
  String day=data.get("day"),brand=data.get("brand"),kind=data.get("kind"),route=data.get("route"),id=data.get("noticeId");
  if(day==null||!day.matches("\\d{4}-\\d{2}-\\d{2}")||!Policy.today().equals(day))return;
  if(!("morning".equals(kind)||"afternoon".equals(kind)))return;
  if(id==null||!id.equals(brand+":"+day+":"+kind)||!Policy.trustedPage(route))return;
  SharedPreferences p=getSharedPreferences("fc_fcm_seen",0);
  if(id.equals(p.getString(kind,"")))return;
  String title="afternoon".equals(kind)?"ညနေကြေးများ ရပါပြီ":
   (message.getNotification()==null?"ယနေ့ ဘောလုံးသတင်းများ ရပါပြီ":message.getNotification().getTitle());
  String body=message.getNotification()==null?"":message.getNotification().getBody();
  if(body==null||body.isEmpty())return;
  if(ContentNotifier.post(this,"morning".equals(kind)?106:107,title,body,route,false))
   p.edit().putString(kind,id).apply();
 }
}
