package bitacora.v2;

import com.getcapacitor.BridgeActivity;
import bitacora.v2.pasos.PluginContadorPasos;
import android.content.Intent;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        ConfiguradorAppCheck.inicializar(this);
        registerPlugin(PluginContadorPasos.class);
        registerPlugin(PluginArchivoCompartido.class);
        registerPlugin(PluginAppCheckNativo.class);
        super.onCreate(savedInstanceState);
        PluginArchivoCompartido.procesarIntentCompartido(this, getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        PluginArchivoCompartido.procesarIntentCompartido(this, intent);
    }
}
