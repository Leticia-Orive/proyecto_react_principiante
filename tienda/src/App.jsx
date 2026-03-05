import { useEffect, useMemo, useState } from 'react'
import './App.css'

const CART_STORAGE_KEY = 'tienda-cart'

const PRODUCTS = [
  {
    id: 1,
    name: 'Camiseta básica blanca',
    category: 'Camisetas',
    price: 19.99,
    size: 'S - XL',
    image: '/images/camiseta-blanca.svg',
  },
  {
    id: 2,
    name: 'Jeans rectos azul',
    category: 'Pantalones',
    price: 39.99,
    size: '36 - 46',
    image: '/images/jeans-azul.svg',
  },
  {
    id: 3,
    name: 'Sudadera oversize gris',
    category: 'Sudaderas',
    price: 34.99,
    size: 'M - XXL',
    image: '/images/sudadera-gris.svg',
  },
  {
    id: 4,
    name: 'Chaqueta denim negra',
    category: 'Chaquetas',
    price: 54.99,
    size: 'S - XL',
    image: '/images/chaqueta-denim.svg',
  },
  {
    id: 5,
    name: 'Vestido midi floral',
    category: 'Vestidos',
    price: 44.99,
    size: 'S - L',
    image: '/images/vestido-floral.svg',
  },
  {
    id: 6,
    name: 'Pantalón cargo beige',
    category: 'Pantalones',
    price: 42.5,
    size: '38 - 46',
    image: '/images/cargo-beige.svg',
  },
  {
    id: 7,
    name: 'Camiseta estampada',
    category: 'Camisetas',
    price: 22.5,
    size: 'S - XL',
    image: '/images/camiseta-estampada.svg',
  },
  {
    id: 8,
    name: 'Bomber verde oliva',
    category: 'Chaquetas',
    price: 59.9,
    size: 'M - XXL',
    image: '/images/bomber-oliva.svg',
  },
]

function App() {
  const [selectedCategory, setSelectedCategory] = useState('Todas')
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

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(PRODUCTS.map((product) => product.category))]
    return ['Todas', ...uniqueCategories]
  }, [])

  const filteredProducts =
    selectedCategory === 'Todas'
      ? PRODUCTS
      : PRODUCTS.filter((product) => product.category === selectedCategory)

  const totalItems = useMemo(
    () => cart.reduce((accumulator, item) => accumulator + item.quantity, 0),
    [cart],
  )

  const totalPrice = useMemo(
    () => cart.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0),
    [cart],
  )

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const handleAddToCart = (productToAdd) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === productToAdd.id)

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [...currentCart, { ...productToAdd, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (productId, productName, currentQuantity) => {
    const value = window.prompt(
      `¿Cuántos "${productName}" quieres borrar? (1-${currentQuantity})`,
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
        if (item.id !== productId) {
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

  const handleIncreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    )
  }

  const handleDecreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId) {
          return [item]
        }

        if (item.quantity === 1) {
          return []
        }

        return [{ ...item, quantity: item.quantity - 1 }]
      }),
    )
  }

  return (
    <main className="store">
      <header className="store__header">
        <h1>Tienda de Ropa</h1>
        <p>Explora nuestros productos y filtra por categoría.</p>
      </header>

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

      <section className="products" aria-label="Listado de productos">
        {filteredProducts.map((product) => (
          <article key={product.id} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <h2>{product.name}</h2>
            <p className="product-meta">Categoría: {product.category}</p>
            <p className="product-meta">Tallas: {product.size}</p>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <button type="button" className="add-button" onClick={() => handleAddToCart(product)}>
              Agregar al carrito
            </button>
          </article>
        ))}
      </section>

      <section className="cart" aria-label="Carrito de compras">
        <div className="cart__header">
          <h2>Carrito</h2>
          <div className="cart__header-actions">
            <span>{totalItems} producto(s)</span>
            {cart.length > 0 && (
              <button
                type="button"
                className="clear-button"
                onClick={() => setIsClearCartPromptOpen(true)}
              >
                Vaciar carrito
              </button>
            )}
          </div>
        </div>

        {isClearCartPromptOpen && cart.length > 0 && (
          <div className="clear-confirmation" role="alert" aria-live="polite">
            <p>¿Seguro que quieres vaciar el carrito?</p>
            <div className="clear-confirmation__actions">
              <button type="button" className="confirmation-button" onClick={handleClearCart}>
                Confirmar
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setIsClearCartPromptOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="cart__empty">Tu carrito está vacío.</p>
        ) : (
          <>
            <ul className="cart__list">
              {cart.map((item) => (
                <li key={item.id} className="cart__item">
                  <div>
                    <p className="cart__name">{item.name}</p>
                    <div className="cart__quantity">
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => handleDecreaseQuantity(item.id)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => handleIncreaseQuantity(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart__meta">Precio unitario: ${item.price.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleRemoveFromCart(item.id, item.name, item.quantity)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
            <p className="cart__total">Total: ${totalPrice.toFixed(2)}</p>
          </>
        )}
      </section>
    </main>
  )
}

export default App
