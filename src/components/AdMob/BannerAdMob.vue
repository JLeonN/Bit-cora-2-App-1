<template>
  <div class="contenedor-banner-admob" aria-hidden="true"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
} from '@capacitor-community/admob'
import { tieneAccesoVIP } from '../BaseDeDatos/usoAlmacenamientoVIP'
import {
  esModoPruebaPublicidad,
  DISPOSITIVOS_PRUEBA_ADMOB,
  obtenerBannerAdUnitId,
} from '../Configuracion/ConfiguracionPublicidad.js'

const bannerInicializado = ref(false)
let escuchaTamanoBanner = null
const ALTURA_MAXIMA_BANNER_CSS = 120
const ALTURA_RESERVA_TELEFONO = 50
const ALTURA_RESERVA_TABLET = 90

// Emit para comunicar al padre si el banner está visible.
const emit = defineEmits(['banner-visible', 'banner-altura'])

onMounted(async () => {
  console.log('[AdMob] Inicializando componente banner...')

  // En web no reservamos espacio para banner nativo.
  if (Capacitor.getPlatform() === 'web') {
    emitirBannerOculto()
    return
  }

  // Verificar si el usuario es VIP.
  const esVIP = await tieneAccesoVIP()

  if (esVIP) {
    console.log('[AdMob] Usuario VIP detectado - Banner desactivado')
    emitirBannerOculto()
    return
  }

  console.log('[AdMob] Usuario estándar - Mostrando banner')
  emitirBannerVisible(obtenerAlturaReservaBanner())

  try {
    await inicializarAdMob()
  } catch (error) {
    console.error('[AdMob] Error al inicializar:', error)
    emitirBannerOculto()
  }
})

onUnmounted(async () => {
  if (escuchaTamanoBanner) {
    try {
      await escuchaTamanoBanner.remove()
      escuchaTamanoBanner = null
    } catch (error) {
      console.error('[AdMob] Error al remover escucha de tamaño:', error)
    }
  }
  if (bannerInicializado.value) {
    try {
      await AdMob.removeBanner()
      console.log('[AdMob] Banner removido correctamente')
    } catch (error) {
      console.error('[AdMob] Error al remover banner:', error)
    }
  }
  emitirBannerOculto()
})

const emitirBannerOculto = () => {
  emit('banner-visible', false)
  emit('banner-altura', 0)
}

const obtenerAlturaReservaBanner = () => {
  if (typeof window === 'undefined') {
    return ALTURA_RESERVA_TELEFONO
  }
  return window.innerWidth >= 768 ? ALTURA_RESERVA_TABLET : ALTURA_RESERVA_TELEFONO
}

const emitirBannerVisible = (alturaBanner) => {
  const alturaReserva = obtenerAlturaReservaBanner()
  const alturaValida = Math.max(Number(alturaBanner) || 0, alturaReserva)
  emit('banner-altura', alturaValida)
  emit('banner-visible', true)
}

const registrarEscuchaTamanoBanner = async () => {
  if (escuchaTamanoBanner) {
    return
  }
  escuchaTamanoBanner = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (tamanoBanner) => {
    const alturaValida = normalizarAlturaBanner(tamanoBanner)
    if (alturaValida > 0) {
      emitirBannerVisible(alturaValida)
      return
    }
    emitirBannerOculto()
  })
}

const normalizarAlturaBanner = (tamanoBanner) => {
  const alturaReportada = Number(tamanoBanner?.height ?? 0)
  if (!Number.isFinite(alturaReportada) || alturaReportada <= 0) {
    return 0
  }
  const anchoReportado = Number(tamanoBanner?.width ?? 0)
  const anchoVentana = typeof window !== 'undefined' ? Number(window.innerWidth || 0) : 0
  const densidadPantalla =
    typeof window !== 'undefined' ? Math.max(Number(window.devicePixelRatio || 1), 1) : 1
  const parecePixelesFisicosPorAncho =
    Number.isFinite(anchoReportado) && anchoReportado > anchoVentana * 1.4
  const parecePixelesFisicosPorAlto =
    alturaReportada > ALTURA_MAXIMA_BANNER_CSS && densidadPantalla > 1
  const debeConvertirACssPx = parecePixelesFisicosPorAncho || parecePixelesFisicosPorAlto
  const alturaNormalizada = debeConvertirACssPx ? alturaReportada / densidadPantalla : alturaReportada
  console.info('[AdMob] Tamaño banner normalizado', {
    anchoReportado,
    alturaReportada,
    densidadPantalla,
    alturaNormalizada,
  })
  return Math.round(Math.max(0, alturaNormalizada))
}

const inicializarAdMob = async () => {
  try {
    console.log('[AdMob] Inicializando SDK...')
    await AdMob.initialize({
      requestTrackingAuthorization: false,
      testingDevices: esModoPruebaPublicidad ? DISPOSITIVOS_PRUEBA_ADMOB : [],
      initializeForTesting: esModoPruebaPublicidad,
    })

    console.log('[AdMob] SDK inicializado correctamente')

    await registrarEscuchaTamanoBanner()
    await new Promise((resolver) => {
      setTimeout(resolver, 500)
    })
    await mostrarBannerPublicitario()
  } catch (error) {
    console.error('[AdMob] Error en inicialización:', error)
    emitirBannerOculto()
  }
}

const mostrarBannerPublicitario = async () => {
  try {
    console.log('[AdMob] Mostrando banner publicitario...')

    const opciones = {
      adId: obtenerBannerAdUnitId(),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: esModoPruebaPublicidad,
    }

    await AdMob.showBanner(opciones)
    bannerInicializado.value = true

    console.log('[AdMob] Banner mostrado correctamente')
  } catch (error) {
    console.error('[AdMob] Error al mostrar banner:', error)
    emitirBannerOculto()
  }
}
</script>

<style scoped>
.contenedor-banner-admob {
  display: none;
}
</style>
