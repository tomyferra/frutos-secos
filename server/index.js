import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data.json')
const PORT = 3001

const app = express()
app.use(cors())
app.use(express.json())

// --- Helpers ---

function leerDatos() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { productos: [], compras: [], ventas: [], mixes: [], gastos: [] }
  }
}

function guardarDatos(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// --- Endpoints genéricos CRUD ---

function crearRouter(ruta, clave) {
  // GET /api/{ruta}
  app.get(`/api/${ruta}`, (req, res) => {
    const data = leerDatos()
    res.json({ [clave]: data[clave] ?? [] })
  })

  // POST /api/{ruta}  (body = array completo)
  app.post(`/api/${ruta}`, (req, res) => {
    const data = leerDatos()
    data[clave] = req.body
    guardarDatos(data)
    res.json({ ok: true })
  })
}

crearRouter('productos', 'productos')
crearRouter('compras', 'compras')
crearRouter('ventas', 'ventas')
crearRouter('mixes', 'mixes')
crearRouter('gastos', 'gastos')

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📁 Datos guardados en: ${DATA_FILE}`)
})
