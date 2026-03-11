import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import CartSection from './components/CartSection'
import RequestsPanel from './components/RequestsPanel'

/*
  Indice rapido de estudio (App.jsx)
  1) Configuracion y datos base: claves storage, imagenes, admin, productos por defecto.
  2) Utilidades: normalizacion de texto/rutas, tallas, hydrate de productos y solicitudes.
  3) Estado principal de App: auth, catalogo, filtros, carrito, solicitudes y avisos UI.
  4) useEffect: persistencia en localStorage, sincronizaciones y notificaciones.
  5) Handlers de autenticacion: registro, login, logout y cambio de modo.
  6) Handlers de tienda/carrito: talla, agregar, quitar, comprar, filtros y modal.
  7) Handlers de solicitudes: crear, responder (admin), borrar.
  8) Handlers de admin productos: crear, editar, cancelar, eliminar, imagen.
*/

// Claves de localStorage para persistir estado entre recargas.
const CART_STORAGE_KEY = 'tienda-cart'
const USERS_STORAGE_KEY = 'tienda-users'
const SESSION_STORAGE_KEY = 'tienda-session'
const PRODUCTS_STORAGE_KEY = 'tienda-products'
const SORT_STORAGE_KEY = 'tienda-sort-order'
const CATEGORY_STORAGE_KEY = 'tienda-selected-category'
const REQUESTS_STORAGE_KEY = 'tienda-customer-requests'
const SEEN_REPLIES_STORAGE_KEY = 'tienda-seen-replies'

// Imagen por defecto y catalogo de rutas sugeridas para el selector admin.
const DEFAULT_PRODUCT_IMAGE = '/images/camiseta-blanca.jpg'
const AVAILABLE_PRODUCT_IMAGES = [
  '/images/camiseta-blanca.jpg',
  '/images/camiseta-azul.webp',
  '/images/camiseta-pato.avif',
  '/images/jeans-azul.avif',
  '/images/sudadera-gris.png',
  '/images/sudadera-baggy.jpg',
  '/images/chaqueta-denim.avif',
  '/images/chaqueta-bomber.webp',
  '/images/chaqueta-champions.jpg',
  '/images/vestido-floral.webp',
  '/images/vestido-sweetra.webp',
  '/images/cargo-beige.jpg',
  '/images/pantalones-baggy.webp',
  '/images/pantalones-negros.webp',
  '/images/camiseta-estampada.webp',
  '/images/bomber-oliva.webp',
  '/images/gorra-negra.webp',
  '/images/zapatillas-blancas.webp',
  '/images/bandolera.webp',
  '/images/botines-negros.jpg',
]

// Compatibilidad con rutas antiguas o formatos cambiados.
const LEGACY_IMAGE_PATHS = {
  '/images/camiseta-blanca.svg': '/images/camiseta-blanca.jpg',
  '/images/jeans-azul.svg': '/images/jeans-azul.avif',
  '/images/sudadera-gris.svg': '/images/sudadera-gris.png',
  '/images/chaqueta-denim.svg': '/images/chaqueta-denim.avif',
  '/images/vestido-floral.svg': '/images/vestido-floral.webp',
  '/images/cargo-beige.svg': '/images/cargo-beige.jpg',
  '/images/camiseta-estampada.svg': '/images/camiseta-estampada.webp',
  '/images/bomber-oliva.svg': '/images/bomber-oliva.webp',
  '/images/gorra-negra.svg': '/images/gorra-negra.webp',
  '/images/zapatillas-blancas.svg': '/images/zapatillas-blancas.webp',
  '/images/bandolera.svg': '/images/bandolera.webp',
  '/images/bandolera.jpg': '/images/bandolera.webp',
  '/images/bandolera.png': '/images/bandolera.webp',
  '/images/bandolera.avif': '/images/bandolera.webp',
  '/images/botines-negros.png': '/images/botines-negros.jpg',
  '/images/botines-negros.avif': '/images/botines-negros.jpg',
  '/images/botines-negros.webp': '/images/botines-negros.jpg',
  '/images/botines-negros.svg': '/images/botines-negros.jpg',
  '/images/camiseta-azul.svg': '/images/camiseta-azul.webp',
  '/images/camiseta-pato.svg': '/images/camiseta-pato.avif',
  '/images/sudadera-baggy.webp': '/images/sudadera-baggy.jpg',
  '/images/chaqueta-bomber.svg': '/images/chaqueta-bomber.webp',
  '/images/chaqueta-champions.webp': '/images/chaqueta-champions.jpg',
  '/images/vestido-sweetra.svg': '/images/vestido-sweetra.webp',
  '/images/pantalones-baggy.svg': '/images/pantalones-baggy.webp',
  '/images/pantalones-negros.svg': '/images/pantalones-negros.webp',
}

const DEFAULT_ADMIN_USER = {
  id: 999001,
  name: 'Admin',
  email: 'admin@tienda.com',
  password: 'Admin123!',
  role: 'admin',
}

