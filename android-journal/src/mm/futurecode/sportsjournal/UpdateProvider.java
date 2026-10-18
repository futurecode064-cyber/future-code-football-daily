package mm.futurecode.sportsjournal;
import android.content.*;
import android.database.*;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.*;
public final class UpdateProvider extends ContentProvider {
 public boolean onCreate(){return true;}
 private File file(Uri u)throws FileNotFoundException {if(!"/update.apk".equals(u.getPath()))throw new FileNotFoundException();File f=new File(getContext().getCacheDir(),"journal-update.apk");if(!f.isFile())throw new FileNotFoundException();return f;}
 public ParcelFileDescriptor openFile(Uri u,String mode)throws FileNotFoundException {if(!"r".equals(mode))throw new FileNotFoundException("Read only");return ParcelFileDescriptor.open(file(u),ParcelFileDescriptor.MODE_READ_ONLY);}
 public String getType(Uri u){return "application/vnd.android.package-archive";}
 public Cursor query(Uri u,String[] projection,String selection,String[] args,String order){try{File f=file(u);String[] cols=projection!=null?projection:new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE};MatrixCursor cursor=new MatrixCursor(cols);Object[] row=new Object[cols.length];for(int i=0;i<cols.length;i++)row[i]=OpenableColumns.SIZE.equals(cols[i])?f.length():OpenableColumns.DISPLAY_NAME.equals(cols[i])?"Goal-Zone-Sports-Journal.apk":null;cursor.addRow(row);return cursor;}catch(Exception e){return null;}}
 public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
}
