import { useState } from 'react'
import './App.css'

function App() {
  // Estado para contar cuántas veces se hace clic en el botón.
  const [count, setCount] = useState(0)
  // Estado para guardar el nombre que escribe la persona usuaria.
  const [name, setName] = useState('')
  // Estado para cambiar el color del título.
  const [color, setColor] = useState('#646cff')

  // Saludo condicional: sin nombre muestra "Hola", con nombre muestra "Hola, nombre".
  const greeting = name ? `Hola, ${name}` : 'Hola'

  // Función que incrementa el contador en 1.
  const handleIncrement = () => {
    setCount((currentCount) => currentCount + 1)
  }

  // Función que reduce el contador en 1.
  const handleDecrement = () => {
    setCount((currentCount) => (currentCount > 0 ? currentCount - 1 : 0))
  }

  // Función que reinicia el contador a su valor inicial.
  const handleReset = () => {
    setCount(0)
  }

  // Función que alterna entre dos colores para el título.
  const handleToggleColor = () => {
    setColor((currentColor) => (currentColor === '#646cff' ? '#22c55e' : '#646cff'))
  }

  return (
    <main className="card">
      <h1 style={{ color }}>Mi primer proyecto con React</h1>

      <p>
        {greeting}. Este es un ejemplo simple para aprender componentes y estado.
      </p>

      <div>
        <label htmlFor="nameInput">Escribe tu nombre: </label>
        {/* El valor del input está conectado al estado `name`. */}
        <input
          id="nameInput"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tu nombre"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        {/* Al hacer clic, ejecutamos la función que actualiza el estado. */}
        <button onClick={handleIncrement}>Has hecho clic {count} veces</button>
        <button onClick={handleDecrement} style={{ marginLeft: 8 }}>
          Restar 1
        </button>
        <button onClick={handleReset} style={{ marginLeft: 8 }}>
          Reiniciar
        </button>
        <button onClick={handleToggleColor} style={{ marginLeft: 8 }}>
          Cambiar color del título
        </button>
      </div>

      <p style={{ marginTop: 16 }}>
        Cambia <code>src/App.jsx</code> y guarda para ver actualización en vivo.
      </p>
    </main>
  )
}

export default App
