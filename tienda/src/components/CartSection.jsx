function CartSection({
  cart,
  totalItems,
  totalPrice,
  isClearCartPromptOpen,
  onOpenClearPrompt,
  onClearCart,
  onCancelClearPrompt,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveFromCart,
}) {
  return (
    <section className="cart" aria-label="Carrito de compras">
      <div className="cart__header">
        <h2>Carrito</h2>
        <div className="cart__header-actions">
          <span>{totalItems} producto(s)</span>
          {cart.length > 0 && (
            <button type="button" className="clear-button" onClick={onOpenClearPrompt}>
              Vaciar carrito
            </button>
          )}
        </div>
      </div>

      {isClearCartPromptOpen && cart.length > 0 && (
        <div className="clear-confirmation" role="alert" aria-live="polite">
          <p>Seguro que quieres vaciar el carrito?</p>
          <div className="clear-confirmation__actions">
            <button type="button" className="confirmation-button" onClick={onClearCart}>
              Confirmar
            </button>
            <button type="button" className="cancel-button" onClick={onCancelClearPrompt}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cart.length === 0 ? (
        <p className="cart__empty">Tu carrito esta vacio.</p>
      ) : (
        <>
          <ul className="cart__list">
            {cart.map((item) => (
              <li key={`${item.id}-${item.selectedSize}`} className="cart__item">
                <div>
                  <p className="cart__name">{item.name}</p>
                  <div className="cart__quantity">
                    <button
                      type="button"
                      className="quantity-button"
                      onClick={() => onDecreaseQuantity(item.id, item.selectedSize)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="quantity-button"
                      onClick={() => onIncreaseQuantity(item.id, item.selectedSize)}
                    >
                      +
                    </button>
                  </div>
                  <p className="cart__meta">Talla elegida: {item.selectedSize}</p>
                  <p className="cart__meta">Precio unitario: ${item.price.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => onRemoveFromCart(item.id, item.selectedSize, item.name, item.quantity)}
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
  )
}

export default CartSection
