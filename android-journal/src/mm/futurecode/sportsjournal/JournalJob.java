package mm.futurecode.sportsjournal;
import android.app.job.*;
import android.content.*;
public final class JournalJob extends JobService {
 private Thread running;
 public static void schedule(Context c){JobScheduler scheduler=(JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE);JobInfo existing=scheduler.getPendingJob(7318);if(existing!=null)return;scheduler.schedule(new JobInfo.Builder(7318,new ComponentName(c,JournalJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true).setPeriodic(15*60*1000L).build());}
 @Override public boolean onStartJob(final JobParameters p){running=new Thread(()->{boolean retry=false;try{ContentNotifier.check(this);}catch(Exception e){retry=true;}if(!Thread.currentThread().isInterrupted())jobFinished(p,retry);},"JournalUpdates");running.start();return true;}
 @Override public boolean onStopJob(JobParameters p){if(running!=null)running.interrupt();return true;}
}
