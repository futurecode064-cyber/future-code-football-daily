package mm.futurecode.sportsjournal;
import android.content.Context;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;

/** Included only in the opt-in Gradle FCM variant; legacy SDK build stays unchanged. */
public final class FcmStarter {
 private static volatile boolean initialized;
 private FcmStarter(){}
 public static synchronized boolean configured(){
  return BuildConfig.FC_APP_ID.length()>0 && BuildConfig.FC_API_KEY.length()>0 &&
   BuildConfig.FC_PROJECT_ID.length()>0 && BuildConfig.FC_SENDER_ID.length()>0 &&
   BuildConfig.FC_TOPIC.length()>0;
 }
 public static synchronized void start(Context context) {
  if(initialized||!configured())return;
  // Background FCM notifications need an existing Android 8+ channel.
  ContentNotifier.channels(context);
  FirebaseOptions options=new FirebaseOptions.Builder()
   .setApplicationId(BuildConfig.FC_APP_ID)
   .setApiKey(BuildConfig.FC_API_KEY)
   .setProjectId(BuildConfig.FC_PROJECT_ID)
   .setGcmSenderId(BuildConfig.FC_SENDER_ID).build();
  if(FirebaseApp.getApps(context).isEmpty())FirebaseApp.initializeApp(context,options);
  FirebaseMessaging.getInstance().subscribeToTopic(BuildConfig.FC_TOPIC)
   .addOnFailureListener(e->Log.w("FCM", "Topic subscription unavailable",e));
  initialized=true;
 }
}
