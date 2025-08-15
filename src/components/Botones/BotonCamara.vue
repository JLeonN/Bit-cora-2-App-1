<template>
  <button type="button" class="boton-camara" @click="abrirCamara">
    <IconCamera :size="18" :stroke="1.5" />
  </button>
</template>

<script setup>
import { Camera, CameraSource } from '@capacitor/camera'
import { IconCamera } from '@tabler/icons-vue'

const abrirCamara = async () => {
  try {
    // Pedir permiso de cámara
    const permiso = await Camera.requestPermissions({ permissions: ['camera'] })
    if (permiso.camera !== 'granted') {
      alert('Necesitamos el permiso de cámara para continuar.')
      return
    }

    // Abrir cámara
    await Camera.getPhoto({
      quality: 80,
      source: CameraSource.Camera,
      resultType: 'Uri',
    })
  } catch (error) {
    console.error('Error al abrir la cámara', error)
  }
}
</script>
