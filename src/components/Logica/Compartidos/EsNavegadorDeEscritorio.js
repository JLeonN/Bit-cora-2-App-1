import { Capacitor } from '@capacitor/core'
import { Platform } from 'quasar'

export function esNavegadorDeEscritorio() {
  if (Capacitor.getPlatform() !== 'web' || Platform.is.desktop !== true) return false
  // Excluye tablets con navegador en modo escritorio y puntero táctil principal.
  return !window.matchMedia?.('(pointer: coarse)')?.matches
}
