// ConfiguracionEtiqueta10x15.js
export const configuracionEtiqueta10x15 = {
  // ===== IDENTIFICACIÓN =====
  nombre: '10x15 cm',
  id: '10x15cm',

  // ===== DIMENSIONES DE PÁGINA =====
  pagina: {
    ancho: 150, // 15cm de largo (horizontal)
    alto: 100, // 10cm de ancho (vertical)
    margenes: {
      todos: 4,
    },
  },

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba centrado - ADAPTATIVO) =====
  codigoArticulo: {
    // Tamaños automáticos según longitud del código
    tamanosAutomaticos: {
      corto: { hasta: 13, tamano: 50 }, // <= 13 chars → 50pt (normal)
      mediano: { hasta: 18, tamano: 40 }, // <= 18 chars → 42pt
      largo: { hasta: 23, tamano: 36 }, // <= 23 chars → 36pt
      muyLargo: { desde: 24, tamano: 25 }, // >= 24 chars → 30pt
    },
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    posicionY: 15, // mm desde arriba
  },
  // ===== DIV 2: CÓDIGO DE BARRAS (centro) =====
  codigoBarra: {
    ancho: 90, // Cambiá esto (en mm)
    alto: 17, // Cambiá esto (en mm)
    posicionY: 16, // Cambiá esto (mm desde arriba)
    centrado: true,
    tamanoBarras: 'grande',
  },

  // ===== DIV 3: DESCRIPCIÓN (centrada, tamaño y posición adaptativa) =====
  descripcion: {
    // Tamaños automáticos según longitud del texto (MÁS NIVELES)
    tamanosAutomaticos: {
      muyCorta: { hasta: 15, tamano: 60 }, // <= 15 chars → 60pt
      corta: { hasta: 25, tamano: 52 }, // <= 25 chars → 52pt
      mediana: { hasta: 35, tamano: 46 }, // <= 35 chars → 46pt
      larga: { hasta: 45, tamano: 40 }, // <= 45 chars → 40pt
      muyLarga: { hasta: 60, tamano: 34 }, // <= 60 chars → 34pt
      extraLarga: { hasta: 80, tamano: 28 }, // <= 80 chars → 28pt
      gigante: { desde: 100, tamano: 24 }, // <= 100 chars → 24pt
    },

    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    anchoMaximo: 140, // mm (más ancho disponible en horizontal)
    interlineadoFactor: 0.35, // Factor de espaciado entre líneas
    maximoLineas: 7, // Máximo 7 líneas

    // Posiciones Y dinámicas según cantidad de líneas
    posicionesYPorLineas: {
      1: 55, // 1 línea: más abajo
      2: 56, // 2 líneas: un poco más arriba
      3: 45, // 3 líneas: más arriba
      4: 46, // 4 líneas: más arriba
      5: 44, // 5 líneas: bastante arriba
      6: 41, // 6 líneas: muy arriba
      7: 40, // 7 líneas: super arriba para que entre todo
    },
  },

  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  ubicacion: {
    tamanoFuente: 10,
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'normal',
    alineacion: 'left',
    posicionX: 4, // margen izquierdo (mm)
    posicionY: 96, // mm desde arriba (100mm - 4mm de margen)
  },

  // ===== CONFIGURACIONES ADICIONALES =====
  extras: {
    mostrarBordes: false, // Para debug/desarrollo
    colorFondo: [255, 255, 255], // RGB blanco
    mostrarGuias: false, // Guías visuales para desarrollo
  },
}
