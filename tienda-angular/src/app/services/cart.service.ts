import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
}

const CART_STORAGE_KEY = 'tienda-cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.hydrateCart();
  }

  private hydrateCart(): void {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        const cart = JSON.parse(stored);
        this.cartSubject.next(Array.isArray(cart) ? cart : []);
      } catch (e) {
        console.error('Error hydrating cart:', e);
      }
    }
  }

  private saveCart(cart: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }

  getCart(): CartItem[] {
    return this.cartSubject.value;
  }

  getTotalItems(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice(): number {
    return this.cartSubject.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  addToCart(id: number, name: string, price: number, selectedSize: string, quantity: number = 1): void {
    const cart = this.cartSubject.value;
    const existingItem = cart.find(item => item.id === id && item.selectedSize === selectedSize);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ id, name, price, quantity, selectedSize });
    }

    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  removeFromCart(id: number, selectedSize: string): void {
    const cart = this.cartSubject.value.filter(
      item => !(item.id === id && item.selectedSize === selectedSize)
    );
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  removeByProductId(id: number): void {
    const cart = this.cartSubject.value.filter(item => item.id !== id);
    this.cartSubject.next(cart);
    this.saveCart(cart);
  }

  updateQuantity(id: number, selectedSize: string, quantity: number): void {
    const cart = this.cartSubject.value;
    const item = cart.find(i => i.id === id && i.selectedSize === selectedSize);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(id, selectedSize);
      } else {
        item.quantity = quantity;
        this.cartSubject.next(cart);
        this.saveCart(cart);
      }
    }
  }

  clearCart(): void {
    this.cartSubject.next([]);
    this.saveCart([]);
  }

  increaseQuantity(id: number, selectedSize: string): void {
    const item = this.cartSubject.value.find(i => i.id === id && i.selectedSize === selectedSize);
    if (item) {
      this.updateQuantity(id, selectedSize, item.quantity + 1);
    }
  }

  decreaseQuantity(id: number, selectedSize: string): void {
    const item = this.cartSubject.value.find(i => i.id === id && i.selectedSize === selectedSize);
    if (item && item.quantity > 1) {
      this.updateQuantity(id, selectedSize, item.quantity - 1);
    }
  }
}
