// ConfiguracionEtiqueta5x10.js
export const configuracionEtiqueta5x10 = {
  // ===== IDENTIFICACIÓN =====
  nombre: '5x10 cm',
  id: '5x10cm',

  // ===== DIMENSIONES DE PÁGINA =====
  pagina: {
    ancho: 100, // 10cm de largo (horizontal)
    alto: 50, // 5cm de ancho (vertical)
    margenes: {
      todos: 2.5,
    },
  },

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba centrado - ADAPTATIVO) =====
  codigoArticulo: {
    // Tamaños automáticos según longitud del código
    tamanosAutomaticos: {
      corto: { hasta: 13, tamano: 25 }, // <= 13 chars → 25pt
      mediano: { hasta: 18, tamano: 20 }, // <= 18 chars → 20pt
      largo: { hasta: 23, tamano: 18 }, // <= 23 chars → 18pt
      muyLargo: { desde: 24, tamano: 12 }, // >= 24 chars → 12pt
    },
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    posicionY: 7.5, // mm desde arriba (proporcional: 15/2)
  },

  // ===== DIV 2: CÓDIGO DE BARRAS (centro) =====
  codigoBarra: {
    ancho: 73, // proporcional: 110 * 0.66
    alto: 11, // proporcional: 17 * 0.66
    posicionY: 10.5, // proporcional: 16 * 0.66
    centrado: true,
    tamanoBarras: 'mediano',
  },

  // ===== DIV 3: DESCRIPCIÓN (centrada, tamaño y posición adaptativa) =====
  descripcion: {
    // Tamaños automáticos según longitud del texto
    tamanosAutomaticos: {
      muyCorta: { hasta: 15, tamano: 30 }, // <= 15 chars → 30pt
      corta: { hasta: 25, tamano: 26 }, // <= 25 chars → 26pt
      mediana: { hasta: 35, tamano: 23 }, // <= 35 chars → 23pt
      larga: { hasta: 45, tamano: 20 }, // <= 45 chars → 20pt
      muyLarga: { hasta: 60, tamano: 17 }, // <= 60 chars → 17pt
      extraLarga: { hasta: 80, tamano: 14 }, // <= 80 chars → 14pt
      gigante: { desde: 100, tamano: 12 }, // <= 100 chars → 12pt
    },

    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    anchoMaximo: 93, // mm (proporcional: 140 * 0.66)
    interlineadoFactor: 0.35,
    maximoLineas: 5,

    // Posiciones Y dinámicas según cantidad de líneas
    posicionesYPorLineas: {
      1: 32, // proporcional: 55 * 0.66
      2: 29, // proporcional: 56 * 0.66
      3: 27, // proporcional: 45 * 0.66
      4: 25, // proporcional: 46 * 0.66
      5: 25, // proporcional: 44 * 0.66
    },
  },

  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  ubicacion: {
    tamanoFuente: 6.5, // proporcional: 10 * 0.66
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'normal',
    alineacion: 'left',
    posicionX: 2.5, // margen izquierdo
    posicionY: 47.5, // mm desde arriba (50mm - 2.5mm de margen)
  },

  // ===== CONFIGURACIONES ADICIONALES =====
  extras: {
    mostrarBordes: false,
    colorFondo: [255, 255, 255],
    mostrarGuias: false,
  },
}
