package bitacora.v2.pasos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class ReceptorReinicioPasos extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            SharedPreferences prefs = context.getSharedPreferences(ConstantesPasos.PREFS_PASOS, Context.MODE_PRIVATE);
            boolean monitoreoHabilitado = prefs.getBoolean(ConstantesPasos.CLAVE_MONITOREO_HABILITADO, false);
            if (monitoreoHabilitado) {
                ServicioContadorPasos.iniciarServicio(context);
            }
        }
    }
}
