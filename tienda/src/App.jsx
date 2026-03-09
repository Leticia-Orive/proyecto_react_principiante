import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import CartSection from './components/CartSection'
import RequestsPanel from './components/RequestsPanel'

const CART_STORAGE_KEY = 'tienda-cart'
const USERS_STORAGE_KEY = 'tienda-users'
const SESSION_STORAGE_KEY = 'tienda-session'
const PRODUCTS_STORAGE_KEY = 'tienda-products'
const SORT_STORAGE_KEY = 'tienda-sort-order'
const CATEGORY_STORAGE_KEY = 'tienda-selected-category'
const REQUESTS_STORAGE_KEY = 'tienda-customer-requests'
const SEEN_REPLIES_STORAGE_KEY = 'tienda-seen-replies'
const DEFAULT_PRODUCT_IMAGE = '/images/camiseta-blanca.jpg'
const AVAILABLE_PRODUCT_IMAGES = [
  '/images/camiseta-blanca.jpg',
  '/images/jeans-azul.avif',
  '/images/sudadera-gris.png',
  '/images/chaqueta-denim.avif',
  '/images/vestido-floral.webp',
  '/images/cargo-beige.jpg',
  '/images/camiseta-estampada.webp',
  '/images/bomber-oliva.webp',
]
const LEGACY_IMAGE_PATHS = {
  '/images/camiseta-blanca.svg': '/images/camiseta-blanca.jpg',
  '/images/jeans-azul.svg': '/images/jeans-azul.avif',
  '/images/sudadera-gris.svg': '/images/sudadera-gris.png',
  '/images/chaqueta-denim.svg': '/images/chaqueta-denim.avif',
  '/images/vestido-floral.svg': '/images/vestido-floral.webp',
  '/images/cargo-beige.svg': '/images/cargo-beige.jpg',
  '/images/camiseta-estampada.svg': '/images/camiseta-estampada.webp',
  '/images/bomber-oliva.svg': '/images/bomber-oliva.webp',
}

const DEFAULT_ADMIN_USER = {
  id: 999001,
  name: 'Admin',
  email: 'admin@tienda.com',
  password: 'Admin123!',
  role: 'admin',
}

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Camiseta básica blanca',
    category: 'Camisetas',
    price: 19.99,
    size: 'S - XL',
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Camiseta de algodón suave para uso diario. Corte regular, ligera y fácil de combinar con jeans o shorts.',
    image: '/images/camiseta-blanca.jpg',
  },
  {
    id: 2,
    name: 'Jeans rectos azul',
    category: 'Pantalones',
    price: 39.99,
    size: '36 - 46',
    sizes: ['36', '38', '40', '42', '44', '46'],
    description:
      'Jeans rectos de tiro medio con tejido resistente y cómodo. Perfectos para looks casuales y urbanos.',
    image: '/images/jeans-azul.avif',
  },
  {
    id: 3,
    name: 'Sudadera oversize gris',
    category: 'Sudaderas',
    price: 34.99,
    size: 'M - XXL',
    sizes: ['M', 'L', 'XL', 'XXL'],
    description:
      'Sudadera oversize con interior afelpado que aporta abrigo y confort, ideal para días frescos.',
    image: '/images/sudadera-gris.png',
  },
  {
    id: 4,
    name: 'Chaqueta denim negra',
    category: 'Chaquetas',
    price: 54.99,
    size: 'S - XL',
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Chaqueta denim negra con acabado moderno y estructura firme. Una prenda versátil para todo el año.',
    image: '/images/chaqueta-denim.avif',
  },
  {
    id: 5,
    name: 'Vestido midi floral',
    category: 'Vestidos',
    price: 44.99,
    size: 'S - L',
    sizes: ['S', 'M', 'L'],
    description:
      'Vestido midi floral de caída ligera, ideal para salidas de día o eventos informales.',
    image: '/images/vestido-floral.webp',
  },
  {
    id: 6,
    name: 'Pantalón cargo beige',
    category: 'Pantalones',
    price: 42.5,
    size: '38 - 46',
    sizes: ['38', '40', '42', '44', '46'],
    description:
      'Pantalón cargo con bolsillos funcionales y ajuste cómodo, pensado para un estilo práctico y actual.',
    image: '/images/cargo-beige.jpg',
  },
  {
    id: 7,
    name: 'Camiseta estampada',
    category: 'Camisetas',
    price: 22.5,
    size: 'S - XL',
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'Camiseta estampada con diseño frontal, confeccionada en tejido transpirable para uso diario.',
    image: '/images/camiseta-estampada.webp',
  },
  {
    id: 8,
    name: 'Bomber verde oliva',
    category: 'Chaquetas',
    price: 59.9,
    size: 'M - XXL',
    sizes: ['M', 'L', 'XL', 'XXL'],
    description:
      'Chaqueta bomber con cierre frontal y puños elásticos, ideal para completar un look urbano.',
    image: '/images/bomber-oliva.webp',
  },
]

const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

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

