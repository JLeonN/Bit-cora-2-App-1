package bitacora.v2;

import android.content.Context;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory;

public final class ConfiguradorAppCheck {
    private ConfiguradorAppCheck() {}

    public static void inicializar(Context contexto) {
        if (FirebaseApp.getApps(contexto).isEmpty()) FirebaseApp.initializeApp(contexto);
        if (FirebaseApp.getApps(contexto).isEmpty()) return;
        FirebaseAppCheck appCheck = FirebaseAppCheck.getInstance();
        appCheck.installAppCheckProviderFactory(DebugAppCheckProviderFactory.getInstance());
        appCheck.setTokenAutoRefreshEnabled(true);
    }
}
