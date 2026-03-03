# Proyecto React para principiantes

Este proyecto está creado con **React + Vite** y pensado para empezar desde cero.

## 1) Requisitos

- Tener instalado [Node.js](https://nodejs.org/) (recomendado versión LTS).

## 2) Instalación

Desde esta carpeta (`app-react-principiante`), ejecuta:

```bash
npm install
```

## 3) Ejecutar en desarrollo

```bash
npm run dev
```

Luego abre la URL que aparece en consola (normalmente `http://localhost:5173`).

## 4) ¿Qué incluye este ejemplo?

- Un componente principal en `src/App.jsx`.
- Un input controlado con estado (`useState`).
- Un contador con botón para practicar eventos (`onClick`).
- Comentarios dentro del código para entender cada parte.

## 5) Archivos importantes

- `src/main.jsx`: punto de entrada de React.
- `src/App.jsx`: interfaz principal y lógica básica.
- `src/index.css` y `src/App.css`: estilos.

## 6) Scripts útiles

- `npm run dev`: levanta el servidor de desarrollo.
- `npm run build`: genera versión de producción.
- `npm run preview`: previsualiza el build localmente.

## 7) Ejercicios prácticos (paso a paso)

1. ✅ **Cambiar textos (completado)**
	- Modifica el título y el párrafo principal en `src/App.jsx`.

2. ✅ **Botón para restar (completado)**
	- Crea un segundo botón que reste 1 al contador.
	- Pista: usa `setCount((currentCount) => currentCount - 1)`.

3. ✅ **Evitar números negativos (completado)**
	- Haz que el contador nunca baje de 0.
	- Pista: usa una condición antes de actualizar el estado.

4. ✅ **Botón de reset (completado)**
	- Agrega un botón “Reiniciar” que vuelva el contador a 0.

5. ✅ **Mostrar saludo condicional (completado)**
	- Si el input está vacío, muestra “Hola”.
	- Si tiene nombre, muestra “Hola, {nombre}”.

6. ✅ **Mini reto extra (completado)**
	- Crea un estado nuevo llamado `color` y cambia el color del título con un botón.

### Estado final

Todos los ejercicios de esta guía ya están implementados en `src/App.jsx`.
