// ConfiguracionEtiqueta10x15.js
// Configuración completa para etiquetas de 10x15 cm

export const configuracionEtiqueta10x15 = {
  // ===== IDENTIFICACIÓN =====
  nombre: '10x15 cm',
  id: '10x15cm',

  // ===== DIMENSIONES DE PÁGINA =====
  pagina: {
    ancho: 150, // 15cm en mm
    alto: 100, // 10cm en mm
    margenes: {
      todos: 4, // 4mm en todos los bordes
    },
  },

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba) =====
  codigoArticulo: {
    tamanoFuente: 50, // 50pt
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    posicionY: 15, // mm desde arriba
  },

  // ===== DIV 2: CÓDIGO DE BARRAS =====
  codigoBarra: {
    ancho: 80, // mm
    alto: 25, // mm
    posicionY: 30, // mm desde arriba
    centrado: true,
    tamanoBarras: 'grande', // Para GeneradorCodigoBarra.js
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
    anchoMaximo: 90, // mm (para multilínea)
    interlineadoFactor: 0.35, // Factor de espaciado entre líneas
    maximoLineas: 7, // Máximo 7 líneas

    // Posiciones Y dinámicas según cantidad de líneas
    posicionesYPorLineas: {
      1: 55, // 1 línea: más abajo
      2: 55, // 2 líneas: igual
      3: 52, // 3 líneas: un poco más arriba
      4: 50, // 4 líneas: más arriba
      5: 48, // 5 líneas: bastante arriba
      6: 46, // 6 líneas: muy arriba
      7: 44, // 7 líneas: super arriba para que entre todo
    },
  },

  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  ubicacion: {
    tamanoFuente: 10,
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'normal',
    alineacion: 'left',
    posicionX: 4, // margen izquierdo (mm)
    posicionY: 146, // mm desde arriba (altoHoja - margen)
  },

  // ===== CONFIGURACIONES ADICIONALES =====
  extras: {
    mostrarBordes: false, // Para debug/desarrollo
    colorFondo: [255, 255, 255], // RGB blanco
    mostrarGuias: false, // Guías visuales para desarrollo
  },
}
