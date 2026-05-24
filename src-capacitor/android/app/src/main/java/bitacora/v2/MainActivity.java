package bitacora.v2;

import com.getcapacitor.BridgeActivity;
import bitacora.v2.pasos.PluginContadorPasos;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        Log.d("MainActivityPasos", "Registrando PluginContadorPasos");
        registerPlugin(PluginContadorPasos.class);
        super.onCreate(savedInstanceState);
    }
}
