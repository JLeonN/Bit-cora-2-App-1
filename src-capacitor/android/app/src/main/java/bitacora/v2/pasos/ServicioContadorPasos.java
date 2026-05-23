package bitacora.v2.pasos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import bitacora.v2.MainActivity;
import bitacora.v2.R;

import java.time.LocalDate;

public class ServicioContadorPasos extends Service implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor sensorPasos;
    private SharedPreferences prefs;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences(ConstantesPasos.PREFS_PASOS, MODE_PRIVATE);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            sensorPasos = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }
        crearCanalNotificacion();
        iniciarForeground();
        registrarSensor();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            manejarAccion(intent.getAction());
        }
        return START_STICKY;
    }

    private void manejarAccion(String accion) {
        switch (accion) {
            case ConstantesPasos.ACCION_DETENER_SERVICIO:
                detenerSesionSiActiva("interrumpida");
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
                break;
            case ConstantesPasos.ACCION_INICIAR_SESION:
                iniciarSesionManual();
                break;
            case ConstantesPasos.ACCION_DETENER_SESION:
                detenerSesionSiActiva("manual");
                break;
            default:
                break;
        }
    }

    private void crearCanalNotificacion() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                ConstantesPasos.CANAL_NOTIFICACION_ID,
                "Contador de pasos",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitoreo continuo de pasos");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void iniciarForeground() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            10,
            intent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification notification = new NotificationCompat.Builder(this, ConstantesPasos.CANAL_NOTIFICACION_ID)
            .setContentTitle("Contador de pasos activo")
            .setContentText("Monitoreo 24/7 en ejecución")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();

        startForeground(ConstantesPasos.NOTIFICACION_ID, notification);
    }

    private void registrarSensor() {
        if (sensorManager != null && sensorPasos != null) {
            sensorManager.registerListener(this, sensorPasos, SensorManager.SENSOR_DELAY_NORMAL);
        } else {
            prefs.edit().putString("ultimoError", "sensor_no_disponible").apply();
        }
    }

    private void verificarCambioDeDia(float totalSensor) {
        String fechaGuardada = prefs.getString("fechaDia", "");
        String fechaHoy = LocalDate.now().toString();
        if (!fechaHoy.equals(fechaGuardada)) {
            prefs.edit()
                .putString("fechaDia", fechaHoy)
                .putFloat("baselineDia", totalSensor)
                .putInt("pasosDia", 0)
                .apply();
            detenerSesionSiActiva("finalizadaPorReinicioDiario");
        }
    }

    private void iniciarSesionManual() {
        float totalSensor = prefs.getFloat("ultimoSensorTotal", 0f);
        prefs.edit()
            .putBoolean("sesionActiva", true)
            .putFloat("baselineSesion", totalSensor)
            .putInt("pasosSesion", 0)
            .putLong("inicioSesion", System.currentTimeMillis())
            .putString("ultimoMotivoSesion", "iniciada")
            .apply();
    }

    private void detenerSesionSiActiva(String motivo) {
        boolean sesionActiva = prefs.getBoolean("sesionActiva", false);
        if (!sesionActiva) {
            return;
        }
        prefs.edit()
            .putBoolean("sesionActiva", false)
            .putLong("finSesion", System.currentTimeMillis())
            .putString("ultimoMotivoSesion", motivo)
            .apply();
    }

    private void emitirActualizacion(int pasosDia, int pasosSesion, boolean sesionActiva) {
        Intent intent = new Intent(ConstantesPasos.EVENTO_ACTUALIZACION_PASOS);
        intent.putExtra("pasosDia", pasosDia);
        intent.putExtra("pasosSesion", pasosSesion);
        intent.putExtra("sesionActiva", sesionActiva);
        sendBroadcast(intent);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float totalSensor = event.values[0];
        prefs.edit().putFloat("ultimoSensorTotal", totalSensor).apply();
        verificarCambioDeDia(totalSensor);

        float baselineDia = prefs.getFloat("baselineDia", -1f);
        if (baselineDia < 0f) {
            baselineDia = totalSensor;
            prefs.edit().putFloat("baselineDia", baselineDia).apply();
        }

        int pasosDia = Math.max(0, Math.round(totalSensor - baselineDia));
        boolean sesionActiva = prefs.getBoolean("sesionActiva", false);
        int pasosSesion = prefs.getInt("pasosSesion", 0);

        SharedPreferences.Editor editor = prefs.edit().putInt("pasosDia", pasosDia);
        if (sesionActiva) {
            float baselineSesion = prefs.getFloat("baselineSesion", totalSensor);
            pasosSesion = Math.max(0, Math.round(totalSensor - baselineSesion));
            editor.putInt("pasosSesion", pasosSesion);
        }
        editor.putLong("ultimaActualizacion", System.currentTimeMillis()).apply();

        emitirActualizacion(pasosDia, pasosSesion, sesionActiva);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public void onDestroy() {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static void iniciarServicio(Context context) {
        Intent intent = new Intent(context, ServicioContadorPasos.class);
        intent.setAction(ConstantesPasos.ACCION_INICIAR_SERVICIO);
        ContextCompat.startForegroundService(context, intent);
    }
}

