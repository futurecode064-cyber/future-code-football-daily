package mm.futurecode.sportsjournal.test;
import android.app.*;
import android.app.job.*;
import android.content.*;
import android.database.Cursor;
import android.os.*;
import android.provider.MediaStore;
import android.service.notification.StatusBarNotification;
import android.webkit.WebView;
import java.lang.reflect.Field;
import java.util.*;
import java.util.concurrent.*;
import mm.futurecode.sportsjournal.*;
public final class SmokeInstrumentation extends Instrumentation {
 public void onCreate(Bundle b){super.onCreate(b);start();}
 static void require(boolean value,String message){if(!value)throw new AssertionError(message);}
 String js(WebView web,String script)throws Exception{CountDownLatch latch=new CountDownLatch(1);String[] result={""};runOnMainSync(()->web.evaluateJavascript(script,v->{result[0]=v;latch.countDown();}));require(latch.await(8,TimeUnit.SECONDS),"JavaScript callback timed out");return result[0];}
 @Override public void onStart(){Bundle result=new Bundle();try{
  require(Policy.trustedPage(Policy.HOME),"own site trusted");require(!Policy.trustedPage("https://evil.example/future-code-journal/"),"foreign origin blocked");require(!Policy.trustedApk("https://evil.example/x.apk"),"external update blocked");
  require(Policy.shouldNotify("2026-10-18","2026-10-18",true,1,"abc",""),"new article notifies");require(!Policy.shouldNotify("2026-10-17","2026-10-18",true,1,"abc",""),"stale report rejected");require(!Policy.shouldNotify("2026-10-18","2026-10-18",true,1,"abc","abc"),"repeat notification suppressed");require(!Policy.shouldNotify("2026-10-18","2026-10-18",false,1,"abc",""),"draft rejected");
  Context c=getTargetContext();Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);Activity activity=startActivitySync(launch);Field field=MainActivity.class.getDeclaredField("web");field.setAccessible(true);WebView web=(WebView)field.get(activity);
  boolean ready=false;for(int i=0;i<40;i++){String value=js(web,"Boolean(window.FCJournalSave && document.querySelectorAll('.match-card').length>0 && document.documentElement.dataset.footballBrandName==='FUTURE CODE အားကစား ဂျာနယ်')");if("true".equals(value)){ready=true;break;}Thread.sleep(1000);}
  require(ready,"Live journal and native PNG bridge loaded; state="+js(web,"JSON.stringify({url:location.href,bridge:typeof window.FCJournalSave,cards:document.querySelectorAll('.match-card').length,status:document.querySelector('#statusText')?.textContent,text:document.body?.innerText?.slice(0,350)})"));
  JobInfo job=((JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE)).getPendingJob(7318);require(job!=null&&job.isPersisted()&&job.getIntervalMillis()>=900000,"Persistent background updates scheduled");
  js(web,"(function(){var c=document.createElement('canvas');c.width=16;c.height=16;var x=c.getContext('2d');x.fillStyle='#d4ae57';x.fillRect(0,0,16,16);c.toBlob(function(b){var a=document.createElement('a');a.download='journal-smoke.png';a.href=URL.createObjectURL(b);a.click();},'image/png');return true})()");
  boolean image=false;for(int i=0;i<15;i++){try(Cursor cursor=c.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,new String[]{MediaStore.Images.Media.SIZE},MediaStore.Images.Media.DISPLAY_NAME+"=?",new String[]{"journal-smoke.png"},null)){if(cursor!=null&&cursor.moveToFirst()&&cursor.getLong(0)>0){image=true;break;}}Thread.sleep(1000);}require(image,"Blob PNG saved in Gallery");
  try{ContentNotifier.check(c);}catch(Exception ignored){}
  NotificationManager n=c.getSystemService(NotificationManager.class);Map<Integer,Long> before=new HashMap<>();for(StatusBarNotification s:n.getActiveNotifications())before.put(s.getId(),s.getPostTime());require(before.containsKey(101)&&before.containsKey(102),"Preview and odds notifications posted");
  try{ContentNotifier.check(c);}catch(Exception ignored){}
  for(StatusBarNotification s:n.getActiveNotifications())if(before.containsKey(s.getId()))require(before.get(s.getId()).longValue()==s.getPostTime(),"No duplicate content alert");
  result.putString("stream","PASS: live website, trusted routes, stale/draft/repeat policy, persisted job, Gallery PNG, preview and odds notifications, duplicate suppression.\n");finish(Activity.RESULT_OK,result);
 }catch(Throwable t){result.putString("stream","FAIL: "+t.toString()+"\n");finish(Activity.RESULT_CANCELED,result);}}
}
