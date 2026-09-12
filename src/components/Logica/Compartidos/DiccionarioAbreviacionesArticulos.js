const EQUIVALENCIAS_ABREVIACIONES = Object.freeze({
  LAT: 'LATERAL',
  LATER: 'LATERAL',
  DER: 'DERECHA',
  DCHA: 'DERECHA',
  DERECHO: 'DERECHA',
  IZQ: 'IZQUIERDA',
  IZDA: 'IZQUIERDA',
  IZQUIERDO: 'IZQUIERDA',
  DEL: 'DELANTERO',
  DELANT: 'DELANTERO',
  DELANTERA: 'DELANTERO',
  TRAS: 'TRASERO',
  TRASERA: 'TRASERO',
  SUP: 'SUPERIOR',
  INF: 'INFERIOR',
  EXT: 'EXTERIOR',
  CENT: 'CENTRAL',
  JGO: 'JUEGO',
  CJTO: 'CONJUNTO',
  ORIG: 'ORIGINAL',
  VDE: 'VERDE',
  VERD: 'VERDE',
  ROJ: 'ROJO',
  ROJA: 'ROJO',
  AZU: 'AZUL',
  NEG: 'NEGRO',
  NGR: 'NEGRO',
  NEGRA: 'NEGRO',
  BCO: 'BLANCO',
  BCA: 'BLANCO',
  BLANCA: 'BLANCO',
  AMAR: 'AMARILLO',
  AMARILLA: 'AMARILLO',
})

export function expandirAbreviacionesArticulo(textoNormalizado) {
  return String(textoNormalizado || '')
    .split(' ')
    .filter(Boolean)
    .map((palabra) => EQUIVALENCIAS_ABREVIACIONES[palabra] || palabra)
    .join(' ')
}

export function sonPalabrasEquivalentesArticulo(palabraA, palabraB) {
  if (palabraA === palabraB) return true
  const palabraCorta = palabraA.length <= palabraB.length ? palabraA : palabraB
  const palabraLarga = palabraA.length > palabraB.length ? palabraA : palabraB
  return palabraCorta.length >= 3 && palabraLarga.startsWith(palabraCorta)
}