// Catalogo base inicial en formato compacto para reducir lineas.
// Estructura: [id, nombre, categoria, precio, talla, descripcion, imagen, tallas?]
const DEFAULT_PRODUCT_ROWS = [
  [1, 'Camiseta básica blanca', 'Camisetas', 19.99, 'S - XL', 'Camiseta de algodón suave para uso diario. Corte regular, ligera y fácil de combinar con jeans o shorts.', '/images/camiseta-blanca.jpg', ['S', 'M', 'L', 'XL']],
  [2, 'Jeans rectos azul', 'Pantalones', 39.99, '36 - 46', 'Jeans rectos de tiro medio con tejido resistente y cómodo. Perfectos para looks casuales y urbanos.', '/images/jeans-azul.avif', ['36', '38', '40', '42', '44', '46']],
  [3, 'Sudadera oversize gris', 'Sudaderas', 34.99, 'M - XXL', 'Sudadera oversize con interior afelpado que aporta abrigo y confort, ideal para días frescos.', '/images/sudadera-gris.png', ['M', 'L', 'XL', 'XXL']],
  [4, 'Chaqueta denim negra', 'Chaquetas', 54.99, 'S - XL', 'Chaqueta denim negra con acabado moderno y estructura firme. Una prenda versátil para todo el año.', '/images/chaqueta-denim.avif', ['S', 'M', 'L', 'XL']],
  [5, 'Vestido midi floral', 'Vestidos', 44.99, 'S - L', 'Vestido midi floral de caída ligera, ideal para salidas de día o eventos informales.', '/images/vestido-floral.webp', ['S', 'M', 'L']],
  [6, 'Pantalón cargo beige', 'Pantalones', 42.5, '38 - 46', 'Pantalón cargo con bolsillos funcionales y ajuste cómodo, pensado para un estilo práctico y actual.', '/images/cargo-beige.jpg', ['38', '40', '42', '44', '46']],
  [7, 'Camiseta estampada', 'Camisetas', 22.5, 'S - XL', 'Camiseta estampada con diseño frontal, confeccionada en tejido transpirable para uso diario.', '/images/camiseta-estampada.webp', ['S', 'M', 'L', 'XL']],
  [8, 'Bomber verde oliva', 'Chaquetas', 59.9, 'M - XXL', 'Chaqueta bomber con cierre frontal y puños elásticos, ideal para completar un look urbano.', '/images/bomber-oliva.webp', ['M', 'L', 'XL', 'XXL']],
  [9, 'Gorra urbana negra', 'Accesorios', 18.9, 'Unica', 'Gorra ajustable con visera curva y tejido ligero. Ideal para complementar looks casuales.', '/images/gorra-negra.webp', ['Unica']],
  [10, 'Bandolera minimal beige', 'Accesorios', 26.5, 'Unica', 'Bandolera compacta con compartimentos interiores y correa regulable para uso diario.', '/images/bandolera.webp', ['Unica']],
  [11, 'Zapatillas blancas urban', 'Calzados', 64.9, '38 - 44', 'Zapatillas de estilo urbano con suela flexible y plantilla acolchada para mayor comodidad.', '/images/zapatillas-blancas.webp', ['38', '39', '40', '41', '42', '43', '44']],
  [12, 'Botines negros clasicos', 'Calzados', 79.0, '36 - 42', 'Botines de corte medio con acabado mate y suela antideslizante para uso diario.', '/images/botines-negros.jpg', ['36', '37', '38', '39', '40', '41', '42']],
  [13, 'Camiseta premium negra', 'Camisetas', 24.99, 'S - XL', 'Camiseta premium con tacto suave y corte recto para uso diario.', '/images/camiseta-pato.avif', ['S', 'M', 'L', 'XL']],
  [14, 'Jeans slim azul oscuro', 'Pantalones', 45.5, '36 - 46', 'Jeans slim de tiro medio con tejido elastico y ajuste comodo.', '/images/pantalones-baggy.webp', ['36', '38', '40', '42', '44', '46']],
  [15, 'Sudadera con capucha arena', 'Sudaderas', 38.99, 'M - XXL', 'Sudadera con capucha y bolsillo frontal, ideal para entretiempo.', '/images/sudadera-baggy.jpg', ['M', 'L', 'XL', 'XXL']],
  [16, 'Chaqueta denim azul', 'Chaquetas', 57.9, 'S - XL', 'Chaqueta denim de estructura ligera para looks casuales.', '/images/chaqueta-champions.jpg', ['S', 'M', 'L', 'XL']],
  [17, 'Pantalon cargo negro', 'Pantalones', 46.75, '38 - 46', 'Cargo de fit relajado con bolsillos laterales y tejido resistente.', '/images/pantalones-negros.webp', ['38', '40', '42', '44', '46']],
  [18, 'Bomber urbana negra', 'Chaquetas', 62.0, 'M - XXL', 'Bomber urbana con cuello rib y acabado minimalista.', '/images/chaqueta-bomber.webp', ['M', 'L', 'XL', 'XXL']],
  [19, 'Vestido verano', 'Vestidos', 47.25, 'S - L', 'Vestido ligero de corte midi con caida fluida para dias calidos.', '/images/vestido-sweetra.webp', ['S', 'M', 'L']],
  [20, 'Camiseta oversize azul', 'Camisetas', 21.9, 'M - XXL', 'Camiseta oversize de algodon con estilo urbano y comodo.', '/images/camiseta-azul.webp', ['M', 'L', 'XL', 'XXL']],
  [21, 'Vestido ceremonia satinado', 'Ropa especial', 129.99, 'S - L', 'Vestido elegante para ceremonia con caida suave y acabado satinado.', '/images/vestido-camisero.webp', ['S', 'M', 'L']],
  [22, 'Vestido comunion blanco perla', 'Ropa especial', 149.5, '8 - 14', 'Vestido de comunion con corte clasico y detalles delicados.', '/images/vestido-comunion-perla.webp', ['8', '10', '12', '14']],
  [23, 'Traje novio clasico azul marino', 'Ropa especial', 239.0, '46 - 54', 'Traje de novio de dos piezas con patron elegante para eventos formales.', '/images/traje-novio-azul-marino.jpg', ['46', '48', '50', '52', '54']],
  [24, 'Zapato salon ceremonia', 'Zapatos especiales', 94.9, '35 - 41', 'Zapato de salon comodo para bodas, bautizos y celebraciones.', '/images/zapatos-true-nude.webp', ['35', '36', '37', '38', '39', '40', '41']],
  [25, 'Zapato vestir caballero ceremonia', 'Zapatos especiales', 109.0, '39 - 45', 'Zapato de vestir para novio o invitado con acabado pulido.', '/images/zapatos-mateo.webp', ['39', '40', '41', '42', '43', '44', '45']],
  [26, 'Sandalia fiesta dorada', 'Zapatos especiales', 79.95, '35 - 41', 'Sandalia de fiesta para ceremonia con sujecion estable y elegante.', '/images/sandalia-fiesta-dorada.webp', ['35', '36', '37', '38', '39', '40', '41']],
  [27, 'Bolso mano ceremonia', 'Complementos especiales', 39.95, 'Unica', 'Bolso de mano compacto para invitada, ideal para eventos formales.', '/images/bolso-mano-pouch.webp', ['Unica']],
  [28, 'Tocado elegante comunion', 'Complementos especiales', 29.9, 'Unica', 'Tocado ligero para ceremonia y comunion con estilo delicado.', '/images/tocado-elegante-comunion.jpg', ['Unica']],
  [29, 'Pañuelo de bolsillo novio', 'Complementos especiales', 14.5, 'Unica', 'Pañuelo de bolsillo para traje de novio o invitado.', '/images/pañuelo-maillonmorphose.webp', ['Unica']],
  [30, 'Cinturon ceremonia piel', 'Complementos especiales', 24.75, 'Unica', 'Cinturon de piel para traje de ceremonia con hebilla elegante.', '/images/cinturon-ceremonia-piel.webp', ['Unica']],
  [31, 'Vestido fiesta largo', 'Vestidos', 89.99, 'S - L', 'Vestido de fiesta largo con caida elegante para eventos especiales.', '/images/vestido-fiesta-largo.webp', ['S', 'M', 'L']],
  [32, 'Mono pantalon ceremonia', 'Ropa especial', 119.5, 'S - L', 'Mono de pantalon para ceremonia con patron moderno y sofisticado.', '/images/mono-pantalon-ceremonia.webp', ['S', 'M', 'L']],
  [33, 'Zapato comunion niño', 'Zapatos especiales', 49.9, '28 - 35', 'Zapato de comunion para niño con suela antideslizante y diseño clásico.', '/images/zapato-comunion-nino.webp', ['28', '29', '30', '31', '32', '33', '34', '35']],
  [34, 'Vestido fiesta corto', 'Vestidos', 69.5, 'S - L', 'Vestido de fiesta corto con diseño elegante para eventos especiales.', '/images/vestido-fiesta-corto.webp', ['S', 'M', 'L']],
  [35, 'Americana ceremonia', 'Ropa especial', 149.99, 'S - XL', 'Americana de ceremonia con corte entallado y detalles elegantes.', '/images/americana-ceremonia.webp', ['S', 'M', 'L', 'XL']],
  [36, 'Zapato salón fiesta', 'Zapatos especiales', 89.5, '35 - 41', 'Zapato de salón para fiesta con tacón cómodo y diseño sofisticado.', '/images/zapato-salon-fiesta.webp', ['35', '36', '37', '38', '39', '40', '41']],
  [37, 'Clutch noche elegante', 'Complementos especiales', 44.95, 'Unica', 'Clutch de noche con diseño elegante para eventos formales.', '/images/clutch-noche-elegante.webp', ['Unica']],
  [38, 'Tocado floral ceremonia', 'Complementos especiales', 34.9, 'Unica', 'Tocado floral para ceremonia con estilo delicado y romántico.', '/images/tocado-floral-ceremonia.webp', ['Unica']],
  [39, 'Cinturon piel ceremonia', 'Complementos especiales', 29.75, 'Unica', 'Cinturon de piel para ceremonia con hebilla elegante.', '/images/cinturon-piel-ceremonia.webp', ['Unica']],
  [40, 'Vestido largo verano', 'Vestidos', 79.99, 'S - L', 'Vestido largo de verano con tejido ligero y diseño fresco para días calurosos.', '/images/vestido-largo-verano.webp', ['S', 'M', 'L']],
  [41, 'Mono corto fiesta', 'Ropa especial', 99.5, 'S - L', 'Mono corto de fiesta con diseño elegante para eventos especiales.', '/images/mono-corto-fiesta.webp', ['S', 'M', 'L']],
  [42, 'Zapato comunion niña', 'Zapatos especiales', 54.9, '28 - 35', 'Zapato de comunion para niña con suela antideslizante y diseño clásico.', '/images/zapato-comunion-nina.webp', ['28', '29', '30', '31', '32', '33', '34', '35']],
  [43, 'Vestido cóctel', 'Vestidos', 74.5, 'S - L', 'Vestido de cóctel con diseño elegante y corte favorecedor para eventos especiales.', '/images/vestido-cocktail.webp', ['S', 'M', 'L']],
  [44, 'Americana ceremonia mujer', 'Ropa especial', 159.99, 'S - XL', 'Americana de ceremonia para mujer con corte entallado y detalles elegantes.', '/images/americana-ceremonia-mujer.webp', ['S', 'M', 'L', 'XL']],
  [45, 'Zapato salón ceremonia', 'Zapatos especiales', 94.5, '35 - 41', 'Zapato de salón para ceremonia con tacón cómodo y diseño sofisticado.', '/images/zapato-salon-ceremonia.webp', ['35', '36', '37', '38', '39', '40', '41']],
  [46, 'Clutch noche fiesta', 'Complementos especiales', 49.95, 'Unica', 'Clutch de noche con diseño elegante para eventos formales.', '/images/clutch-noche-fiesta.webp', ['Unica']],
  [47, 'Tocado elegante ceremonia', 'Complementos especiales', 39.9, 'Unica', 'Tocado elegante para ceremonia con estilo delicado y sofisticado.', '/images/tocado-elegante-ceremonia.webp', ['Unica']],
  [48, 'Cinturon ceremonia elegante', 'Complementos especiales', 34.75, 'Unica', 'Cinturon de ceremonia con diseño elegante y hebilla sofisticada.', '/images/cinturon-ceremonia-elegante.webp', ['Unica']],
  [49, 'Vestido largo fiesta', 'Vestidos', 89.99, 'S - L', 'Vestido largo de fiesta con diseño elegante para eventos especiales.', '/images/vestido-fiesta-largo-graduacion.webp', ['S', 'M', 'L']],
  [50, 'Chaqueta piel sintética', 'Chaquetas', 69.99, 'S - XL', 'Chaqueta de piel sintética con acabado suave y diseño moderno para un look urbano.', '/images/chaqueta-piel-sintetica.webp', ['S', 'M', 'L', 'XL']],
  [51, 'Pantalón palazzo fluido', 'Pantalones', 49.5, '36 - 46', 'Pantalón palazzo de tejido fluido con cintura elástica para un ajuste cómodo y elegante.', '/images/pantalon-palazzo-fluido.webp', ['36', '38', '40', '42', '44', '46']],
  [52, 'Zapato deportivo running', 'Calzados', 59.99, '38 - 44', 'Zapato deportivo de running con suela amortiguada y diseño transpirable para mayor comodidad durante el ejercicio.', '/images/zapato-deportivo-running.webp', ['38', '39', '40', '41', '42', '43', '44']],
  [53, 'Bolso tote grande', 'Accesorios', 34.95, 'Unica', 'Bolso tote grande con compartimentos interiores y asas resistentes para uso diario.', '/images/bolso-tote-grande.webp', ['Unica']],
  [54, 'Gafas de sol urbanas', 'Accesorios', 24.9, 'Unica', 'Gafas de sol con diseño urbano y protección UV para complementar tus looks de verano.', '/images/gafas-de-sol-urbanas.webp', ['Unica']],
  [55, 'Cinturon piel casual', 'Accesorios', 29.75, 'Unica', 'Cinturon de piel con hebilla casual para complementar tus looks diarios.', '/images/cinturon-piel-casual.webp', ['Unica']],
  [56, 'Sudadera cropped rosa', 'Sudaderas', 36.5, 'M - XXL', 'Sudadera cropped de color rosa con capucha y diseño moderno para un look urbano y femenino.', '/images/sudadera-cropped-rosa.webp', ['M', 'L', 'XL', 'XXL']],
  [57, 'Pantalones palazzo estampados', 'Pantalones', 54.5, '36 - 46', 'Pantalones palazzo con estampado vibrante y tejido fluido para un look elegante y cómodo.', '/images/pantalones-palazzo-estampados.webp', ['36', '38', '40', '42', '44', '46']],
  [58, 'Vestido largo estampado', 'Vestidos', 84.99, 'S - L', 'Vestido largo con estampado vibrante y tejido ligero para un look elegante y cómodo en eventos especiales.', '/images/vestido-largo-estampado.webp', ['S', 'M', 'L']],
  
]

