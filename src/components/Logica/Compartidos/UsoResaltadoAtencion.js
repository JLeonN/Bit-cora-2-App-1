import { nextTick, onBeforeUnmount, ref } from 'vue'

export function usarResaltadoAtencion(duracion = 2400) {
  const estaResaltado = ref(false)
  let temporizadorResaltado = null

  const activarResaltado = async () => {
    estaResaltado.value = false
    await nextTick()
    estaResaltado.value = true

    if (temporizadorResaltado) clearTimeout(temporizadorResaltado)
    temporizadorResaltado = setTimeout(() => {
      estaResaltado.value = false
      temporizadorResaltado = null
    }, duracion)
  }

  onBeforeUnmount(() => {
    if (temporizadorResaltado) clearTimeout(temporizadorResaltado)
  })

  return {
    estaResaltado,
    activarResaltado,
  }
}
