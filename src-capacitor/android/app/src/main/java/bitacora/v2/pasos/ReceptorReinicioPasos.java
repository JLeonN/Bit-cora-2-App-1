package bitacora.v2.pasos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReceptorReinicioPasos extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            ServicioContadorPasos.iniciarServicio(context);
        }
    }
}

