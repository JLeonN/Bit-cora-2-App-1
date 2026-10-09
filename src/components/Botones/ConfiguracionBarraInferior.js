export const UMBRAL_IR_AL_FINAL = 15

export function desplazarAlFinalDePagina() {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
}

export function desplazarAlInicioDePagina() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
