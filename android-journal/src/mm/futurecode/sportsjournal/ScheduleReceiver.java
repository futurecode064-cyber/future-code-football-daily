package mm.futurecode.sportsjournal;
import android.content.*;
public final class ScheduleReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){JournalJob.schedule(c);}
}