const resolveProductImageSrc = (imagePath) => {
  const normalizedPath = normalizeProductImagePath(imagePath)

  if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith('data:image/')) {
    return normalizedPath
  }

  const cleanPath = normalizedPath.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${cleanPath}`
}

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

const hydrateProduct = (product) => {
  const fallbackDescription = `Prenda de la categoría ${product.category} con diseño moderno y cómodo para uso diario.`
  const sizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : parseSizeRange(product.size)

  return {
    ...product,
    sizes,
    description: product.description?.trim() || fallbackDescription,
    image: normalizeProductImagePath(product.image),
  }
}

const getProductSizeOptions = (product) => {
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return product.sizes
  }

  return product.size ? [product.size] : []
}

const hydrateCustomerRequest = (requestItem) => ({
  ...requestItem,
  adminReply: requestItem.adminReply?.trim() ?? '',
  repliedAt: requestItem.repliedAt ?? null,
})

const formatDateTime = (value) => {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('es-ES')
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
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

  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY)

      if (!savedProducts) {
        return DEFAULT_PRODUCTS
      }

      const parsedProducts = JSON.parse(savedProducts)
      return Array.isArray(parsedProducts) && parsedProducts.length > 0
        ? parsedProducts.map((product) => hydrateProduct(product))
        : DEFAULT_PRODUCTS
    } catch {
      return DEFAULT_PRODUCTS
    }
  })

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
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedSizes, setSelectedSizes] = useState({})

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

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(customerRequests))
  }, [customerRequests])

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOrder)
  }, [sortOrder])

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, selectedCategory)
  }, [selectedCategory])

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

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser))
      return
    }

    localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [currentUser])

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

  const saveUsers = (users) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }

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

  const resetAuthForm = () => {
    setAuthForm({ name: '', email: '', password: '' })
  }

  const handleAuthInputChange = (event) => {
    const { name, value } = event.target
    setAuthForm((currentForm) => ({ ...currentForm, [name]: value }))
    if (authError) {
      setAuthError('')
    }
  }

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

  const handleAuthSubmit = (event) => {
    event.preventDefault()

    if (authMode === 'register') {
      handleRegister()
      return
    }

    handleLogin()
  }

  const handleSwitchAuthMode = (mode) => {
    setAuthMode(mode)
    setAuthError('')
    setAuthSuccess('')
    resetAuthForm()
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsClearCartPromptOpen(false)
    setShowReplyNotice(false)
    setReplyNoticeCount(0)
    setShowCartNotice(false)
    setCartNoticeText('')
    setUserView('store')
  }

  const handleOpenCartView = () => {
    setUserView('cart')
  }

  const handleOpenStoreView = () => {
    setUserView('store')
  }

  const handleOpenRequestsView = () => {
    setUserView('requests')
  }

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((currentSelection) => ({
      ...currentSelection,
      [productId]: size,
    }))
  }

  const getSelectedSizeForProduct = (product) => {
    const availableSizes = getProductSizeOptions(product)
    const selectedSize = selectedSizes[product.id]

    if (availableSizes.includes(selectedSize)) {
      return selectedSize
    }

    return availableSizes[0] ?? ''
  }

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

  const handleOpenProductDetails = (product) => {
    setSelectedProduct(product)
  }

  const handleCloseProductDetails = () => {
    setSelectedProduct(null)
  }

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

  const handleClearCart = () => {
    setCart([])
    setIsClearCartPromptOpen(false)
  }

  const handleIncreaseQuantity = (productId, selectedSize) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId && item.selectedSize === selectedSize
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    )
  }

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

  const handleResetFilters = () => {
    setSelectedCategory('Todas')
    setSortOrder('default')
    setAdminSearch('')
    setIsFiltersNoticeClosing(false)
    setShowFiltersNotice(true)
    setFiltersNoticeId((currentId) => currentId + 1)
    setFiltersNoticeFlashA((currentValue) => !currentValue)
  }

  const handleCloseFiltersNotice = () => {
    setIsFiltersNoticeClosing(true)

    setTimeout(() => {
      setShowFiltersNotice(false)
      setIsFiltersNoticeClosing(false)
    }, 180)
  }

  const handleCloseReplyNotice = () => {
    setIsReplyNoticeClosing(true)

    setTimeout(() => {
      setShowReplyNotice(false)
      setIsReplyNoticeClosing(false)
      setReplyNoticeCount(0)
    }, 180)
  }

  const handleCloseCartNotice = () => {
    setIsCartNoticeClosing(true)

    setTimeout(() => {
      setShowCartNotice(false)
      setIsCartNoticeClosing(false)
      setCartNoticeText('')
    }, 180)
  }

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

  const handleAdminReplyChange = (requestId, value) => {
    setAdminReplyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [requestId]: value,
    }))
  }

  const getAdminReplyDraft = (requestItem) => {
    const draftValue = adminReplyDrafts[requestItem.id]
    return draftValue ?? requestItem.adminReply ?? ''
  }

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

  const handleDeleteRequest = (requestId) => {
    setCustomerRequests((currentRequests) =>
      currentRequests.filter((requestItem) => requestItem.id !== requestId),
    )
  }

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

  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      price: '',
      size: '',
      image: DEFAULT_PRODUCT_IMAGE,
    })
  }

  const handleCreateProduct = (event) => {
    event.preventDefault()

    const name = productForm.name.trim()
    const category = productForm.category.trim()
    const size = productForm.size.trim()
    const image = normalizeProductImagePath(productForm.image)
    const price = Number.parseFloat(productForm.price)

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

  const handleCancelEditProduct = () => {
    setEditingProductId(null)
    resetProductForm()
    setProductError('')
    setProductSuccess('')
  }

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
              src={resolveProductImageSrc(product.image)}
              alt={product.name}
              className="product-image"
              onError={(event) => {
                event.currentTarget.src = resolveProductImageSrc(DEFAULT_PRODUCT_IMAGE)
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
              src={resolveProductImageSrc(selectedProduct.image)}
              alt={selectedProduct.name}
              className="product-modal__image"
              onError={(event) => {
                event.currentTarget.src = resolveProductImageSrc(DEFAULT_PRODUCT_IMAGE)
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
