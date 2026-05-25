package bitacora.v2.pasos;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "ContadorPasos",
    permissions = {
        @Permission(alias = "actividad", strings = { Manifest.permission.ACTIVITY_RECOGNITION }),
        @Permission(alias = "notificaciones", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class PluginContadorPasos extends Plugin {
    private BroadcastReceiver receptorPasos;

    @Override
    public void load() {
        super.load();
        receptorPasos = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) {
                    return;
                }
                JSObject datos = new JSObject();
                datos.put("pasosDia", intent.getIntExtra("pasosDia", 0));
                datos.put("pasosSesion", intent.getIntExtra("pasosSesion", 0));
                datos.put("sesionActiva", intent.getBooleanExtra("sesionActiva", false));
                notifyListeners("actualizacionPasos", datos);
            }
        };
        ContextCompat.registerReceiver(
            getContext(),
            receptorPasos,
            new IntentFilter(ConstantesPasos.EVENTO_ACTUALIZACION_PASOS),
            ContextCompat.RECEIVER_EXPORTED
        );
    }

    @Override
    protected void handleOnDestroy() {
        if (receptorPasos != null) {
            getContext().unregisterReceiver(receptorPasos);
            receptorPasos = null;
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void solicitarPermisos(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            JSObject datos = new JSObject();
            datos.put("ok", true);
            call.resolve(datos);
            return;
        }
        if (hasRequiredPermissions()) {
            JSObject datos = new JSObject();
            datos.put("ok", true);
            call.resolve(datos);
            return;
        }
        requestAllPermissions(call, "callbackPermisos");
    }

    @PermissionCallback
    @SuppressWarnings("unused")
    private void callbackPermisos(PluginCall call) {
        JSObject datos = new JSObject();
        datos.put("ok", hasRequiredPermissions());
        call.resolve(datos);
    }

    @PluginMethod
    public void iniciarMonitoreoPasos(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(ConstantesPasos.PREFS_PASOS, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(ConstantesPasos.CLAVE_MONITOREO_HABILITADO, true).apply();
        Intent intent = new Intent(getContext(), ServicioContadorPasos.class);
        intent.setAction(ConstantesPasos.ACCION_INICIAR_SERVICIO);
        ContextCompat.startForegroundService(getContext(), intent);
        JSObject datos = new JSObject();
        datos.put("ok", true);
        call.resolve(datos);
    }

    @PluginMethod
    public void detenerMonitoreoPasos(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(ConstantesPasos.PREFS_PASOS, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(ConstantesPasos.CLAVE_MONITOREO_HABILITADO, false).apply();
        Intent intent = new Intent(getContext(), ServicioContadorPasos.class);
        intent.setAction(ConstantesPasos.ACCION_DETENER_SERVICIO);
        getContext().startService(intent);
        JSObject datos = new JSObject();
        datos.put("ok", true);
        call.resolve(datos);
    }

    @PluginMethod
    public void iniciarSesion(PluginCall call) {
        Intent intent = new Intent(getContext(), ServicioContadorPasos.class);
        intent.setAction(ConstantesPasos.ACCION_INICIAR_SESION);
        getContext().startService(intent);
        JSObject datos = new JSObject();
        datos.put("ok", true);
        call.resolve(datos);
    }

    @PluginMethod
    public void detenerSesion(PluginCall call) {
        Intent intent = new Intent(getContext(), ServicioContadorPasos.class);
        intent.setAction(ConstantesPasos.ACCION_DETENER_SESION);
        getContext().startService(intent);
        JSObject datos = new JSObject();
        datos.put("ok", true);
        call.resolve(datos);
    }

    @PluginMethod
    public void obtenerEstadoMonitoreo(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(ConstantesPasos.PREFS_PASOS, Context.MODE_PRIVATE);
        JSObject datos = new JSObject();
        datos.put("pasosDia", prefs.getInt("pasosDia", 0));
        datos.put("pasosSesion", prefs.getInt("pasosSesion", 0));
        datos.put("sesionActiva", prefs.getBoolean("sesionActiva", false));
        datos.put("ultimaActualizacion", prefs.getLong("ultimaActualizacion", 0L));
        datos.put("fechaDia", prefs.getString("fechaDia", ""));
        datos.put("ultimoMotivoSesion", prefs.getString("ultimoMotivoSesion", ""));
        call.resolve(datos);
    }
}
