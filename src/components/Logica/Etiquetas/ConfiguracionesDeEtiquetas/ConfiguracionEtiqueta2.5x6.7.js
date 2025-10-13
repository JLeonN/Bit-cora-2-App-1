// ConfiguracionEtiqueta2.5x6.7.js
export const configuracionEtiqueta2_5x6_7 = {
  // ===== IDENTIFICACIÓN =====
  nombre: '2.5x6.7 cm',
  id: '2.5x6.7cm',

  // ===== DIMENSIONES DE PÁGINA =====
  pagina: {
    ancho: 67, // 6.7cm de largo (horizontal)
    alto: 25, // 2.5cm de ancho (vertical)
    margenes: {
      todos: 1.5,
    },
  },

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba centrado - ADAPTATIVO) =====
  codigoArticulo: {
    // Tamaños automáticos según longitud del código
    tamanosAutomaticos: {
      corto: { hasta: 13, tamano: 12 }, // <= 13 chars → 12pt
      mediano: { hasta: 18, tamano: 10 }, // <= 18 chars → 10pt
      largo: { hasta: 23, tamano: 9 }, // <= 23 chars → 9pt
      muyLargo: { desde: 24, tamano: 7 }, // >= 24 chars → 7pt
    },
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    posicionY: 4, // mm desde arriba (proporcional: 15 * 0.25)
  },

  // ===== DIV 2: CÓDIGO DE BARRAS (centro) =====
  codigoBarra: {
    ancho: 50, // proporcional: 110 * 0.45
    alto: 6, // proporcional: 17 * 0.35
    posicionY: 5.5, // proporcional: 16 * 0.35
    centrado: true,
    tamanoBarras: 'chico',
  },

  // ===== DIV 3: DESCRIPCIÓN (centrada, tamaño y posición adaptativa) =====
  descripcion: {
    // Tamaños automáticos según longitud del texto
    tamanosAutomaticos: {
      muyCorta: { hasta: 15, tamano: 15 }, // <= 15 chars → 15pt
      corta: { hasta: 25, tamano: 13 }, // <= 25 chars → 13pt
      mediana: { hasta: 35, tamano: 11.5 }, // <= 35 chars → 11.5pt
      larga: { hasta: 45, tamano: 10 }, // <= 45 chars → 10pt
      muyLarga: { hasta: 60, tamano: 8.5 }, // <= 60 chars → 8.5pt
      extraLarga: { hasta: 80, tamano: 7 }, // <= 80 chars → 7pt
      gigante: { desde: 100, tamano: 6 }, // <= 100 chars → 6pt
    },

    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    anchoMaximo: 62, // mm (proporcional: 140 * 0.44)
    interlineadoFactor: 0.35,
    maximoLineas: 4, // Reducido por espacio vertical

    // Posiciones Y dinámicas según cantidad de líneas
    posicionesYPorLineas: {
      1: 17, // proporcional: 55 * 0.31
      2: 14.5, // proporcional: 56 * 0.30
      3: 13.5, // proporcional: 45 * 0.32
      4: 14, // proporcional: 46 * 0.30
    },
  },

  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  ubicacion: {
    tamanoFuente: 4.5, // proporcional: 10 * 0.45
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'normal',
    alineacion: 'left',
    posicionX: 1.5, // margen izquierdo
    posicionY: 23.5, // mm desde arriba (25mm - 1.5mm de margen)
  },

  // ===== CONFIGURACIONES ADICIONALES =====
  extras: {
    mostrarBordes: false,
    colorFondo: [255, 255, 255],
    mostrarGuias: false,
  },
}
