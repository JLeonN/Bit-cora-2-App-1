<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara"></div>

      <!-- Parte inferior en negro -->
      <div class="caja-inferior">
        <!-- Botón cancelar -->
        <button class="boton-cancelar" @click="$emit('cerrar')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CameraPreview } from '@capacitor-community/camera-preview'
import { onMounted, onBeforeUnmount } from 'vue'

const iniciarCamara = async () => {
  try {
    await CameraPreview.start({
      parent: 'vista-camara',
      position: 'rear', // Cámara trasera
      width: window.innerWidth,
      height: window.innerHeight / 2,
      x: 0,
      y: 0,
      toBack: false, // Se muestra dentro del div, no detrás del WebView
    })
  } catch (error) {
    console.error('Error al iniciar la cámara:', error)
  }
}

const detenerCamara = async () => {
  try {
    await CameraPreview.stop()
  } catch (error) {
    console.error('Error al detener la cámara:', error)
  }
}

onMounted(() => {
  iniciarCamara()
})

onBeforeUnmount(() => {
  detenerCamara()
})
</script>

<style scoped>
.modal-fondo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85); /* oscurece lo de atrás */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* por encima del modal de pedidos */
}

/* Contenedor principal del modal de cámara */
.modal-camara {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: black;
}

/* Caja de la cámara */
.caja-camara {
  width: 100%;
  height: 60vh; /* probá con 60%, más grande que antes */
  background: black; /* mientras carga la cámara */
  overflow: hidden;

  /* 🔹 EJEMPLOS DE FORMAS:
     - Rectángulo horizontal (default con height: 60vh)
     - Cuadrado -> poné height: 100vw (igual al ancho)
     - Redondo -> poné border-radius: 50%
     - Rectángulo más chico -> bajá height a 40vh, etc.
  */
  border-radius: 0; /* dejalo 0 para rectangular */
}

/* Parte inferior en negro */
.caja-inferior {
  width: 100%;
  height: 40vh;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Botón cancelar */
.boton-cancelar {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #e53935;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.boton-cancelar:hover {
  background: #c62828;
}
</style>
