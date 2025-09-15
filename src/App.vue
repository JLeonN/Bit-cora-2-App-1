<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { SplashScreen } from '@capacitor/splash-screen'

onMounted(() => {
  // Ocultar splash cuando la app esté pronta
  SplashScreen.hide()
})
</script>
