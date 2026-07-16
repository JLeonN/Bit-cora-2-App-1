package bitacora.v2;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "ArchivoCompartido")
public class PluginArchivoCompartido extends Plugin {
    private static final String NOMBRE_PREFS = "archivo_compartido_prefs";
    private static final String CLAVE_URI = "archivo_compartido_uri";
    private static final String CLAVE_NOMBRE = "archivo_compartido_nombre";
    private static final String CLAVE_TIPO = "archivo_compartido_tipo";

    public static void procesarIntentCompartido(Context context, Intent intent) {
        if (context == null || intent == null) {
            return;
        }

        String accion = intent.getAction();
        Uri uri = null;

        if (Intent.ACTION_SEND.equals(accion)) {
            Object extra = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (extra instanceof Uri) {
                uri = (Uri) extra;
            }
        } else if (Intent.ACTION_VIEW.equals(accion)) {
            uri = intent.getData();
        }

        if (uri == null) {
            return;
        }

        String nombre = obtenerNombreArchivo(context, uri);
        Uri uriLocal = copiarArchivoACache(context, uri, nombre);
        SharedPreferences prefs = context.getSharedPreferences(NOMBRE_PREFS, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(CLAVE_URI, (uriLocal == null ? uri : uriLocal).toString())
            .putString(CLAVE_NOMBRE, nombre == null ? "" : nombre)
            .putString(CLAVE_TIPO, intent.getType() == null ? "" : intent.getType())
            .apply();
    }

    private static Uri copiarArchivoACache(Context context, Uri uri, String nombre) {
        if (context == null || uri == null) {
            return null;
        }
        String extension = "";
        if (nombre != null) {
            int ultimoPunto = nombre.lastIndexOf('.');
            if (ultimoPunto >= 0) {
                extension = nombre.substring(ultimoPunto);
            }
        }
        File destino = new File(context.getCacheDir(), "archivoCompartido_" + System.currentTimeMillis() + extension);
        try (InputStream origen = abrirArchivo(context, uri); FileOutputStream salida = new FileOutputStream(destino)) {
            if (origen == null) {
                return null;
            }
            byte[] buffer = new byte[8192];
            int bytesLeidos;
            while ((bytesLeidos = origen.read(buffer)) != -1) {
                salida.write(buffer, 0, bytesLeidos);
            }
            return Uri.fromFile(destino);
        } catch (Exception ex) {
            if (destino.exists()) {
                destino.delete();
            }
            return null;
        }
    }

    private static InputStream abrirArchivo(Context context, Uri uri) throws Exception {
        if ("file".equalsIgnoreCase(uri.getScheme())) {
            return new FileInputStream(new File(uri.getPath()));
        }
        return context.getContentResolver().openInputStream(uri);
    }

    private static String obtenerNombreArchivo(Context context, Uri uri) {
        if (uri == null) {
            return "";
        }
        String nombre = "";
        try {
            if ("content".equalsIgnoreCase(uri.getScheme())) {
                Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
                if (cursor != null) {
                    int indice = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (cursor.moveToFirst() && indice >= 0) {
                        nombre = cursor.getString(indice);
                    }
                    cursor.close();
                }
            }
            if (nombre == null || nombre.isEmpty()) {
                String ruta = uri.getPath();
                if (ruta != null) {
                    int ultimaBarra = ruta.lastIndexOf('/');
                    nombre = ultimaBarra >= 0 ? ruta.substring(ultimaBarra + 1) : ruta;
                }
            }
        } catch (Exception ex) {
            nombre = "";
        }
        return nombre == null ? "" : nombre;
    }

    @PluginMethod
    public void obtenerArchivoCompartidoPendiente(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(NOMBRE_PREFS, Context.MODE_PRIVATE);
        String uri = prefs.getString(CLAVE_URI, null);
        String nombre = prefs.getString(CLAVE_NOMBRE, "");
        String tipo = prefs.getString(CLAVE_TIPO, "");
        JSObject datos = new JSObject();
        datos.put("uri", uri);
        datos.put("nombre", nombre);
        datos.put("tipo", tipo);
        call.resolve(datos);
    }

    @PluginMethod
    public void limpiarArchivoCompartidoPendiente(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(NOMBRE_PREFS, Context.MODE_PRIVATE);
        String uriTexto = prefs.getString(CLAVE_URI, null);
        if (uriTexto != null) {
            Uri uri = Uri.parse(uriTexto);
            if ("file".equalsIgnoreCase(uri.getScheme()) && uri.getPath() != null) {
                new File(uri.getPath()).delete();
            }
        }
        prefs.edit().remove(CLAVE_URI).remove(CLAVE_NOMBRE).remove(CLAVE_TIPO).apply();
        JSObject datos = new JSObject();
        datos.put("exito", true);
        call.resolve(datos);
    }

    @PluginMethod
    public void leerTextoArchivoCompartido(PluginCall call) {
        String uriTexto = call.getString("uri");
        if (uriTexto == null || uriTexto.trim().isEmpty()) {
            call.reject("URI inválida para leer archivo compartido.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("No hay actividad activa para leer archivo compartido.");
            return;
        }

        try {
            Uri uri = Uri.parse(uriTexto);
            InputStream inputStream = abrirArchivo(activity, uri);
            if (inputStream == null) {
                call.reject("No se pudo abrir el archivo compartido.");
                return;
            }

            StringBuilder contenido = new StringBuilder();
            BufferedReader lector = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
            String linea;
            while ((linea = lector.readLine()) != null) {
                contenido.append(linea).append('\n');
            }
            lector.close();
            inputStream.close();

            JSObject datos = new JSObject();
            datos.put("texto", contenido.toString());
            call.resolve(datos);
        } catch (Exception ex) {
            call.reject("No se pudo leer el contenido del archivo compartido.");
        }
    }

    @PluginMethod
    public void leerArchivoCompartidoComoBase64(PluginCall call) {
        String uriTexto = call.getString("uri");
        if (uriTexto == null || uriTexto.trim().isEmpty()) {
            call.reject("URI inválida para leer archivo compartido.");
            return;
        }

        try (InputStream inputStream = abrirArchivo(getContext(), Uri.parse(uriTexto));
             ByteArrayOutputStream contenido = new ByteArrayOutputStream()) {
            if (inputStream == null) {
                call.reject("No se pudo abrir el archivo compartido.");
                return;
            }
            byte[] buffer = new byte[8192];
            int bytesLeidos;
            while ((bytesLeidos = inputStream.read(buffer)) != -1) {
                contenido.write(buffer, 0, bytesLeidos);
            }
            JSObject datos = new JSObject();
            datos.put("base64", Base64.encodeToString(contenido.toByteArray(), Base64.NO_WRAP));
            call.resolve(datos);
        } catch (Exception ex) {
            call.reject("No se pudo leer el archivo compartido.");
        }
    }
}
