# Tienda de Ropa - Angular

Proyecto de tienda de ropa desarrollada con Angular (versión standalone components). Una reimplementación del proyecto React anterior con todas sus características funcionales.

## Características

- ✅ **Autenticación de usuarios**: Registro e inicio de sesión
- ✅ **Panel de administrador**: Crear, editar y eliminar productos  
- ✅ **Catálogo de productos**: Filtrado por categoría, búsqueda de productos
- ✅ **Carrito de compras**: Agregar/quitar items, calcular totales
- ✅ **Sistema de solicitudes**: Clientes pueden dejar comentarios y pedidos especiales
- ✅ **Respuesta a solicitudes**: Admin puede responder a las solicitudes
- ✅ **Persistencia**: Almacenamiento con localStorage

## Credenciales de Prueba

### Usuarios Predeterminados

```
Email: admin@tienda.com
Contraseña: Admin123!
Rol: Administrador
```

También puedes registrarte como usuario normal:
- Nombre: Tu nombre
- Email: cualquier@email.com
- Contraseña: Mínimo 6 caracteres

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── auth/                  # Login y registro
│   │   ├── product-list/          # Catálogo de productos
│   │   ├── cart/                  # Carrito de compras
│   │   └── requests/              # Solicitudes de clientes
│   ├── services/
│   │   ├── auth.service.ts        # Gestión de autenticación
│   │   ├── product.service.ts     # Catálogo de productos
│   │   ├── cart.service.ts        # Carrito de compras
│   │   └── request.service.ts     # Solicitudes de clientes
│   ├── app.ts                     # Component principal
│   ├── app.html                   # Template principal
│   ├── app.css                    # Estilos principales
│   └── app.routes.ts              # Configuración de rutas
├── styles.css                     # Estilos globales
└── main.ts                        # Archivo de entrada

```

## Requisitos

- Node.js 18+
- Angular CLI 19+
- npm o yarn

## Instalación y Ejecución

```bash
# Navegar al directorio del proyecto
cd tienda-angular

# Instalar dependencias (ya ejecutado)
npm install

# Iniciar servidor de desarrollo
ng serve

# El servidor estará disponible en http://localhost:4200
```

## Funcionalidades Principales

### 1. Autenticación
- Registro de nuevos usuarios
- Login con email y contraseña
- Cierre de sesión
- Persistencia de sesión con localStorage

### 2. Tienda
- Listado de productos con imágenes
- Filtrado por categoría
- Búsqueda de productos
- Modal para ver detalles y seleccionar talla
- Indicador de "Últimas unidades" (stock ≤ 5)

### 3. Carrito
- Visualización de items en carrito
- Ajustar cantidad (aumentar/disminuir)
- Eliminar items del carrito
- Vaciarmodo entero del carrito con confirmación
- Cálculo automático de totales

### 4. Solicitudes (Solo para clientes)
- Formulario para enviar comentarios o pedidos especiales
- Visualización de solicitudes enviadas
- Ver respuestas del administrador
- Eliminar solicitudes propias

### 5. Panel Admin
- Gestión de solicitudes de clientes
- Responder a solicitudes
- Eliminar solicitudes
- Visualización de todas las solicitudes pendientes

## Servicios

### AuthService
- `register(name, email, password)`: Registrar nuevo usuario
- `login(email, password)`: Iniciar sesión
- `logout()`: Cerrar sesión
- `getCurrentUser()`: Obtener usuario actual
- `isAdmin()`: Verificar si es administrador

### ProductService
- `getProducts()`: Obtener todos los productos
- `getProductsByCategory(category)`: Filtrar por categoría
- `searchProducts(query)`: Buscar productos

### CartService
- `addToCart(id, name, price, size, quantity)`: Agregar al carrito
- `removeFromCart(id, size)`: Remover del carrito
- `updateQuantity(id, size, quantity)`: Actualizar cantidad
- `clearCart()`: Vaciar carrito
- `getTotalItems()`: Obtener cantidad total de items
- `getTotalPrice()`: Obtener precio total

### RequestService
- `createRequest(userId, type, subject, message)`: Crear solicitud
- `getUserRequests(userId)`: Obtener solicitudes del usuario
- `getUnansweredRequests()`: Obtener solicitudes sin respuesta (admin)
- `replyToRequest(requestId, reply)`: Responder solicitud (admin)
- `deleteRequest(requestId)`: Eliminar solicitud

## Estilos

La aplicación utiliza:
- Gradientes de colores modernos (purple/blue)
- Diseño responsive
- Componentes con sombras y transiciones suaves
- Tipografía clara y legible

## LocalStorage Keys

- `tienda-users`: Usuarios registrados
- `tienda-session`: Sesión actual
- `tienda-products`: Catálogo de productos
- `tienda-cart`: Items del carrito
- `tienda-customer-requests`: Solicitudes de clientes

## Mejoras Futuras

- [ ] Autenticación con backend (JWT)
- [ ] Sistema de pago en línea
- [ ] Historial de pedidos
- [ ] Wishlist/Favoritos
- [ ] Carrito persistente en servidor
- [ ] Subida de imágenes personalizadas
- [ ] Reviews y calificaciones
- [ ] Notificaciones en tiempo real

## Licencia

MIT
