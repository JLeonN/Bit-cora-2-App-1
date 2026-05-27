const normalizarSaltos = (texto = '') => String(texto).replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const dividirLineaPorAncho = (lineaTexto, anchoMaximo, medirAncho) => {
  const palabras = lineaTexto.split(/\s+/).filter(Boolean)
  if (!palabras.length) {
    return ['']
  }
  const lineas = []
  let lineaActual = palabras[0]
  for (let i = 1; i < palabras.length; i += 1) {
    const candidata = `${lineaActual} ${palabras[i]}`
    if (medirAncho(candidata) <= anchoMaximo) {
      lineaActual = candidata
    } else {
      lineas.push(lineaActual)
      lineaActual = palabras[i]
    }
  }
  lineas.push(lineaActual)
  return lineas
}

export const componerLineasDescripcionEtiqueta = ({
  texto = '',
  anchoMaximo = 0,
  maximoLineas = 7,
  medirAncho = () => 0,
}) => {
  const bloquesManual = normalizarSaltos(texto).split('\n')
  const lineas = []
  for (const bloque of bloquesManual) {
    const bloqueRecortado = bloque.trim()
    if (!bloqueRecortado) {
      lineas.push('')
    } else {
      const lineasBloque = dividirLineaPorAncho(bloqueRecortado, anchoMaximo, medirAncho)
      lineas.push(...lineasBloque)
    }
    if (lineas.length >= maximoLineas) {
      break
    }
  }
  return lineas.slice(0, maximoLineas)
}
