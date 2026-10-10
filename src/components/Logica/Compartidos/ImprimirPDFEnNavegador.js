export const imprimirPDFEnNavegador = (pdf) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(pdf.output('blob'))
  const marco = document.createElement('iframe')
  marco.style.position = 'fixed'
  marco.style.left = '-10000px'
  marco.style.width = '1px'
  marco.style.height = '1px'
  marco.style.border = '0'
  marco.setAttribute('aria-hidden', 'true')

  let temporizadorLimpieza = null
  const temporizadorCarga = setTimeout(() => {
    limpiar()
    reject(new Error('El visor de PDF tardó demasiado en abrirse.'))
  }, 20000)
  const limpiar = () => {
    clearTimeout(temporizadorCarga)
    if (temporizadorLimpieza) clearTimeout(temporizadorLimpieza)
    marco.contentWindow?.removeEventListener('afterprint', limpiar)
    marco.onload = null
    marco.onerror = null
    marco.remove()
    URL.revokeObjectURL(url)
  }

  marco.onload = () => {
    clearTimeout(temporizadorCarga)
    marco.onload = null
    try {
      marco.contentWindow.addEventListener('afterprint', limpiar, { once: true })
      // Algunos visores de PDF no emiten afterprint; conservar el recurso mientras se usa el diálogo.
      temporizadorLimpieza = setTimeout(limpiar, 300000)
      marco.contentWindow.focus()
      marco.contentWindow.print()
      resolve()
    } catch (error) {
      limpiar()
      reject(error)
    }
  }
  marco.onerror = () => {
    limpiar()
    reject(new Error('No se pudo abrir el documento para imprimir.'))
  }
  marco.src = url
  document.body.appendChild(marco)
})
