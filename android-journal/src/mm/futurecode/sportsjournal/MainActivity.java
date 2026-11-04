package mm.futurecode.sportsjournal;
import android.Manifest;
import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.*;
import android.util.Base64;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.util.Locale;
public final class MainActivity extends Activity {
 WebView web;ProgressBar progress;LinearLayout offline;volatile String currentPage=Policy.HOME;byte[] pendingImage;String pendingName,pendingMime;long lastContentCheck=0;
 @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"}) public void onCreate(Bundle saved){
  super.onCreate(saved);getWindow().setStatusBarColor(Color.BLACK);getWindow().setNavigationBarColor(Color.BLACK);
  LinearLayout root=new LinearLayout(this);root.setOrientation(1);root.setBackgroundColor(0xff111111);setContentView(root);
  root.setOnApplyWindowInsetsListener((v,in)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=in.getInsets(WindowInsets.Type.systemBars());root.setPadding(bars.left,bars.top,bars.right,bars.bottom);}else root.setPadding(in.getSystemWindowInsetLeft(),in.getSystemWindowInsetTop(),in.getSystemWindowInsetRight(),in.getSystemWindowInsetBottom());return in;});
  LinearLayout header=new LinearLayout(this);header.setGravity(Gravity.CENTER_VERTICAL);header.setPadding(14,6,8,6);root.addView(header,new LinearLayout.LayoutParams(-1,dp(54)));
  TextView title=new TextView(this);title.setText("ဂိုးဇုံ အားကစား ဂျာနယ်");title.setTextColor(0xffedc66b);title.setTextSize(15);title.setTypeface(null,1);header.addView(title,new LinearLayout.LayoutParams(0,-1,1));title.setGravity(Gravity.CENTER_VERTICAL);
  Button menu=new Button(this);menu.setText("⋮");menu.setTextColor(0xffedc66b);menu.setBackgroundColor(Color.TRANSPARENT);header.addView(menu,new LinearLayout.LayoutParams(dp(50),-1));menu.setOnClickListener(v->menu(menu));
  progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);root.addView(progress,new LinearLayout.LayoutParams(-1,dp(3)));
  FrameLayout area=new FrameLayout(this);root.addView(area,new LinearLayout.LayoutParams(-1,0,1));web=new WebView(this);web.setBackgroundColor(0xff111111);area.addView(web,new FrameLayout.LayoutParams(-1,-1));
  offline=new LinearLayout(this);offline.setOrientation(1);offline.setGravity(Gravity.CENTER);offline.setPadding(25,25,25,25);offline.setBackgroundColor(0xff171717);TextView info=new TextView(this);info.setText("ချိတ်ဆက်မှု မရပါ။\n\nအင်တာနက်စစ်ပြီး ပြန်ကြိုးစားပါ။\nမချိတ်နိုင်ပါက VPN ဖြင့် စမ်းကြည့်နိုင်ပါသည်။");info.setTextColor(Color.WHITE);info.setGravity(Gravity.CENTER);offline.addView(info);Button retry=new Button(this);retry.setText("ပြန်ချိတ်မယ်");offline.addView(retry);retry.setOnClickListener(v->{offline.setVisibility(View.GONE);web.reload();});area.addView(offline,new FrameLayout.LayoutParams(-1,-1));offline.setVisibility(View.GONE);
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setSupportMultipleWindows(false);settings.setUserAgentString(settings.getUserAgentString()+" FutureCodeJournalAndroid/1.0");CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  web.addJavascriptInterface(new NativeSave(),"FCJournalNative");
  web.setWebViewClient(new WebViewClient(){
   public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest r){String u=r.getUrl().toString();if(Policy.trustedPage(u))return false;if("https".equals(r.getUrl().getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,r.getUrl()));}catch(Exception ignored){}return true;}
   public void onPageStarted(WebView w,String u,android.graphics.Bitmap b){currentPage=u;offline.setVisibility(View.GONE);progress.setVisibility(View.VISIBLE);}
   public void onPageCommitVisible(WebView w,String u){installSaveHook(w,u);}
   public void onPageFinished(WebView w,String u){currentPage=u;progress.setVisibility(View.GONE);installSaveHook(w,u);}
   public void onReceivedError(WebView w,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame()){android.util.Log.e("FCJournalWeb",String.valueOf(e.getDescription()));offline.setVisibility(View.VISIBLE);}}
   public void onReceivedHttpError(WebView w,WebResourceRequest r,WebResourceResponse e){if(r.isForMainFrame()&&e.getStatusCode()>=400)offline.setVisibility(View.VISIBLE);}
  });
  web.setWebChromeClient(new WebChromeClient(){public boolean onConsoleMessage(ConsoleMessage m){android.util.Log.d("FCJournalWeb",m.message());return true;}public void onProgressChanged(WebView w,int n){progress.setProgress(n);}});
  web.setDownloadListener((url,ua,cd,mime,length)->{if(!Policy.trustedPage(currentPage))return;if(url.startsWith("blob:")||url.startsWith("data:image/")||(url.startsWith(Policy.ORIGIN+"/")&&mime!=null&&mime.startsWith("image/")))web.evaluateJavascript("window.FCJournalSave&&window.FCJournalSave("+JSONObject.quote(url)+","+JSONObject.quote(URLUtil.guessFileName(url,cd,mime))+")",null);else msg("ပုံ Download ခလုတ်ကို အသုံးပြုပါ။");});
  if(saved==null)openIntent(getIntent());else web.restoreState(saved);
  ContentNotifier.channels(this);JournalJob.schedule(this);
  firstRunPermissions();
 }
 void installSaveHook(WebView w,String u){if(Policy.trustedPage(u))try{w.evaluateJavascript(new String(readAsset("native-save.js"),"UTF-8"),null);}catch(Exception e){msg("ပုံ Download စနစ်ကို ပြန်ဖွင့်ရန် Refresh နှိပ်ပါ။");}}
 byte[] readAsset(String name)throws IOException{try(InputStream in=getAssets().open(name);ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toByteArray();}}
 void openIntent(Intent i){String route=i.getStringExtra("route");web.loadUrl(Policy.trustedPage(route)?route:Policy.HOME);if(i.getBooleanExtra("checkUpdate",false))AppUpdate.check(this,true);}
 @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);openIntent(i);}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();JournalJob.schedule(this);if(System.currentTimeMillis()-lastContentCheck>180000){lastContentCheck=System.currentTimeMillis();new Thread(()->{try{ContentNotifier.check(this);}catch(Exception ignored){}},"ForegroundReports").start();}AppUpdate.check(this,false);}
 @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
 void firstRunPermissions(){
  if(getPreferences(0).getBoolean("permissions_intro_v2",false))return;
  new AlertDialog.Builder(this).setTitle("အသိပေးချက်နှင့် ပုံသိမ်းခွင့်")
   .setMessage("သတင်းနှင့် ပေါက်ကြေးအသစ်များအတွက် Notification ကို Allow လုပ်ပေးပါ။\n\nပုံများကို Gallery / Pictures ထဲ သိမ်းပေးမည်။ Android 9 နှင့်အောက်တွင် ပုံသိမ်းခွင့်ကို Allow လုပ်ပေးပါ။ Android 10 နှင့်အထက်တွင် မိမိပုံများသိမ်းရန် Gallery အားလုံးကို ဖတ်ခွင့်ပေးရန် မလိုပါ။")
   .setPositiveButton("ဆက်လုပ်မယ်",(d,w)->{getPreferences(0).edit().putBoolean("permissions_intro_v2",true).apply();requestNeededPermissions();})
   .setNegativeButton("နောက်မှ",null).show();
 }
 void requestNeededPermissions(){
  java.util.ArrayList<String> needed=new java.util.ArrayList<>();
  if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)needed.add(Manifest.permission.POST_NOTIFICATIONS);
  if(Build.VERSION.SDK_INT<=28&&checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED)needed.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
  if(!needed.isEmpty())requestPermissions(needed.toArray(new String[0]),302);
  else if(!getSystemService(NotificationManager.class).areNotificationsEnabled())new AlertDialog.Builder(this).setTitle("အသိပေးချက် ပိတ်ထားသည်").setMessage("အသိပေးချက်ရရန် Settings တွင် ဖွင့်ပေးပါ။").setPositiveButton("Settings",(d,w)->startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()))).setNegativeButton("နောက်မှ",null).show();
 }
 @Override public void onRequestPermissionsResult(int request,String[] names,int[] results){
  super.onRequestPermissionsResult(request,names,results);
  if(request==302||request==303){
   if(Build.VERSION.SDK_INT<=28&&pendingImage!=null){
    byte[] bytes=pendingImage;String name=pendingName,mime=pendingMime;pendingImage=null;
    if(checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)==PackageManager.PERMISSION_GRANTED)new Thread(()->{try{saveLegacyImage(bytes,name,mime);}catch(Exception e){runOnUiThread(()->msg("ပုံ သိမ်းမရပါ။ ဖုန်းသိုလှောင်မှုကို စစ်ပါ။"));}},"SaveGallery").start();
    else new AlertDialog.Builder(this).setTitle("ပုံသိမ်းခွင့် လိုအပ်သည်").setMessage("Gallery ထဲ ပုံသိမ်းရန် App permissions တွင် Storage ကို ခွင့်ပြုပေးပါ။ ပြီးလျှင် Download ပြန်နှိပ်ပါ။").setPositiveButton("Settings",(d,w)->startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+getPackageName())))).setNegativeButton("နောက်မှ",null).show();
   }
  }
 }
 void saveLegacyImage(byte[] bytes,String filename,String mime)throws IOException{
  File folder=new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),"Goal Zone Sports Journal");
  if(!folder.isDirectory()&&!folder.mkdirs())throw new IOException("Pictures folder unavailable");
  File file=new File(folder,filename);if(file.exists())file=new File(folder,System.currentTimeMillis()+"-"+filename);
  try(FileOutputStream out=new FileOutputStream(file)){out.write(bytes);out.flush();}catch(IOException e){file.delete();throw e;}
  android.media.MediaScannerConnection.scanFile(this,new String[]{file.getAbsolutePath()},new String[]{mime},(path,uri)->runOnUiThread(()->msg(uri!=null?"ပုံကို Gallery / Pictures ထဲ သိမ်းပြီးပါပြီ။":"ပုံကို Pictures ထဲ သိမ်းပြီးပါပြီ။ Gallery ကို ပြန်ဖွင့်ကြည့်ပါ။")));
 }

 void menu(View anchor){PopupMenu p=new PopupMenu(this,anchor);String[] titles={"ပွဲကြိုသုံးသပ်ချက်များ","ပေါက်ကြေးများ","AI ခန့်မှန်းချက်","ပြန်လည်ရယူရန်","အသိပေးချက် Settings","App Update စစ်ရန်","App အကြောင်း"};for(int n=0;n<titles.length;n++)p.getMenu().add(0,n,n,titles[n]);p.setOnMenuItemClickListener(item->{switch(item.getItemId()){case 0:web.loadUrl(Policy.HOME);break;case 1:web.loadUrl(Policy.HOME+"odds");break;case 2:web.loadUrl(Policy.HOME+"#fcj-ai");break;case 3:web.reload();break;case 4:startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));break;case 5:AppUpdate.check(this,true);break;case 6:new AlertDialog.Builder(this).setTitle("ဂိုးဇုံ အားကစား ဂျာနယ်").setMessage("Version 1.0.1\n\nပွဲကြို၊ ပေါက်ကြေး၊ AI ခန့်မှန်းချက်နှင့် PNG Download\n\nအသိပေးချက်သည် အင်တာနက်နှင့် ဖုန်း၏ နောက်ခံလုပ်ဆောင်ခွင့်အပေါ် မူတည်ပါသည်။ App ပိတ်ထားစဉ် အနည်းဆုံး ၁၅ မိနစ်ခြား စစ်ဆေးပြီး Battery စနစ်ကြောင့် နောက်ကျနိုင်ပါသည်။").setPositiveButton("အိုကေ",null).show();break;}return true;});p.show();}
 class NativeSave {
  @JavascriptInterface public void error(){runOnUiThread(()->msg("ပုံသိမ်းမရပါ။ ပြန်စမ်းပါ။"));}
  @JavascriptInterface public void save(String data,String name){if(!Policy.trustedPage(currentPage))return;new Thread(()->{try{
   if(data==null||data.length()>35000000||!data.startsWith("data:image/"))throw new IOException();int comma=data.indexOf(',');if(comma<0||comma>120||!data.substring(0,comma).endsWith(";base64"))throw new IOException();String mime=data.substring(5,data.indexOf(';')).toLowerCase(Locale.ROOT);if(!mime.matches("image/(png|jpeg|webp|gif)"))throw new IOException();byte[] bytes=Base64.decode(data.substring(comma+1),Base64.DEFAULT);if(bytes.length==0||bytes.length>24000000)throw new IOException();String ext=mime.equals("image/jpeg")?".jpg":mime.equals("image/webp")?".webp":mime.equals("image/gif")?".gif":".png";String filename=(name==null?"":name).replaceAll("[\\\\/\\p{Cntrl}]","_");if(filename.length()>120)filename=filename.substring(0,120);if(filename.isEmpty())filename="Goal-Zone-Journal-"+System.currentTimeMillis()+ext;if(!filename.toLowerCase(Locale.ROOT).endsWith(ext))filename+=ext;
   if(Build.VERSION.SDK_INT>=29){ContentValues v=new ContentValues();v.put(MediaStore.Images.Media.DISPLAY_NAME,filename);v.put(MediaStore.Images.Media.MIME_TYPE,mime);v.put(MediaStore.Images.Media.RELATIVE_PATH,Environment.DIRECTORY_PICTURES+"/Goal Zone Sports Journal");v.put(MediaStore.Images.Media.IS_PENDING,1);Uri target=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,v);if(target==null)throw new IOException();try{try(OutputStream out=getContentResolver().openOutputStream(target)){if(out==null)throw new IOException();out.write(bytes);}ContentValues done=new ContentValues();done.put(MediaStore.Images.Media.IS_PENDING,0);if(getContentResolver().update(target,done,null,null)<1)throw new IOException("Gallery publish failed");}catch(Exception e){getContentResolver().delete(target,null,null);throw e;}runOnUiThread(()->msg("ပုံကို Gallery / Pictures ထဲ သိမ်းပြီးပါပြီ။"));}
   else{if(checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)==PackageManager.PERMISSION_GRANTED)saveLegacyImage(bytes,filename,mime);else{final String output=filename;runOnUiThread(()->{if(pendingImage!=null){msg("ပုံသိမ်းခွင့်ကို အရင်ခွင့်ပြုပေးပါ။");return;}pendingImage=bytes;pendingMime=mime;pendingName=output;requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},303);});}}
  }catch(Exception e){error();}},"SaveJournalImage").start();}
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==401){if(getPackageManager().canRequestPackageInstalls())AppUpdate.install(this);return;}if(request==201){byte[] bytes=pendingImage;pendingImage=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){Uri uri=data.getData();new Thread(()->{try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new IOException();out.write(bytes);runOnUiThread(()->msg("ပုံ သိမ်းပြီးပါပြီ။"));}catch(Exception e){runOnUiThread(()->msg("ပုံ သိမ်းမရပါ။"));}}).start();}}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onSaveInstanceState(Bundle b){web.saveState(b);super.onSaveInstanceState(b);}
 @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("FCJournalNative");web.destroy();}super.onDestroy();}
 int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
 void msg(String text){if(!isFinishing())Toast.makeText(this,text,Toast.LENGTH_LONG).show();}
}
