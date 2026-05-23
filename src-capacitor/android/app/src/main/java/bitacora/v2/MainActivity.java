package bitacora.v2;

import com.getcapacitor.BridgeActivity;
import bitacora.v2.pasos.PluginContadorPasos;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(PluginContadorPasos.class);
        super.onCreate(savedInstanceState);
    }
}
