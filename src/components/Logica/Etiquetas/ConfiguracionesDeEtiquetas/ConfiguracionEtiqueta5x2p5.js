import { TAMANO_ETIQUETA_5X2P5 } from './TamanosEtiqueta.js'

export const configuracionEtiqueta5x2p5 = {
  nombre: '5x2.5 cm',
  id: TAMANO_ETIQUETA_5X2P5,
  pagina: {
    ancho: 50,
    alto: 25,
    margenes: { todos: 3 },
  },
  codigoArticulo: {
    tamanosAutomaticos: {
      corto: { hasta: 13, tamano: 9 },
      mediano: { hasta: 18, tamano: 10 },
      largo: { hasta: 23, tamano: 9 },
      muyLargo: { desde: 24, tamano: 7 },
    },
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    posicionY: 4,
  },
  codigoBarra: {
    ancho: 40,
    alto: 6,
    posicionY: 6.5,
    centrado: true,
    tamanoBarras: 'chico',
  },
  descripcion: {
    inicioY: 13.5,
    tamanosAutomaticos: {
      muyCorta: { hasta: 15, tamano: 15 },
      corta: { hasta: 25, tamano: 13 },
      mediana: { hasta: 35, tamano: 11.5 },
      larga: { hasta: 45, tamano: 10 },
      muyLarga: { hasta: 60, tamano: 8.5 },
      extraLarga: { hasta: 80, tamano: 7 },
      gigante: { desde: 100, tamano: 6 },
    },
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'bold',
    alineacion: 'center',
    anchoMaximo: 62,
    interlineadoFactor: 0.35,
    maximoLineas: 4,
    posicionesYPorLineas: {
      1: 17,
      2: 14.5,
      3: 13.5,
      4: 14,
    },
  },
  ubicacion: {
    tamanoFuente: 4.5,
    fuenteNombre: 'helvetica',
    fuenteEstilo: 'normal',
    alineacion: 'left',
    posicionX: 3,
    posicionY: 22,
  },
  extras: {
    mostrarBordes: false,
    colorFondo: [255, 255, 255],
    mostrarGuias: false,
  },
}
