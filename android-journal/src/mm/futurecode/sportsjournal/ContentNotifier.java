package mm.futurecode.sportsjournal;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import org.json.*;
public final class ContentNotifier {
 public static void channels(Context c){NotificationManager n=c.getSystemService(NotificationManager.class);n.createNotificationChannel(new NotificationChannel("journal_content","ပွဲကြိုနှင့် ပေါက်ကြေးအသစ်",NotificationManager.IMPORTANCE_DEFAULT));n.createNotificationChannel(new NotificationChannel("journal_app","APK Update",NotificationManager.IMPORTANCE_DEFAULT));}
 public static boolean enabled(Context c){return (Build.VERSION.SDK_INT<33||c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)&&c.getSystemService(NotificationManager.class).areNotificationsEnabled();}
 static boolean post(Context c,int id,String title,String body,String route,boolean update){
  if(!enabled(c))return false;channels(c);
  Intent i=new Intent(c,MainActivity.class).putExtra("route",route).putExtra("checkUpdate",update).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
  PendingIntent tap=PendingIntent.getActivity(c,id,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification n=new Notification.Builder(c,update?"journal_app":"journal_content").setSmallIcon(R.drawable.ic_notification).setColor(0xffd4ae57).setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(tap).setAutoCancel(true).setShowWhen(true).build();
  c.getSystemService(NotificationManager.class).notify(id,n);return true;
 }
 static void publish(Context c,String kind,String date,boolean published,int count,String material,String title,String body,String route,int id)throws Exception{
  if(material.isEmpty())return;String stamp=date+":"+Policy.hash(material);SharedPreferences p=c.getSharedPreferences("journal_seen",0);
  if(Policy.shouldNotify(date,Policy.today(),published,count,stamp,p.getString(kind,""))&&post(c,id,title,body,route,false))p.edit().putString(kind,stamp).apply();
 }
 public static synchronized void check(Context c)throws Exception{
  channels(c);if(!enabled(c))return;
  String today=Policy.today();boolean failed=false;
  try{
   JSONObject d=Net.json(Policy.ORIGIN+"/data/today.json");JSONArray m=d.optJSONArray("matches");StringBuilder content=new StringBuilder();int count=0;
   if(m!=null)for(int k=0;k<m.length();k++){JSONObject x=m.getJSONObject(k);String t=x.optString("dailyPreviewText","").trim();if(!t.isEmpty()){count++;content.append(x.optString("home")).append('|').append(x.optString("away")).append('|').append(t).append('|').append(x.optJSONArray("specialAnalysisParagraphs"));}}
   publish(c,"previews",d.optString("reportDate"),d.optBoolean("published"),count,content.toString(),"ပွဲကြိုသုံးသပ်ချက်အသစ် ရပါပြီ","ဒီနေ့ ကန်မယ့် ပွဲတွေရဲ့ အထူးသုံးသပ်ချက်တွေကို လေ့လာနိုင်ပါပြီ။",Policy.HOME,101);
  }catch(Exception e){failed=true;}
  for(boolean evening:new boolean[]{false,true})try{
   JSONObject d=Net.json(Policy.ORIGIN+"/data/odds/"+(evening?"evening/":"")+today+".json");JSONArray m=d.optJSONArray("matches");StringBuilder quotes=new StringBuilder();int count=0;
   if(m!=null)for(int k=0;k<m.length();k++){JSONObject x=m.getJSONObject(k);String body=x.optString(evening?"eveningBodyOdds":"bodyOdds","");String goals=x.optString(evening?"eveningGoalTotalOdds":"goalTotalOdds","");if(!body.isEmpty()||!goals.isEmpty()){count++;quotes.append(x.optString("home")).append('|').append(x.optString("away")).append('|').append(body).append('|').append(goals).append(';');}}
   publish(c,evening?"odds_evening":"odds_morning",d.optString("reportDate"),true,count,quotes.toString(),evening?"ယခု ပေါက်ကြေးအသစ် ရပါပြီ":"ယနေ့ ပေါက်ကြေးများ ရပါပြီ",evening?"ဒီနေ့ပွဲတွေရဲ့ ယခု ပေါက်ကြေးတွေကို လေ့လာနိုင်ပါပြီ။":"ဒီနေ့ ကန်မယ့် ပွဲတွေရဲ့ ပေါက်ကြေးတွေကို လေ့လာနိုင်ပါပြီ။",Policy.HOME+"odds",evening?103:102);
  }catch(Exception e){/* Evening sheet is legitimately absent before publication. */}
  try{JSONObject update=AppUpdate.latest(c);if(update!=null){String key="app_"+update.getInt("versionCode");SharedPreferences p=c.getSharedPreferences("journal_seen",0);if(!p.getBoolean(key,false)&&post(c,104,"App ဗားရှင်းအသစ် ရပါပြီ","FUTURE CODE အားကစား ဂျာနယ် "+update.getString("versionName")+" ကို Update လုပ်နိုင်ပါပြီ။",Policy.HOME,true))p.edit().putBoolean(key,true).apply();}}catch(Exception e){failed=true;}
  if(failed)throw new java.io.IOException("Some update checks need retry");
 }
}
