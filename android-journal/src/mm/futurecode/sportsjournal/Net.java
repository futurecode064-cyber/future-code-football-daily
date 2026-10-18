package mm.futurecode.sportsjournal;
import org.json.JSONObject;
import java.net.*;
import java.io.*;
public final class Net {
 public static HttpURLConnection open(String address)throws Exception{
  URL url=new URL(address);if(!"https".equals(url.getProtocol())||!"future-code-football-daily.pages.dev".equals(url.getHost()))throw new IOException("Untrusted server");
  HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","FutureCodeSportsJournal/1.0 Android");c.setRequestProperty("Cache-Control","no-cache");return c;
 }
 public static JSONObject json(String address)throws Exception{
  HttpURLConnection c=open(address);try{if(c.getResponseCode()!=200)throw new IOException("Server response "+c.getResponseCode());try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(Thread.currentThread().isInterrupted())throw new InterruptedIOException();out.write(b,0,n);if(out.size()>4000000)throw new IOException("Report too large");}return new JSONObject(out.toString("UTF-8"));}}finally{c.disconnect();}
 }
}
