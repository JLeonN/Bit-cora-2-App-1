import { iniciarBotonAtrasNativo } from 'src/components/Logica/Navegacion/ServicioBotonAtrasNativo.js'

export default async ({ router }) => {
  await iniciarBotonAtrasNativo(router)
}
