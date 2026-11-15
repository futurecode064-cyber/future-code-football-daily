package mm.futurecode.sportsjournal;
import org.json.JSONObject;
import java.net.*;
import java.io.*;
public final class Net {
 public static HttpURLConnection open(String address)throws Exception{
  URL url=new URL(address);if(!"https".equals(url.getProtocol())||!"future-code-football-daily.pages.dev".equals(url.getHost()))throw new IOException("Untrusted server");
  HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","FutureCodeSportsJournal/1.0 Android");c.setRequestProperty("Cache-Control","no-cache");return c;
 }
 public static boolean trustedDownload(String address){
  try{URI u=new URI(address);String h=u.getHost(),p=u.getPath();
   if(!"https".equals(u.getScheme())||u.getRawUserInfo()!=null||(u.getPort()!=-1&&u.getPort()!=443))return false;
   return "future-code-football-daily.pages.dev".equals(h)||("github.com".equals(h)&&p!=null&&p.startsWith("/futurecode064-cyber/future-code-football-daily/releases/download/")&&p.endsWith(".apk"))||"release-assets.githubusercontent.com".equals(h)||"objects.githubusercontent.com".equals(h);
  }catch(Exception e){return false;}
 }
 public static HttpURLConnection download(String address)throws Exception{
  for(int i=0;i<6;i++){
   if(!trustedDownload(address))throw new IOException("Untrusted download server");
   HttpURLConnection c=(HttpURLConnection)new URL(address).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","FutureCodeJournal Android");
   int status=c.getResponseCode();if(status==200)return c;
   String location=c.getHeaderField("Location");c.disconnect();
   if(status!=301&&status!=302&&status!=303&&status!=307&&status!=308)throw new IOException("Download response "+status);
   if(location==null)throw new IOException("Missing download redirect");
   address=new URL(new URL(address),location).toString();
  }throw new IOException("Too many download redirects");
 }
 public static JSONObject json(String address)throws Exception{
  HttpURLConnection c=open(address);try{if(c.getResponseCode()!=200)throw new IOException("Server response "+c.getResponseCode());try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(Thread.currentThread().isInterrupted())throw new InterruptedIOException();out.write(b,0,n);if(out.size()>4000000)throw new IOException("Report too large");}return new JSONObject(out.toString("UTF-8"));}}finally{c.disconnect();}
 }
}
