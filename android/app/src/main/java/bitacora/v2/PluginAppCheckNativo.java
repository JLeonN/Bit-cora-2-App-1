package bitacora.v2;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;

@CapacitorPlugin(name = "AppCheckNativo")
public class PluginAppCheckNativo extends Plugin {
    @PluginMethod
    public void obtenerToken(PluginCall llamada) {
        if (FirebaseApp.getApps(getContext()).isEmpty()) {
            llamada.reject("Firebase no está configurado en esta instalación.");
            return;
        }
        boolean forzarActualizacion = llamada.getBoolean("forzarActualizacion", false);
        FirebaseAppCheck.getInstance().getAppCheckToken(forzarActualizacion)
            .addOnSuccessListener(resultado -> {
                JSObject datos = new JSObject();
                datos.put("token", resultado.getToken());
                datos.put("expireTimeMillis", resultado.getExpireTimeMillis());
                llamada.resolve(datos);
            })
            .addOnFailureListener(error ->
                llamada.reject("No se pudo obtener el token nativo de App Check.", error)
            );
    }
}
