package mm.futurecode.sportsjournal;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
public final class Policy {
 public static final String ORIGIN="https://future-code-football-daily.pages.dev";
 public static final String HOME=ORIGIN+"/future-code-journal/";
 public static final String MANIFEST=HOME+"android/latest.json";
 public static String today(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("Asia/Yangon"));return f.format(new Date());}
 public static String hash(byte[] bytes)throws Exception {byte[] h=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder s=new StringBuilder();for(byte b:h)s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();}
 public static String hash(String text)throws Exception{return hash(text.getBytes("UTF-8"));}
 public static boolean shouldNotify(String reportDate,String today,boolean published,int count,String fingerprint,String seen){return published&&today.equals(reportDate)&&count>0&&!fingerprint.isEmpty()&&!fingerprint.equals(seen);}
 public static boolean trustedPage(String value){try{java.net.URI u=new java.net.URI(value);return "https".equals(u.getScheme())&&"future-code-football-daily.pages.dev".equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443)&&u.getPath()!=null&&(u.getPath().equals("/future-code-journal")||u.getPath().startsWith("/future-code-journal/"));}catch(Exception e){return false;}}
 public static boolean trustedApk(String value){return trustedPage(value)&&java.net.URI.create(value).getPath().startsWith("/future-code-journal/android/")&&java.net.URI.create(value).getPath().endsWith(".apk");}
}
