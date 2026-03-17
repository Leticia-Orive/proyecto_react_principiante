import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cart: CartItem[] = [];
  totalItems = 0;
  totalPrice = 0;
  isClearPromptOpen = false;
  private destroy$ = new Subject<void>();

  // Checkout modal state
  isCheckoutModalOpen = false;
  checkoutError = '';
  checkoutForm = {
    deliveryType: 'domicilio',
    deliveryZone: 'peninsula',
    paymentMethod: 'tarjeta',
    paymentAccountNumber: '',
    paymentPhone: '',
    deliveryAddress: '',
    deliveryNotes: '',
  };

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.cartService.cart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cart = cart;
        this.updateTotals();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTotals(): void {
    this.totalItems = this.cartService.getTotalItems();
    this.totalPrice = this.cartService.getTotalPrice();
  }

  onOpenClearPrompt(): void {
    this.isClearPromptOpen = true;
  }

  onCancelClearPrompt(): void {
    this.isClearPromptOpen = false;
  }

  onClearCart(): void {
    this.cartService.clearCart();
    this.isClearPromptOpen = false;
  }

  onDecreaseQuantity(id: number, size: string): void {
    this.cartService.decreaseQuantity(id, size);
  }

  onIncreaseQuantity(id: number, size: string): void {
    this.cartService.increaseQuantity(id, size);
  }

  onRemoveFromCart(id: number, size: string): void {
    this.cartService.removeFromCart(id, size);
  }

  onCheckout(): void {
    if (this.cart.length === 0) return;
    this.checkoutError = '';
    this.isCheckoutModalOpen = true;
  }

  closeCheckoutModal(): void {
    this.isCheckoutModalOpen = false;
    this.checkoutError = '';
  }

  get checkoutSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get checkoutShippingFee(): number {
    return 0;
  }

  get checkoutStorePaymentDiscount(): number {
    return this.checkoutForm.paymentMethod === 'pago-tienda'
      ? this.checkoutSubtotal * 0.1
      : 0;
  }

  get checkoutFinalTotal(): number {
    return Math.max(0, this.checkoutSubtotal + this.checkoutShippingFee - this.checkoutStorePaymentDiscount);
  }

  get requiresPaymentDetails(): boolean {
    return this.checkoutForm.paymentMethod === 'bizum' || this.checkoutForm.paymentMethod === 'tarjeta';
  }

  confirmCheckout(): void {
    const { deliveryType, deliveryZone, deliveryAddress, paymentMethod, paymentAccountNumber, paymentPhone, deliveryNotes } = this.checkoutForm;
    const accountNum = paymentAccountNumber.replace(/\s+/g, '').trim();
    const phone = paymentPhone.replace(/\s+/g, '').trim();

    if (this.cart.length === 0) {
      this.checkoutError = 'No hay productos para procesar en esta compra.';
      return;
    }

    if (!paymentMethod) {
      this.checkoutError = 'Selecciona una forma de pago.';
      return;
    }

    if (this.requiresPaymentDetails && !accountNum) {
      this.checkoutError = 'Indica el número de cuenta o tarjeta para completar el pago.';
      return;
    }

    if (this.requiresPaymentDetails && !/^\d{8,24}$/.test(accountNum)) {
      this.checkoutError = 'El número de cuenta o tarjeta debe tener solo dígitos (8 a 24).';
      return;
    }

    if (this.requiresPaymentDetails && !phone) {
      this.checkoutError = 'Indica un teléfono para el pago.';
      return;
    }

    if (this.requiresPaymentDetails && !/^\+?\d{9,15}$/.test(phone)) {
      this.checkoutError = 'Introduce un teléfono válido (9 a 15 dígitos, opcional + al inicio).';
      return;
    }

    if (deliveryType === 'domicilio' && !deliveryAddress.trim()) {
      this.checkoutError = 'Indica la dirección de entrega.';
      return;
    }

    const zoneLabel = deliveryZone === 'fuera-peninsula' ? 'Fuera de la península'
      : deliveryZone === 'internacional' ? 'Otro país' : 'Península';
    const deliverySummary = deliveryType === 'tienda'
      ? 'Recogida en tienda (sin gasto de envío)'
      : `Entrega a domicilio (${zoneLabel}): ${deliveryAddress}`;
    const paymentLabel = paymentMethod === 'pago-tienda' ? 'Pago en tienda (10% de descuento)' : paymentMethod;
    const paymentDetails = this.requiresPaymentDetails
      ? `\nReferencia de pago: ${accountNum}\nTeléfono de pago: ${phone}` : '';

    alert(
      `Compra realizada con éxito.\n\nForma de pago: ${paymentLabel}${paymentDetails}\nEntrega: ${deliverySummary}\nSubtotal: $${this.checkoutSubtotal.toFixed(2)}\nEnvío: $${this.checkoutShippingFee.toFixed(2)}\nDescuento pago en tienda: -$${this.checkoutStorePaymentDiscount.toFixed(2)}\nTotal final: $${this.checkoutFinalTotal.toFixed(2)}${deliveryNotes ? `\nNotas: ${deliveryNotes}` : ''}.`
    );

    // Descontar stock de productos comprados
    const purchasedByProductId: Record<number, number> = {};
    this.cart.forEach(item => {
      purchasedByProductId[item.id] = (purchasedByProductId[item.id] ?? 0) + item.quantity;
    });
    Object.entries(purchasedByProductId).forEach(([id, qty]) => {
      this.productService.updateProduct(Number(id), {
        stock: Math.max(0, (this.productService.getProductById(Number(id))?.stock ?? 0) - qty)
      });
    });

    this.cartService.clearCart();
    this.isCheckoutModalOpen = false;
    this.checkoutError = '';
    this.checkoutForm = {
      deliveryType: 'domicilio',
      deliveryZone: 'peninsula',
      paymentMethod: 'tarjeta',
      paymentAccountNumber: '',
      paymentPhone: '',
      deliveryAddress: '',
      deliveryNotes: '',
    };
  }
}
