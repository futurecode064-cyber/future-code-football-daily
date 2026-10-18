package mm.futurecode.sportsjournal;
import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.security.MessageDigest;
import java.util.*;
public final class AppUpdate {
 static boolean busy=false;
 static long version(PackageInfo p){return Build.VERSION.SDK_INT>=28?p.getLongVersionCode():p.versionCode;}
 public static JSONObject latest(Context c)throws Exception{
  JSONObject j=Net.json(Policy.MANIFEST);PackageInfo current=c.getPackageManager().getPackageInfo(c.getPackageName(),0);
  if(!c.getPackageName().equals(j.optString("packageName"))||j.optLong("versionCode")<=version(current))return null;
  if(!Policy.trustedApk(j.optString("apkUrl"))||!j.optString("sha256").matches("[a-fA-F0-9]{64}")||j.optString("versionName").isEmpty())throw new IOException("Invalid update information");return j;
 }
 public static void check(MainActivity a,boolean manual){
  if(busy)return;busy=true;new Thread(()->{try{JSONObject j=latest(a);a.runOnUiThread(()->{busy=false;if(a.isFinishing()||a.isDestroyed())return;if(j==null){if(manual)a.msg("နောက်ဆုံး App ဗားရှင်းကို အသုံးပြုနေပါတယ်။");return;}
   long code=j.optLong("versionCode");SharedPreferences p=a.getSharedPreferences("update_prompt",0);long now=System.currentTimeMillis();if(!manual&&p.getLong("version",0)==code&&now-p.getLong("shown",0)<21600000)return;p.edit().putLong("version",code).putLong("shown",now).apply();
   new AlertDialog.Builder(a).setTitle("App Update "+j.optString("versionName")).setMessage("FUTURE CODE အားကစား ဂျာနယ် ဗားရှင်းအသစ် ရပါပြီ။\n\n"+j.optString("releaseNotes","")+"\n\nUpdate နှိပ်ပြီး Download ယူနိုင်ပါသည်။ Android Install ခလုတ်ကို အတည်ပြုပေးပါ။").setPositiveButton("Update လုပ်မယ်",(d,w)->download(a,j)).setNegativeButton("နောက်မှ",null).show();});}catch(Exception e){a.runOnUiThread(()->{busy=false;if(manual)a.msg("Update စစ်မရပါ။ အင်တာနက်စစ်ပြီး ပြန်ကြိုးစားပါ။");});}},"AppVersion").start();
 }
 static android.content.pm.Signature[] certificates(PackageInfo p){return Build.VERSION.SDK_INT>=28&&p.signingInfo!=null?p.signingInfo.getApkContentsSigners():p.signatures;}
 static void verify(Context c,File apk,JSONObject j)throws Exception{
  if(!Policy.hash(java.nio.file.Files.readAllBytes(apk.toPath())).equalsIgnoreCase(j.getString("sha256")))throw new IOException("Update checksum mismatch");
  int flags=PackageManager.GET_SIGNATURES|(Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:0);PackageManager pm=c.getPackageManager();PackageInfo downloaded=pm.getPackageArchiveInfo(apk.getPath(),flags),installed=pm.getPackageInfo(c.getPackageName(),flags);
  if(downloaded==null||!c.getPackageName().equals(downloaded.packageName)||version(downloaded)!=j.getLong("versionCode")||version(downloaded)<=version(installed))throw new IOException("Unexpected app version");
  android.content.pm.Signature[] next=certificates(downloaded),old=certificates(installed);if(next==null||old==null||next.length!=old.length)throw new IOException("Signing key mismatch");for(android.content.pm.Signature s:next)if(!Arrays.asList(old).contains(s))throw new IOException("Signing key mismatch");
 }
 static void download(MainActivity a,JSONObject j){
  ProgressDialog progress=new ProgressDialog(a);progress.setMessage("Update Download လုပ်နေပါတယ်…");progress.setCancelable(false);progress.show();
  new Thread(()->{File part=new File(a.getCacheDir(),"journal-update.part"),apk=new File(a.getCacheDir(),"journal-update.apk");try{
   HttpURLConnection c=Net.open(j.getString("apkUrl"));try{if(c.getResponseCode()!=200)throw new IOException("Download failed");try(InputStream in=c.getInputStream();OutputStream out=new FileOutputStream(part)){byte[] buf=new byte[16384];int n,total=0;while((n=in.read(buf))!=-1){total+=n;if(total>80000000)throw new IOException("App size limit");out.write(buf,0,n);}}}finally{c.disconnect();}
   verify(a,part,j);if(apk.exists()&&!apk.delete())throw new IOException("Old download locked");if(!part.renameTo(apk))throw new IOException("Cannot save update");
   a.runOnUiThread(()->{if(!a.isFinishing()){progress.dismiss();install(a);}});
  }catch(Exception e){part.delete();a.runOnUiThread(()->{if(!a.isFinishing()){progress.dismiss();a.msg("Update Download မပြီးပါ။ အင်တာနက်စစ်ပြီး ပြန်ကြိုးစားပါ။");}});}},"DownloadUpdate").start();
 }
 public static void install(MainActivity a){
  if(!a.getPackageManager().canRequestPackageInstalls()){
   new AlertDialog.Builder(a).setTitle("Update တင်ခွင့် ဖွင့်ရန်").setMessage("Settings ထဲမှာ Allow from this source ကို ဖွင့်ပြီး App ထဲ ပြန်လာပါ။").setPositiveButton("Settings ဖွင့်မယ်",(d,w)->a.startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+a.getPackageName())),401)).setNegativeButton("နောက်မှ",null).show();return;
  }
  File f=new File(a.getCacheDir(),"journal-update.apk");if(!f.exists())return;Uri uri=Uri.parse("content://"+a.getPackageName()+".updates/update.apk");Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);try{a.startActivity(i);}catch(Exception e){a.msg("Installer ကို ဖွင့်မရပါ။");}
 }
}
