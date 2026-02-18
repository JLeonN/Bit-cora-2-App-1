<template>
  <div v-if="mostrarBanner" class="contenedor-banner-admob">
    <div id="banner-admob" class="banner-admob"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'
import { tieneAccesoVIP } from '../BaseDeDatos/usoAlmacenamientoVIP'

const mostrarBanner = ref(false)
let bannerInicializado = ref(false)

// Emits para comunicar al padre si el banner está visible
const emit = defineEmits(['banner-visible'])

// ID de prueba de Google (cambiar en producción)
// const BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111'

// ID de producción
const BANNER_AD_UNIT_ID = 'ca-app-pub-7620083100302566/1645913333'

onMounted(async () => {
  console.log('[AdMob] Inicializando componente banner...')

  // Verificar si el usuario es VIP
  const esVIP = await tieneAccesoVIP()

  if (esVIP) {
    console.log('[AdMob] Usuario VIP detectado - Banner desactivado')
    mostrarBanner.value = false
    emit('banner-visible', false) // Notificar al padre
    return
  }

  console.log('[AdMob] Usuario estándar - Mostrando banner')
  mostrarBanner.value = true
  emit('banner-visible', true) // Notificar al padre

  // Inicializar AdMob
  try {
    await inicializarAdMob()
  } catch (error) {
    console.error('[AdMob] Error al inicializar:', error)
  }
})

onUnmounted(async () => {
  if (bannerInicializado.value) {
    try {
      await AdMob.removeBanner()
      console.log('[AdMob] Banner removido correctamente')
    } catch (error) {
      console.error('[AdMob] Error al remover banner:', error)
    }
  }
})

// Función para inicializar AdMob
const inicializarAdMob = async () => {
  try {
    // Inicializar SDK de AdMob
    console.log('[AdMob] Inicializando SDK...')
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      testingDevices: ['YOUR_TEST_DEVICE_ID'],
      initializeForTesting: true,
    })

    console.log('[AdMob] SDK inicializado correctamente')

    // Mostrar banner después de un pequeño delay
    setTimeout(async () => {
      await mostrarBannerPublicitario()
    }, 500)
  } catch (error) {
    console.error('[AdMob] Error en inicialización:', error)
  }
}

// Función para mostrar el banner
const mostrarBannerPublicitario = async () => {
  try {
    console.log('[AdMob] Mostrando banner publicitario...')

    const opciones = {
      adId: BANNER_AD_UNIT_ID,
      adSize: BannerAdSize.BANNER, // 320x50
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false, // Cambiar a false en producción o a true para pruebas
    }

    await AdMob.showBanner(opciones)
    bannerInicializado.value = true

    console.log('[AdMob] Banner mostrado correctamente')
  } catch (error) {
    console.error('[AdMob] Error al mostrar banner:', error)
  }
}
</script>

<style scoped>
.contenedor-banner-admob {
  width: 100%;
  height: 60px; /* Altura estándar de banner (50px + padding) */
  background: var(--color-fondo);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--color-borde);
}
.banner-admob {
  width: 100%;
  height: 50px;
}
</style>