const DEFAULT_PRODUCTS = DEFAULT_PRODUCT_ROWS.map(
  ([id, name, category, price, size, description, image, sizes]) => ({
    id,
    name,
    category,
    price,
    size,
    sizes,
    description,
    image,
  }),
)

// Normaliza texto para comparar sin tildes ni mayusculas/minusculas.
const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// Limpia y convierte rutas de imagen (absolutas, relativas o antiguas) a un formato valido.
const normalizeProductImagePath = (imagePath) => {
  const rawPath = typeof imagePath === 'string' ? imagePath.trim() : ''

  if (!rawPath) {
    return DEFAULT_PRODUCT_IMAGE
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath
  }

  const directLegacyPath = LEGACY_IMAGE_PATHS[rawPath]

  if (directLegacyPath) {
    return directLegacyPath
  }

  if (rawPath.startsWith('data:image/')) {
    return rawPath
  }

  const pathWithSlashes = rawPath.replace(/\\/g, '/')
  const pathWithoutDots = pathWithSlashes.replace(/^\.?\//, '')

  if (pathWithoutDots.startsWith('images/')) {
    const normalizedLegacyPath = LEGACY_IMAGE_PATHS[`/${pathWithoutDots}`]
    return normalizedLegacyPath ?? `/${pathWithoutDots}`
  }

  if (pathWithoutDots.startsWith('public/images/')) {
    return `/${pathWithoutDots.replace('public/', '')}`
  }

  if (/^[A-Za-z]:\//.test(pathWithSlashes) || pathWithSlashes.includes('/')) {
    const fileName = pathWithSlashes.split('/').pop()?.trim()

    if (fileName) {
      return `/images/${fileName}`
    }
  }

  if (rawPath.startsWith('/images/')) {
    return rawPath
  }

  if (rawPath.startsWith('images/')) {
    return `/${rawPath}`
  }

  if (rawPath.startsWith('/public/images/')) {
    return rawPath.replace('/public', '')
  }

  if (rawPath.startsWith('public/images/')) {
    return `/${rawPath.replace('public/', '')}`
  }

  if (!rawPath.startsWith('/')) {
    const candidatePath = `/images/${rawPath}`
    return LEGACY_IMAGE_PATHS[candidatePath] ?? candidatePath
  }

  return rawPath
}

// Convierte una ruta normalizada en src final, respetando BASE_URL de Vite.
// Construye el src final de imagen respetando la base de despliegue.
const resolveProductImageSrc = (imagePath) => {
  const normalizedPath = normalizeProductImagePath(imagePath)

  if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith('data:image/')) {
    return normalizedPath
  }

  const cleanPath = normalizedPath.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

// Fuerza imagen canonica para productos sensibles (bandolera/botines).
// Prioriza imagenes oficiales para productos clave (evita rutas rotas por datos antiguos).
const getCanonicalImageForProduct = (product) => {
  const defaultProduct = DEFAULT_PRODUCTS.find(
    (defaultItem) => Number(defaultItem.id) === Number(product?.id),
  )

  if (defaultProduct?.image) {
    return defaultProduct.image
  }

  const productName = normalizeText(product?.name ?? '')

  if (Number(product?.id) === 10 || productName.includes('bandolera')) {
    return '/images/bandolera.webp'
  }

  if (Number(product?.id) === 12 || productName.includes('botines')) {
    return '/images/botines-negros.jpg'
  }

  return product?.image
}

// Fallbacks embebidos para mostrar algo aunque el archivo fisico falle.
const PRODUCT_FALLBACK_IMAGES = {
  bandolera:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23eef2ff'/><rect x='160' y='240' width='280' height='260' rx='24' fill='%23b7794f'/><rect x='195' y='280' width='210' height='130' rx='18' fill='%23d09a71'/><path d='M165 240c20-90 90-150 170-150s150 60 170 150' fill='none' stroke='%23623f2a' stroke-width='18' stroke-linecap='round'/><rect x='280' y='430' width='40' height='14' rx='7' fill='%23623f2a'/><text x='300' y='610' text-anchor='middle' font-family='Arial' font-size='34' fill='%23334155'>Bandolera</text></svg>",
  botines:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 800'><rect width='600' height='800' fill='%23e2e8f0'/><ellipse cx='300' cy='650' rx='220' ry='36' fill='%23cbd5e1'/><path d='M130 260h190c20 0 36 16 36 36v160c0 16 7 31 19 41l44 35c20 16 8 48-17 48H150c-34 0-62-28-62-62V296c0-20 16-36 42-36z' fill='%23111827'/><path d='M90 550h340c18 0 32 14 32 32s-14 32-32 32H130c-33 0-60-27-60-60 0-1 0-2 20-4z' fill='%230b1220'/><rect x='148' y='330' width='160' height='12' rx='6' fill='%234b5563'/><rect x='148' y='366' width='160' height='12' rx='6' fill='%234b5563'/><rect x='148' y='402' width='160' height='12' rx='6' fill='%234b5563'/><text x='300' y='710' text-anchor='middle' font-family='Arial' font-size='34' fill='%231f2937'>Botines negros</text></svg>",
}

// Devuelve el fallback adecuado por producto.
// Devuelve una imagen embebida de emergencia si falla la carga del archivo fisico.
const getProductFallbackImage = (product) => {
  const productName = normalizeText(product?.name ?? '')

  if (Number(product?.id) === 10 || productName.includes('bandolera')) {
    return PRODUCT_FALLBACK_IMAGES.bandolera
  }

  if (Number(product?.id) === 12 || productName.includes('botines')) {
    return PRODUCT_FALLBACK_IMAGES.botines
  }

  return resolveProductImageSrc(DEFAULT_PRODUCT_IMAGE)
}

// Expande rangos de talla, por ejemplo "S - XL" o "36 - 42".
// Convierte una talla textual en lista de opciones seleccionables.
const parseSizeRange = (sizeText) => {
  const trimmedSize = typeof sizeText === 'string' ? sizeText.trim() : ''

  if (!trimmedSize.includes('-')) {
    return trimmedSize ? [trimmedSize] : []
  }

  const [firstSizeRaw, lastSizeRaw] = trimmedSize.split('-').map((value) => value.trim())
  const alphaScale = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const firstAlphaIndex = alphaScale.indexOf(firstSizeRaw)
  const lastAlphaIndex = alphaScale.indexOf(lastSizeRaw)

  if (firstAlphaIndex >= 0 && lastAlphaIndex >= 0 && firstAlphaIndex <= lastAlphaIndex) {
    return alphaScale.slice(firstAlphaIndex, lastAlphaIndex + 1)
  }

  const firstNumeric = Number.parseInt(firstSizeRaw, 10)
  const lastNumeric = Number.parseInt(lastSizeRaw, 10)

  if (Number.isInteger(firstNumeric) && Number.isInteger(lastNumeric) && firstNumeric <= lastNumeric) {
    const sizes = []

    for (let size = firstNumeric; size <= lastNumeric; size += 2) {
      sizes.push(String(size))
    }

    return sizes
  }

  return [trimmedSize]
}

// Normaliza un producto para garantizar campos minimos coherentes.
// Normaliza un producto para que siempre tenga descripcion, tallas e imagen consistentes.
const hydrateProduct = (product) => {
  const normalizedId = Number(product.id)
  const category = normalizedId === 55 ? 'Accesorios' : product.category
  const fallbackDescription = `Prenda de la categoría ${category} con diseño moderno y cómodo para uso diario.`
  const sizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : parseSizeRange(product.size)
  const canonicalImage = getCanonicalImageForProduct(product)

  return {
    ...product,
    category,
    sizes,
    description: product.description?.trim() || fallbackDescription,
    image: normalizeProductImagePath(canonicalImage),
  }
}

// Fusiona productos guardados con defaults que falten por id.
// Combina productos guardados con los del catalogo base para no perder items por defecto.
const mergeProductsWithDefaults = (storedProducts) => {
  const hydratedStoredProducts = storedProducts.map((product) => hydrateProduct(product))
  const storedIds = new Set(hydratedStoredProducts.map((product) => product.id))
  const missingDefaultProducts = DEFAULT_PRODUCTS.filter((product) => !storedIds.has(product.id)).map(
    (product) => hydrateProduct(product),
  )

  return [...hydratedStoredProducts, ...missingDefaultProducts]
}

// Asegura que bandolera y botines existan siempre en el catalogo.
// Garantiza que productos imprescindibles sigan presentes aunque se hayan borrado en storage.
const ensureKeyCatalogProducts = (products) => {
  const normalizedProducts = products.map((product) => hydrateProduct(product))
  const mustHaveProducts = DEFAULT_PRODUCTS.filter((product) => [10, 12].includes(product.id))
  const hasMatchingProduct = (targetProduct) => {
    const targetName = normalizeText(targetProduct.name)
    const targetImage = normalizeProductImagePath(targetProduct.image)

    return normalizedProducts.some((product) => {
      const productName = normalizeText(product.name ?? '')
      const productImage = normalizeProductImagePath(product.image)
      return productName === targetName || productImage === targetImage
    })
  }

  let nextId = normalizedProducts.reduce((maxId, product) => {
    const parsedId = Number.parseInt(product.id, 10)
    return Number.isInteger(parsedId) ? Math.max(maxId, parsedId) : maxId
  }, 0) + 1

  const missingKeyProducts = mustHaveProducts
    .filter((product) => !hasMatchingProduct(product))
    .map((product) => {
      const fallbackId = normalizedProducts.some((storedProduct) => storedProduct.id === product.id)
        ? nextId++
        : product.id

      return hydrateProduct({
        ...product,
        id: fallbackId,
      })
    })

  if (missingKeyProducts.length === 0) {
    return normalizedProducts
  }

  return [...normalizedProducts, ...missingKeyProducts]
}

// Obtiene tallas efectivas de un producto (array o fallback simple).
// Obtiene las tallas disponibles de un producto en formato array.
const getProductSizeOptions = (product) => {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes
  }

  return product.size ? [product.size] : []
}

