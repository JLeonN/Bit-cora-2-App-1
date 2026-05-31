<template>
  <div v-if="mostrarBanner" class="contenedor-banner-admob">
    <div id="banner-admob" class="banner-admob"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'
import { tieneAccesoVIP } from '../BaseDeDatos/usoAlmacenamientoVIP'
import {
  esModoPruebaPublicidad,
  DISPOSITIVOS_PRUEBA_ADMOB,
  obtenerBannerAdUnitId,
} from '../Configuracion/ConfiguracionPublicidad.js'

const mostrarBanner = ref(false)
const bannerInicializado = ref(false)

// Emit para comunicar al padre si el banner está visible.
const emit = defineEmits(['banner-visible', 'banner-altura'])

const obtenerAlturaBannerEstimada = () => {
  if (typeof window === 'undefined') {
    return 50
  }
  const ancho = window.innerWidth || 0
  const alto = window.innerHeight || 0
  return ancho >= 768 || alto >= 900 ? 90 : 50
}

onMounted(async () => {
  console.log('[AdMob] Inicializando componente banner...')

  // En web no reservamos espacio para banner nativo.
  if (Capacitor.getPlatform() === 'web') {
    mostrarBanner.value = false
    emit('banner-visible', false)
    emit('banner-altura', 0)
    return
  }

  // Verificar si el usuario es VIP.
  const esVIP = await tieneAccesoVIP()

  if (esVIP) {
    console.log('[AdMob] Usuario VIP detectado - Banner desactivado')
    mostrarBanner.value = false
    emit('banner-visible', false)
    emit('banner-altura', 0)
    return
  }

  console.log('[AdMob] Usuario estándar - Mostrando banner')
  mostrarBanner.value = true
  emit('banner-visible', true)
  emit('banner-altura', obtenerAlturaBannerEstimada())

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

const inicializarAdMob = async () => {
  try {
    console.log('[AdMob] Inicializando SDK...')
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      testingDevices: esModoPruebaPublicidad ? DISPOSITIVOS_PRUEBA_ADMOB : [],
      initializeForTesting: esModoPruebaPublicidad,
    })

    console.log('[AdMob] SDK inicializado correctamente')

    setTimeout(async () => {
      await mostrarBannerPublicitario()
    }, 500)
  } catch (error) {
    console.error('[AdMob] Error en inicialización:', error)
  }
}

const mostrarBannerPublicitario = async () => {
  try {
    console.log('[AdMob] Mostrando banner publicitario...')

    const opciones = {
      adId: obtenerBannerAdUnitId(),
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: esModoPruebaPublicidad,
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
  height: 60px;
  background: var(--color-fondo);
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-admob {
  width: 100%;
  height: 50px;
}
</style>
