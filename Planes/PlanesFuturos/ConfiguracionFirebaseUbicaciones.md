# CONFIGURACIÓN FIREBASE PARA UBICACIONES

Proyecto Firebase: `bitacora-ii-prueba-1`  
Nombre visible: `Bitacora II Prueba 1`  
Firestore: modo nativo, región `southamerica-east1` (São Paulo), free tier.

## Variables de GitHub Pages

En el repositorio `JLeonN/Bit-cora-2-App-1`, crear estas variables de Actions con los valores de la aplicación web Firebase registrada en el proyecto:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

El workflow `PublicarGitHubPages.yml` ya las inyecta al compilar. No guardar esos valores en archivos confirmados por Git.

## Reglas

Las reglas están en `firestore.rules` y ya fueron desplegadas al proyecto de prueba. Permiten crear y leer un documento conocido de `ubicacionesCompartidas`; bloquean listar, editar y borrar.

Para desplegarlas nuevamente:

```powershell
npx firebase-tools deploy --only firestore:rules
```