// Limpia campos opcionales de solicitudes de cliente.
// Normaliza solicitudes de cliente para evitar null/undefined en respuestas.
const hydrateCustomerRequest = (requestItem) => ({
  ...requestItem,
  adminReply: requestItem.adminReply?.trim() ?? '',
  repliedAt: requestItem.repliedAt ?? null,
})

// Formatea fechas para mostrarlas al usuario final.
// Formatea fechas al formato local en espanol.
const formatDateTime = (value) => {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('es-ES')
}

function App() {
  // Estado de autenticacion (login/registro).
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  // Sesion activa (usuario autenticado).
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY)

      if (!savedSession) {
        return null
      }

      const parsedSession = JSON.parse(savedSession)
      return parsedSession ? { ...parsedSession, role: parsedSession.role ?? 'user' } : null
    } catch {
      return null
    }
  })

  // Catalogo de productos, hidratado desde localStorage o defaults.
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY)

      if (!savedProducts) {
        return DEFAULT_PRODUCTS.map((product) => hydrateProduct(product))
      }

      const parsedProducts = JSON.parse(savedProducts)
      if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
        return ensureKeyCatalogProducts(mergeProductsWithDefaults(parsedProducts))
      }

      return ensureKeyCatalogProducts(DEFAULT_PRODUCTS)
    } catch {
      return ensureKeyCatalogProducts(DEFAULT_PRODUCTS)
    }
  })

  // Estado del formulario admin para crear/editar productos.
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    size: '',
    image: DEFAULT_PRODUCT_IMAGE,
  })
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [editingProductId, setEditingProductId] = useState(null)
  const [adminSearch, setAdminSearch] = useState('')

  // Solicitudes de clientes y formulario asociado.
  const [customerRequests, setCustomerRequests] = useState(() => {
    try {
      const savedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY)

      if (!savedRequests) {
        return []
      }

      const parsedRequests = JSON.parse(savedRequests)
      return Array.isArray(parsedRequests)
        ? parsedRequests.map((requestItem) => hydrateCustomerRequest(requestItem))
        : []
    } catch {
      return []
    }
  })
  const [requestForm, setRequestForm] = useState({
    type: 'pedido',
    subject: '',
    message: '',
  })
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')
  const [adminReplyDrafts, setAdminReplyDrafts] = useState({})

  // Estado visual de producto (detalle y talla elegida por tarjeta).
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSizes, setSelectedSizes] = useState({})

  // Filtros de catalogo.
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const savedCategory = localStorage.getItem(CATEGORY_STORAGE_KEY)
    return savedCategory ?? 'Todas'
  })
  const [sortOrder, setSortOrder] = useState(() => {
    const savedSort = localStorage.getItem(SORT_STORAGE_KEY)
    return savedSort ?? 'default'
  })
  const [showFiltersNotice, setShowFiltersNotice] = useState(false)
  const [isFiltersNoticeClosing, setIsFiltersNoticeClosing] = useState(false)
  const [filtersNoticeId, setFiltersNoticeId] = useState(0)
  const [filtersNoticeFlashA, setFiltersNoticeFlashA] = useState(false)
  const [showReplyNotice, setShowReplyNotice] = useState(false)
  const [isReplyNoticeClosing, setIsReplyNoticeClosing] = useState(false)
  const [replyNoticeId, setReplyNoticeId] = useState(0)
  const [replyNoticeCount, setReplyNoticeCount] = useState(0)
  const [showCartNotice, setShowCartNotice] = useState(false)
  const [isCartNoticeClosing, setIsCartNoticeClosing] = useState(false)
  const [cartNoticeId, setCartNoticeId] = useState(0)
  const [cartNoticeText, setCartNoticeText] = useState('')
  const [userView, setUserView] = useState('store')
  const [isClearCartPromptOpen, setIsClearCartPromptOpen] = useState(false)

  // Carrito de compras persistente.
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)

      if (!savedCart) {
        return []
      }

      const parsedCart = JSON.parse(savedCart)
      return Array.isArray(parsedCart) ? parsedCart : []
    } catch {
      return []
    }
  })

  const isAdmin = currentUser?.role === 'admin'

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map((product) => product.category))]
    return ['Todas', ...uniqueCategories]
  }, [products])

  const filteredProducts =
    selectedCategory === 'Todas'
      ? products
      : products.filter(
          (product) => normalizeText(product.category) === normalizeText(selectedCategory),
        )

  const visibleProducts = useMemo(() => {
    const search = normalizeText(adminSearch.trim())

    if (!search || currentUser?.role !== 'admin') {
      return filteredProducts
    }

    return filteredProducts.filter((product) => normalizeText(product.name).includes(search))
  }, [adminSearch, filteredProducts, currentUser])

  const displayedProducts = useMemo(() => {
    if (sortOrder === 'price-asc') {
      return [...visibleProducts].sort((firstProduct, secondProduct) => firstProduct.price - secondProduct.price)
    }

    if (sortOrder === 'price-desc') {
      return [...visibleProducts].sort((firstProduct, secondProduct) => secondProduct.price - firstProduct.price)
    }

    return visibleProducts
  }, [visibleProducts, sortOrder])

  const myRequests = useMemo(
    () => customerRequests.filter((requestItem) => requestItem.userId === currentUser?.id),
    [customerRequests, currentUser],
  )

  const answeredRequestsCount = useMemo(
    () => myRequests.filter((requestItem) => requestItem.adminReply).length,
    [myRequests],
  )

  const pendingRequestsCount = useMemo(
    () => customerRequests.filter((requestItem) => !requestItem.adminReply).length,
    [customerRequests],
  )

  const isUserStoreView = !isAdmin && userView === 'store'
  const isUserCartView = !isAdmin && userView === 'cart'
  const isUserRequestsView = !isAdmin && userView === 'requests'

  const totalItems = useMemo(
    () => cart.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [cart],
  )

  const totalPrice = useMemo(
    () => cart.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0),
    [cart],
  )

  const passwordChecks = useMemo(() => {
    const password = authForm.password

    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    }
  }, [authForm.password])

  // Persistencia principal de estado en localStorage.
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    setProducts((currentProducts) => ensureKeyCatalogProducts(currentProducts))
  }, [])

  useEffect(() => {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(customerRequests))
  }, [customerRequests])

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOrder)
  }, [sortOrder])

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, selectedCategory)
  }, [selectedCategory])

  // Efectos de UI para cierre automatico de avisos/toasts.
  useEffect(() => {
    if (!showFiltersNotice) {
      return
    }

    const timeoutId = setTimeout(() => {
      setShowFiltersNotice(false)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [showFiltersNotice, filtersNoticeId])

  useEffect(() => {
    if (!showReplyNotice) {
      return
    }

    const timeoutId = setTimeout(() => {
      setShowReplyNotice(false)
      setReplyNoticeCount(0)
    }, 2800)

    return () => clearTimeout(timeoutId)
  }, [showReplyNotice, replyNoticeId])

  useEffect(() => {
    if (!showCartNotice) {
      return
    }

    const timeoutId = setTimeout(() => {
      setShowCartNotice(false)
      setCartNoticeText('')
    }, 2200)

    return () => clearTimeout(timeoutId)
  }, [showCartNotice, cartNoticeId])

  // Mantiene la sesion sincronizada.
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser))
      return
    }

    localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [currentUser])

  // Si desaparece la categoria elegida, vuelve a "Todas".
  useEffect(() => {
    if (selectedCategory === 'Todas') {
      return
    }

    const categoryExists = products.some(
      (product) => normalizeText(product.category) === normalizeText(selectedCategory),
    )

    if (!categoryExists) {
      setSelectedCategory('Todas')
    }
  }, [products, selectedCategory])

  // Sincroniza carrito con cambios de productos (precio, nombre, talla).
  useEffect(() => {
    setCart((currentCart) =>
      currentCart
        .map((cartItem) => {
          const existingProduct = products.find((product) => product.id === cartItem.id)

          if (!existingProduct) {
            return null
          }

          const availableSizes = getProductSizeOptions(existingProduct)
          const selectedSize = availableSizes.includes(cartItem.selectedSize)
            ? cartItem.selectedSize
            : availableSizes[0] ?? cartItem.selectedSize ?? existingProduct.size

          return {
            ...cartItem,
            name: existingProduct.name,
            price: existingProduct.price,
            category: existingProduct.category,
            size: existingProduct.size,
            image: existingProduct.image,
            selectedSize,
          }
        })
        .filter(Boolean),
    )
  }, [products])

  // Mantiene seleccion de tallas valida por producto.
  useEffect(() => {
    setSelectedSizes((currentSelection) => {
      const nextSelection = {}

      products.forEach((product) => {
        const availableSizes = getProductSizeOptions(product)
        const currentSize = currentSelection[product.id]
        nextSelection[product.id] = availableSizes.includes(currentSize)
          ? currentSize
          : availableSizes[0] ?? ''
      })

      return nextSelection
    })
  }, [products])

  // Detecta respuestas nuevas del admin y lanza aviso al usuario.
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return
    }

    const repliedRequests = customerRequests.filter(
      (requestItem) =>
        requestItem.userId === currentUser.id &&
        requestItem.adminReply &&
        requestItem.adminReply.trim() &&
        requestItem.repliedAt,
    )

    if (repliedRequests.length === 0) {
      return
    }

    const replySignatures = repliedRequests.map(
      (requestItem) => `${requestItem.id}:${requestItem.repliedAt}`,
    )

    try {
      const parsedSeenReplies = JSON.parse(localStorage.getItem(SEEN_REPLIES_STORAGE_KEY) ?? '{}')
      const userSeenReplies = Array.isArray(parsedSeenReplies[currentUser.id])
        ? parsedSeenReplies[currentUser.id]
        : []
      const seenRepliesSet = new Set(userSeenReplies)
      const newReplies = replySignatures.filter((signature) => !seenRepliesSet.has(signature))

      if (newReplies.length === 0) {
        return
      }

      setReplyNoticeCount(newReplies.length)
      setIsReplyNoticeClosing(false)
      setShowReplyNotice(true)
      setReplyNoticeId((currentId) => currentId + 1)

      parsedSeenReplies[currentUser.id] = [...new Set([...userSeenReplies, ...newReplies])]
      localStorage.setItem(SEEN_REPLIES_STORAGE_KEY, JSON.stringify(parsedSeenReplies))
    } catch {
      setReplyNoticeCount(1)
      setIsReplyNoticeClosing(false)
      setShowReplyNotice(true)
      setReplyNoticeId((currentId) => currentId + 1)
    }
  }, [customerRequests, currentUser])

  // Lee usuarios persistidos y devuelve array seguro.
  const getSavedUsers = () => {
    try {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)

      if (!savedUsers) {
        return []
      }

      const parsedUsers = JSON.parse(savedUsers)
      return Array.isArray(parsedUsers) ? parsedUsers : []
    } catch {
      return []
    }
  }

  // Guarda la lista de usuarios en localStorage.
  const saveUsers = (users) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }

  // Crea el usuario admin por defecto si aun no existe.
  const ensureAdminUser = useCallback(() => {
    const users = getSavedUsers()
    const adminExists = users.some((user) => user.email === DEFAULT_ADMIN_USER.email)

    if (adminExists) {
      return
    }

    saveUsers([...users, DEFAULT_ADMIN_USER])
  }, [])

  useEffect(() => {
    ensureAdminUser()
  }, [ensureAdminUser])

  // Handlers de autenticacion.
  // Limpia los campos del formulario de login/registro.
  const resetAuthForm = () => {
    setAuthForm({ name: '', email: '', password: '' })
  }

  // Actualiza inputs de autenticacion y limpia errores previos.
  const handleAuthInputChange = (event) => {
    const { name, value } = event.target
    setAuthForm((currentForm) => ({ ...currentForm, [name]: value }))
    if (authError) {
      setAuthError('')
    }
  }

  // Registra un nuevo usuario validando reglas basicas de password y email unico.
  const handleRegister = () => {
    const name = authForm.name.trim()
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password

    if (!name || !email || !password) {
      setAuthSuccess('')
      setAuthError('Completa todos los campos para registrarte.')
      return
    }

    if (!passwordChecks.minLength) {
      setAuthSuccess('')
      setAuthError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (!passwordChecks.hasNumber) {
      setAuthSuccess('')
      setAuthError('La contraseña debe incluir al menos 1 número.')
      return
    }

    if (!passwordChecks.hasUppercase) {
      setAuthSuccess('')
      setAuthError('La contraseña debe incluir al menos 1 letra mayúscula.')
      return
    }

    if (!passwordChecks.hasSymbol) {
      setAuthSuccess('')
      setAuthError('La contraseña debe incluir al menos 1 símbolo.')
      return
    }

    const users = getSavedUsers()
    const exists = users.some((user) => user.email === email)

    if (exists) {
      setAuthSuccess('')
      setAuthError('Ese correo ya está registrado.')
      return
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      role: 'user',
    }

    saveUsers([...users, newUser])
    setAuthMode('login')
    setAuthForm({ name: '', email, password: '' })
    setAuthError('')
    setAuthSuccess('Registro exitoso. Ahora inicia sesión con tu correo y contraseña.')
  }

  // Inicia sesion verificando credenciales guardadas.
  const handleLogin = () => {
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password.trim()

    if (!email || !password) {
      setAuthSuccess('')
      setAuthError('Ingresa correo y contraseña.')
      return
    }

    const users = getSavedUsers()
    const existingUser = users.find((user) => user.email === email && user.password === password)

    if (!existingUser) {
      setAuthSuccess('')
      setAuthError('Credenciales inválidas.')
      return
    }

    setCurrentUser({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role ?? 'user',
    })
    setAuthError('')
    setAuthSuccess('')
    resetAuthForm()
  }

  // Decide si enviar a registro o login segun la pestana activa.
  const handleAuthSubmit = (event) => {
    event.preventDefault()

    if (authMode === 'register') {
      handleRegister()
      return
    }

    handleLogin()
  }

  // Cambia entre modo login/registro y reinicia mensajes.
  const handleSwitchAuthMode = (mode) => {
    setAuthMode(mode)
    setAuthError('')
    setAuthSuccess('')
    resetAuthForm()
  }

  // Cierra sesion y limpia estados visuales temporales.
  const handleLogout = () => {
    setCurrentUser(null)
    setIsClearCartPromptOpen(false)
    setShowReplyNotice(false)
    setReplyNoticeCount(0)
    setShowCartNotice(false)
    setCartNoticeText('')
    setUserView('store')
  }

  // Muestra la vista de carrito para usuarios cliente.
  const handleOpenCartView = () => {
    setUserView('cart')
  }

  // Muestra la vista principal de productos.
  const handleOpenStoreView = () => {
    setUserView('store')
  }

  // Muestra la vista de solicitudes del usuario.
  const handleOpenRequestsView = () => {
    setUserView('requests')
  }

  // Handlers de catalogo y carrito.
  // Guarda la talla elegida por producto.
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((currentSelection) => ({
      ...currentSelection,
      [productId]: size,
    }))
  }

  // Devuelve la talla seleccionada o la primera disponible como fallback.
  const getSelectedSizeForProduct = (product) => {
    const availableSizes = getProductSizeOptions(product)
    const selectedSize = selectedSizes[product.id]

    if (availableSizes.includes(selectedSize)) {
      return selectedSize
    }

    return availableSizes[0] ?? ''
  }

  // Agrega al carrito (o incrementa cantidad) para producto + talla.
  const handleAddToCart = (productToAdd, chosenSize) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find(
        (item) => item.id === productToAdd.id && item.selectedSize === chosenSize,
      )

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === productToAdd.id && item.selectedSize === chosenSize
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentCart, { ...productToAdd, selectedSize: chosenSize, quantity: 1 }]
    })

    setIsCartNoticeClosing(false)
    setCartNoticeText(`Agregado: ${productToAdd.name} talla ${chosenSize}`)
    setShowCartNotice(true)
    setCartNoticeId((currentId) => currentId + 1)
  }

  // Abre modal de detalle de producto.
  const handleOpenProductDetails = (product) => {
    setSelectedProduct(product)
  }

  // Cierra modal de detalle.
  const handleCloseProductDetails = () => {
    setSelectedProduct(null)
  }

  // Simula compra inmediata mediante confirmacion.
  const handleBuyNow = (product, chosenSize) => {
    const confirmed = window.confirm(
      `Comprar ahora "${product.name}" talla ${chosenSize} por $${product.price.toFixed(2)} sin pasar por el carrito?`,
    )

    if (!confirmed) {
      return
    }

    window.alert(
      `Compra inmediata confirmada para "${product.name}" en talla ${chosenSize}. ¡Gracias por tu compra!`,
    )
  }

  // Elimina una cantidad concreta de un item del carrito.
  const handleRemoveFromCart = (productId, selectedSize, productName, currentQuantity) => {
    const value = window.prompt(
      `¿Cuántos "${productName}" talla ${selectedSize} quieres borrar? (1-${currentQuantity})`,
      '1',
    )

    if (value === null) {
      return
    }

    const quantityToRemove = Number.parseInt(value, 10)

    if (!Number.isInteger(quantityToRemove) || quantityToRemove <= 0) {
      return
    }

    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId || item.selectedSize !== selectedSize) {
          return [item]
        }

        const nextQuantity = item.quantity - quantityToRemove

        if (nextQuantity <= 0) {
          return []
        }

        return [{ ...item, quantity: nextQuantity }]
      }),
    )
  }

  // Vacia el carrito completo.
  const handleClearCart = () => {
    setCart([])
    setIsClearCartPromptOpen(false)
  }

  // Aumenta en 1 la cantidad de un item del carrito.
  const handleIncreaseQuantity = (productId, selectedSize) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    )
  }

  // Reduce en 1 la cantidad y elimina si llega a cero.
  const handleDecreaseQuantity = (productId, selectedSize) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId || item.selectedSize !== selectedSize) {
          return [item]
        }

        if (item.quantity === 1) {
          return []
        }

        return [{ ...item, quantity: item.quantity - 1 }]
      }),
    )
  }

  // Restablece filtros de categoria, orden y busqueda.
  const handleResetFilters = () => {
    setSelectedCategory('Todas')
    setSortOrder('default')
    setAdminSearch('')
    setIsFiltersNoticeClosing(false)
    setShowFiltersNotice(true)
    setFiltersNoticeId((currentId) => currentId + 1)
    setFiltersNoticeFlashA((currentValue) => !currentValue)
  }

  // Cierra el aviso visual de filtros restablecidos.
  const handleCloseFiltersNotice = () => {
    setIsFiltersNoticeClosing(true)

    setTimeout(() => {
      setShowFiltersNotice(false)
      setIsFiltersNoticeClosing(false)
    }, 180)
  }

  // Cierra el aviso de respuestas nuevas del admin.
  const handleCloseReplyNotice = () => {
    setIsReplyNoticeClosing(true)

    setTimeout(() => {
      setShowReplyNotice(false)
      setIsReplyNoticeClosing(false)
      setReplyNoticeCount(0)
    }, 180)
  }

  // Cierra el aviso temporal de carrito.
  const handleCloseCartNotice = () => {
    setIsCartNoticeClosing(true)

    setTimeout(() => {
      setShowCartNotice(false)
      setIsCartNoticeClosing(false)
      setCartNoticeText('')
    }, 180)
  }

  // Handlers de solicitudes de cliente y respuestas admin.
  // Actualiza formulario de solicitud y limpia mensajes.
  const handleRequestInputChange = (event) => {
    const { name, value } = event.target
    setRequestForm((currentForm) => ({ ...currentForm, [name]: value }))

    if (requestError) {
      setRequestError('')
    }

    if (requestSuccess) {
      setRequestSuccess('')
    }
  }

  // Crea una nueva solicitud de cliente.
  const handleCreateRequest = (event) => {
    event.preventDefault()

    const subject = requestForm.subject.trim()
    const message = requestForm.message.trim()

    if (!subject || !message) {
      setRequestSuccess('')
      setRequestError('Completa asunto y detalle para enviar tu solicitud.')
      return
    }

    const newRequest = {
      id: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      type: requestForm.type,
      subject,
      message,
      createdAt: new Date().toISOString(),
      adminReply: '',
      repliedAt: null,
    }

    setCustomerRequests((currentRequests) => [newRequest, ...currentRequests])
    setRequestForm({ type: 'pedido', subject: '', message: '' })
    setRequestError('')
    setRequestSuccess('Tu solicitud se envió correctamente. El administrador la revisará.')
  }

  // Guarda borradores de respuesta del admin por solicitud.
  const handleAdminReplyChange = (requestId, value) => {
    setAdminReplyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [requestId]: value,
    }))
  }

  // Recupera el borrador activo (o respuesta ya guardada).
  const getAdminReplyDraft = (requestItem) => {
    const draftValue = adminReplyDrafts[requestItem.id]
    return draftValue ?? requestItem.adminReply ?? ''
  }

  // Publica la respuesta del admin y guarda fecha de respuesta.
  const handleReplyRequest = (requestId) => {
    const requestToReply = customerRequests.find((requestItem) => requestItem.id === requestId)

    if (!requestToReply) {
      return
    }

    const replyText = getAdminReplyDraft(requestToReply).trim()

    if (!replyText) {
      return
    }

    setCustomerRequests((currentRequests) =>
      currentRequests.map((requestItem) =>
        requestItem.id === requestId
          ? {
              ...requestItem,
              adminReply: replyText,
              repliedAt: new Date().toISOString(),
            }
          : requestItem,
      ),
    )
  }

  // Borra una solicitud del listado.
  const handleDeleteRequest = (requestId) => {
    setCustomerRequests((currentRequests) =>
      currentRequests.filter((requestItem) => requestItem.id !== requestId),
    )
  }

  // Handlers de CRUD de productos en panel admin.
  // Actualiza formulario de producto del panel admin.
  const handleProductInputChange = (event) => {
    const { name, value } = event.target
    setProductForm((currentForm) => ({ ...currentForm, [name]: value }))

    if (productError) {
      setProductError('')
    }

    if (productSuccess) {
      setProductSuccess('')
    }
  }

  // Carga una imagen local y la convierte a data URL para previsualizar/guardar.
  const handleProductImageFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      setProductSuccess('')
      setProductError('Selecciona un archivo de imagen válido.')
      return
    }

    const fileReader = new FileReader()

    fileReader.onload = () => {
      const fileResult = typeof fileReader.result === 'string' ? fileReader.result : ''

      if (!fileResult) {
        setProductSuccess('')
        setProductError('No se pudo leer la imagen seleccionada.')
        return
      }

      setProductForm((currentForm) => ({ ...currentForm, image: fileResult }))
      setProductError('')
      setProductSuccess(`Imagen cargada: ${selectedFile.name}`)
    }

    fileReader.onerror = () => {
      setProductSuccess('')
      setProductError('Error al cargar la imagen. Intenta con otro archivo.')
    }

    fileReader.readAsDataURL(selectedFile)
  }

  // Reinicia el formulario de producto a valores iniciales.
  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      price: '',
      size: '',
      image: DEFAULT_PRODUCT_IMAGE,
    })
  }

  // Crea o actualiza producto segun si hay una edicion activa.
  const handleCreateProduct = (event) => {
    event.preventDefault()

    const name = productForm.name.trim()
    const category = productForm.category.trim()
    const size = productForm.size.trim()
    const rawImage = productForm.image.trim()
    const image = normalizeProductImagePath(productForm.image)
    const price = Number.parseFloat(productForm.price)

    const isSvgPath =
      rawImage &&
      !rawImage.startsWith('data:image/') &&
      !/^https?:\/\//i.test(rawImage) &&
      rawImage.toLowerCase().endsWith('.svg')

    if (isSvgPath && !LEGACY_IMAGE_PATHS[rawImage]) {
      setProductSuccess('')
      setProductError('No uses rutas .svg manuales. Usa .jpg, .png, .webp o .avif.')
      return
    }

    if (!name || !category || !size || !image || Number.isNaN(price) || price <= 0) {
      setProductSuccess('')
      setProductError('Completa todos los campos del producto correctamente.')
      return
    }

    if (editingProductId) {
      const updatedProduct = hydrateProduct({
        id: editingProductId,
        name,
        category,
        price,
        size,
        image,
      })

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId ? { ...product, ...updatedProduct } : product,
        ),
      )
      setEditingProductId(null)
      resetProductForm()
      setProductError('')
      setProductSuccess('Producto actualizado correctamente.')
      return
    }

    const newProduct = hydrateProduct({
      id: Date.now(),
      name,
      category,
      price,
      size,
      image,
    })

    setProducts((currentProducts) => [newProduct, ...currentProducts])
    resetProductForm()
    setProductError('')
    setProductSuccess('Producto añadido correctamente.')
  }

  // Carga datos del producto en el formulario para editar.
  const handleStartEditProduct = (product) => {
    setEditingProductId(product.id)
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      size: product.size,
      image: product.image,
    })
    setProductError('')
    setProductSuccess('')
  }

  // Cancela la edicion actual y limpia formulario.
  const handleCancelEditProduct = () => {
    setEditingProductId(null)
    resetProductForm()
    setProductError('')
    setProductSuccess('')
  }

  // Borra un producto y lo retira tambien del carrito.
  const handleDeleteProduct = (productId, productName) => {
    const confirmed = window.confirm(`¿Seguro que quieres borrar "${productName}"?`)

    if (!confirmed) {
      return
    }

    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId))
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId))

    if (editingProductId === productId) {
      handleCancelEditProduct()
    }
  }

  if (!currentUser) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-label="Autenticación de usuario">
          <h1>Tienda de Ropa</h1>
          <p>{authMode === 'login' ? 'Inicia sesión para continuar.' : 'Crea una cuenta para empezar.'}</p>
          <p className="auth-admin-hint">Admin: admin@tienda.com / Admin123!</p>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${authMode === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => handleSwitchAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'register' ? 'auth-tab--active' : ''}`}
              onClick={() => handleSwitchAuthMode('register')}
            >
              Registro
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <label className="auth-field">
                Nombre
                <input
                  type="text"
                  name="name"
                  value={authForm.name}
                  onChange={handleAuthInputChange}
                  placeholder="Tu nombre"
                />
              </label>
            )}

            <label className="auth-field">
              Correo
              <input
                type="email"
                name="email"
                value={authForm.email}
                onChange={handleAuthInputChange}
                placeholder="correo@ejemplo.com"
              />
            </label>

            <label className="auth-field">
              Contraseña
              <input
                type="password"
                name="password"
                value={authForm.password}
                onChange={handleAuthInputChange}
                placeholder="********"
              />
            </label>

            {authMode === 'register' && (
              <ul className="password-rules" aria-label="Requisitos de contraseña">
                <li className={`password-rule ${passwordChecks.minLength ? 'password-rule--done' : ''}`}>
                  <span className="password-rule__icon">{passwordChecks.minLength ? '✓' : '✗'}</span>
                  Mínimo 8 caracteres
                </li>
                <li className={`password-rule ${passwordChecks.hasNumber ? 'password-rule--done' : ''}`}>
                  <span className="password-rule__icon">{passwordChecks.hasNumber ? '✓' : '✗'}</span>
                  Al menos 1 número
                </li>
                <li className={`password-rule ${passwordChecks.hasUppercase ? 'password-rule--done' : ''}`}>
                  <span className="password-rule__icon">{passwordChecks.hasUppercase ? '✓' : '✗'}</span>
                  Al menos 1 mayúscula
                </li>
                <li className={`password-rule ${passwordChecks.hasSymbol ? 'password-rule--done' : ''}`}>
                  <span className="password-rule__icon">{passwordChecks.hasSymbol ? '✓' : '✗'}</span>
                  Al menos 1 símbolo
                </li>
              </ul>
            )}

            {authError && <p className="auth-error">{authError}</p>}
            {authSuccess && <p className="auth-success">{authSuccess}</p>}

            <button type="submit" className="auth-submit">
              {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="store">
      <header className="store__header">
        <div className="store__top">
          <h1>Tienda de Ropa</h1>
          <div className="store__user-actions">
            {isAdmin && <span className="admin-badge">Admin</span>}
            {isAdmin && <span className="status-badge">Pendientes: {pendingRequestsCount}</span>}
            {!isAdmin && (
              <button
                type="button"
                className={`status-badge status-badge--button ${isUserCartView ? 'status-badge--active' : ''}`}
                onClick={handleOpenCartView}
              >
                Carrito: {totalItems}
              </button>
            )}
            {!isAdmin && (
              <button
                type="button"
                className={`status-badge status-badge--button ${isUserRequestsView ? 'status-badge--active' : ''}`}
                onClick={handleOpenRequestsView}
              >
                Mensajes: {answeredRequestsCount}
              </button>
            )}
            {!isAdmin && !isUserStoreView && (
              <button
                type="button"
                className="status-badge status-badge--button"
                onClick={handleOpenStoreView}
              >
                Volver a tienda
              </button>
            )}
            <button type="button" className="logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <p>Bienvenida, {currentUser.name}. Explora nuestros productos y filtra por categoría.</p>
      </header>

      {isAdmin && (
        <section className="admin-panel" aria-label="Gestión de productos">
          <h2>Panel de administrador {editingProductId ? '- Editando producto' : ''}</h2>
          <form className="admin-form" onSubmit={handleCreateProduct}>
            <input
              type="text"
              name="name"
              placeholder="Nombre del producto"
              value={productForm.name}
              onChange={handleProductInputChange}
            />
            <input
              type="text"
              name="category"
              placeholder="Categoría"
              value={productForm.category}
              onChange={handleProductInputChange}
            />
            <input
              type="number"
              name="price"
              placeholder="Precio"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={handleProductInputChange}
            />
            <input
              type="text"
              name="size"
              placeholder="Tallas (ej: S - XL)"
              value={productForm.size}
              onChange={handleProductInputChange}
            />
            <input
              type="text"
              name="image"
              placeholder="Ruta de imagen (ej: /images/ropa.jpg)"
              value={productForm.image}
              onChange={handleProductInputChange}
            />
            <select
              name="image"
              value={productForm.image.startsWith('data:image/') ? '' : normalizeProductImagePath(productForm.image)}
              onChange={handleProductInputChange}
            >
              <option value="">Elegir imagen existente</option>
              {AVAILABLE_PRODUCT_IMAGES.map((imagePath) => (
                <option key={imagePath} value={imagePath}>
                  {imagePath.replace('/images/', '')}
                </option>
              ))}
            </select>
            <input type="file" accept="image/*" onChange={handleProductImageFileChange} />
            <img
              src={resolveProductImageSrc(productForm.image)}
              alt="Vista previa del producto"
              className="product-image"
              onError={(event) => {
                event.currentTarget.src = resolveProductImageSrc(DEFAULT_PRODUCT_IMAGE)
              }}
            />
            <button type="submit">{editingProductId ? 'Guardar cambios' : 'Añadir producto'}</button>
            {editingProductId && (
              <button type="button" className="admin-cancel-button" onClick={handleCancelEditProduct}>
                Cancelar edición
              </button>
            )}
          </form>
          {productError && <p className="admin-message admin-message--error">{productError}</p>}
          {productSuccess && <p className="admin-message admin-message--success">{productSuccess}</p>}

          <div className="admin-search">
            <label htmlFor="admin-search-input">Buscar producto por nombre</label>
            <input
              id="admin-search-input"
              type="text"
              placeholder="Ej: camiseta"
              value={adminSearch}
              onChange={(event) => setAdminSearch(event.target.value)}
            />
          </div>
        </section>
      )}

      {(isAdmin || isUserStoreView) && (
        <section className="categories" aria-label="Categorías de producto">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-button ${selectedCategory === category ? 'category-button--active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </section>
      )}

      {(isAdmin || isUserStoreView) && (
        <section className="sort" aria-label="Orden de productos">
          <label htmlFor="sort-select">Ordenar por precio</label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="default">Sin ordenar</option>
            <option value="price-asc">Menor a mayor</option>
            <option value="price-desc">Mayor a menor</option>
          </select>
          <button type="button" className="reset-filters-button" onClick={handleResetFilters}>
            Restablecer filtros
          </button>
        </section>
      )}

      {(isAdmin || isUserRequestsView) && (
        <RequestsPanel
          isAdmin={isAdmin}
          requestForm={requestForm}
          requestError={requestError}
          requestSuccess={requestSuccess}
          myRequests={myRequests}
          customerRequests={customerRequests}
          formatDateTime={formatDateTime}
          onRequestInputChange={handleRequestInputChange}
          onCreateRequest={handleCreateRequest}
          onDeleteRequest={handleDeleteRequest}
          getAdminReplyDraft={getAdminReplyDraft}
          onAdminReplyChange={handleAdminReplyChange}
          onReplyRequest={handleReplyRequest}
        />
      )}

      {showFiltersNotice && (
        <div
          className={`filters-notice ${
            isFiltersNoticeClosing ? 'filters-notice--closing' : filtersNoticeFlashA ? 'filters-notice--flash-a' : 'filters-notice--flash-b'
          }`}
          role="status"
          aria-live="polite"
        >
          <span>Filtros restablecidos.</span>
          <button
            type="button"
            className="filters-notice__close"
            onClick={handleCloseFiltersNotice}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      {showReplyNotice && !isAdmin && (
        <div className={`reply-notice ${isReplyNoticeClosing ? 'reply-notice--closing' : ''}`} role="status" aria-live="polite">
          <span>
            {replyNoticeCount > 1
              ? `Tienes ${replyNoticeCount} respuestas nuevas del administrador.`
              : 'Tienes una respuesta nueva del administrador.'}
          </span>
          <button
            type="button"
            className="reply-notice__close"
            onClick={handleCloseReplyNotice}
            aria-label="Cerrar aviso de respuesta"
          >
            ×
          </button>
        </div>
      )}

      {showCartNotice && !isAdmin && (
        <div className={`cart-notice ${isCartNoticeClosing ? 'cart-notice--closing' : ''}`} role="status" aria-live="polite">
          <span>{cartNoticeText}</span>
          <button
            type="button"
            className="cart-notice__close"
            onClick={handleCloseCartNotice}
            aria-label="Cerrar aviso de carrito"
          >
            ×
          </button>
        </div>
      )}

      {(isAdmin || isUserStoreView) && (
      <section className="products" aria-label="Listado de productos">
        {displayedProducts.map((product) => {
          const availableSizes = getProductSizeOptions(product)
          const selectedSize = getSelectedSizeForProduct(product)

          return (
          <article key={product.id} className="product-card">
            <img
              src={resolveProductImageSrc(getCanonicalImageForProduct(product))}
              alt={product.name}
              className="product-image"
              onError={(event) => {
                event.currentTarget.src = getProductFallbackImage(product)
              }}
            />
            <h2>{product.name}</h2>
            <p className="product-meta">Categoría: {product.category}</p>
            <p className="product-meta">Tallas: {product.size}</p>
            <label className="size-selector">
              Elegir talla
              <select
                value={selectedSize}
                onChange={(event) => handleSizeChange(product.id, event.target.value)}
              >
                {availableSizes.map((sizeOption) => (
                  <option key={`${product.id}-size-${sizeOption}`} value={sizeOption}>
                    {sizeOption}
                  </option>
                ))}
              </select>
            </label>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <div className="product-card__actions">
              <button
                type="button"
                className="details-button"
                onClick={() => handleOpenProductDetails(product)}
              >
                Ver producto
              </button>
              {!isAdmin && (
                <button
                  type="button"
                  className="buy-now-button"
                  onClick={() => handleBuyNow(product, selectedSize)}
                >
                  Comprar ahora
                </button>
              )}
              <button
                type="button"
                className="add-button"
                onClick={() => handleAddToCart(product, selectedSize)}
              >
                Agregar al carrito
              </button>
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => handleStartEditProduct(product)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    Borrar producto
                  </button>
                </>
              )}
            </div>
          </article>
          )
        })}

        {displayedProducts.length === 0 && (
          <p className="products-empty">No hay productos que coincidan con la búsqueda.</p>
        )}
      </section>
      )}

      {selectedProduct && (
        <div className="product-modal" role="dialog" aria-modal="true" aria-label="Detalles del producto">
          <div className="product-modal__content">
            <button
              type="button"
              className="product-modal__close"
              onClick={handleCloseProductDetails}
              aria-label="Cerrar detalles"
            >
              ×
            </button>
            <img
              src={resolveProductImageSrc(getCanonicalImageForProduct(selectedProduct))}
              alt={selectedProduct.name}
              className="product-modal__image"
              onError={(event) => {
                event.currentTarget.src = getProductFallbackImage(selectedProduct)
              }}
            />
            <h3>{selectedProduct.name}</h3>
            <p className="product-modal__description">{selectedProduct.description}</p>
            <p className="product-modal__price">Precio: ${selectedProduct.price.toFixed(2)}</p>
            <p className="product-modal__sizes-title">Tallas disponibles:</p>
            <ul className="product-modal__sizes">
              {getProductSizeOptions(selectedProduct).map((sizeOption) => (
                <li key={`${selectedProduct.id}-${sizeOption}`}>{sizeOption}</li>
              ))}
            </ul>
            {!isAdmin && (
              <button
                type="button"
                className="buy-now-button"
                onClick={() => handleBuyNow(selectedProduct, getSelectedSizeForProduct(selectedProduct))}
              >
                Comprar ahora
              </button>
            )}
          </div>
        </div>
      )}

      {(isAdmin || isUserCartView) && (
        <CartSection
          cart={cart}
          totalItems={totalItems}
          totalPrice={totalPrice}
          isClearCartPromptOpen={isClearCartPromptOpen}
          onOpenClearPrompt={() => setIsClearCartPromptOpen(true)}
          onClearCart={handleClearCart}
          onCancelClearPrompt={() => setIsClearCartPromptOpen(false)}
          onDecreaseQuantity={handleDecreaseQuantity}
          onIncreaseQuantity={handleIncreaseQuantity}
          onRemoveFromCart={handleRemoveFromCart}
        />
      )}
    </main>
  )
}

export default App
