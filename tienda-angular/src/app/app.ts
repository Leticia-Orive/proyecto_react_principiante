import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, CurrentUser } from './services/auth.service';
import { AuthComponent } from './components/auth/auth.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { CartComponent } from './components/cart/cart.component';
import { RequestsComponent } from './components/requests/requests.component';
import { CartService } from './services/cart.service';
import { RequestService } from './services/request.service';
import { ProductService, Product } from './services/product.service';
import { UpcomingService, UpcomingProduct } from './services/upcoming.service';

type ViewMode = 'store' | 'cart' | 'messages' | 'edit-product';

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
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthComponent,
    ProductListComponent,
    CartComponent,
    RequestsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  currentUser: CurrentUser | null = null;
  totalItems = 0;
  pendingRequestsCount = 0;
  answeredRequestsCount = 0;
  currentView: ViewMode = 'store';
  private lastAnsweredRequestsCount = 0;
  showReplyNotice = false;
  isReplyNoticeClosing = false;
  private replyNoticeTimer: ReturnType<typeof setTimeout> | null = null;
  private replyNoticeCloseTimer: ReturnType<typeof setTimeout> | null = null;

  showCartNotice = false;
  isCartNoticeClosing = false;
  private cartNoticeTimer: ReturnType<typeof setTimeout> | null = null;
  private cartNoticeCloseTimer: ReturnType<typeof setTimeout> | null = null;

  // Edit product state
  editingProduct: Product | null = null;
  productForm = { name: '', category: '', price: '', stock: '', size: '', image: '/images/camiseta-blanca.jpg' };
  productError = '';
  productSuccess = '';
  availableProductImages = AVAILABLE_PRODUCT_IMAGES;

  // Upcoming admin form state
  upcomingProducts: UpcomingProduct[] = [];
  upcomingForm = { name: '', category: '', launchWindow: '', note: '', image: '/images/camiseta-blanca.jpg' };
  editingUpcomingId: string | null = null;
  upcomingError = '';
  upcomingSuccess = '';

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private requestService: RequestService,
    private productService: ProductService,
    private upcomingService: UpcomingService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.currentView = 'store';
      this.editingProduct = null;
      this.resetProductForm();
      this.updateRequestCounters();
    });

    this.cartService.cart$.subscribe(() => {
      this.totalItems = this.cartService.getTotalItems();
    });

    this.requestService.requests$.subscribe(() => {
      this.updateRequestCounters();
    });

    this.upcomingService.upcoming$.subscribe(items => {
      this.upcomingProducts = items;
    });
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  openStoreView(): void {
    this.currentView = 'store';
  }

  openCartView(): void {
    this.currentView = 'cart';
  }

  openMessagesView(): void {
    this.currentView = 'messages';
  }

  onProductAddedToCart(): void {
    this.openCartView();
    this.showCartNoticeToast();
  }

  onEditProduct(product: Product): void {
    this.editingProduct = product;
    this.productForm = {
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      size: product.availableSizes.join(', '),
      image: product.image || '/images/camiseta-blanca.jpg',
    };
    this.productError = '';
    this.productSuccess = `Editando: ${product.name}`;
    this.currentView = 'edit-product';
  }

  cancelEditProduct(): void {
    this.editingProduct = null;
    this.resetProductForm();
    this.currentView = 'store';
  }

  saveEditProduct(): void {
    if (!this.editingProduct) return;

    const name = this.productForm.name.trim();
    const category = this.productForm.category.trim();
    const image = this.productForm.image.trim();
    const price = parseFloat(this.productForm.price);
    const stock = parseInt(this.productForm.stock, 10);
    const availableSizes = this.productForm.size.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (!name || !category || !image || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0 || availableSizes.length === 0) {
      this.productError = 'Completa todos los campos correctamente.';
      return;
    }

    this.productService.updateProduct(this.editingProduct.id, { name, category, price, stock, availableSizes, image });
    this.productError = '';
    this.productSuccess = 'Producto actualizado correctamente.';
    setTimeout(() => {
      this.cancelEditProduct();
    }, 1200);
  }

  private resetProductForm(): void {
    this.productForm = { name: '', category: '', price: '', stock: '', size: '', image: '/images/camiseta-blanca.jpg' };
    this.productError = '';
    this.productSuccess = '';
  }

  // Upcoming CRUD
  onUpcomingFormChange(field: string, value: string): void {
    (this.upcomingForm as Record<string, string>)[field] = value;
    if (this.upcomingError) this.upcomingError = '';
    if (this.upcomingSuccess) this.upcomingSuccess = '';
  }

  submitUpcomingForm(): void {
    const name = this.upcomingForm.name.trim();
    const category = this.upcomingForm.category.trim();
    const launchWindow = this.upcomingForm.launchWindow.trim();
    const note = this.upcomingForm.note.trim();
    const image = this.upcomingForm.image.trim();

    if (!name || !category || !launchWindow || !note || !image) {
      this.upcomingSuccess = '';
      this.upcomingError = 'Completa todos los campos de Próximamente.';
      return;
    }

    if (this.editingUpcomingId) {
      this.upcomingService.update(this.editingUpcomingId, { name, category, launchWindow, note, image });
      this.editingUpcomingId = null;
      this.upcomingError = '';
      this.upcomingSuccess = 'Prenda próxima actualizada correctamente.';
    } else {
      this.upcomingService.add({ name, category, launchWindow, note, image });
      this.upcomingError = '';
      this.upcomingSuccess = 'Prenda añadida a Próximamente.';
    }
    this.resetUpcomingForm();
  }

  startEditUpcoming(item: UpcomingProduct): void {
    this.editingUpcomingId = item.id;
    this.upcomingForm = { name: item.name, category: item.category, launchWindow: item.launchWindow, note: item.note, image: item.image };
    this.upcomingError = '';
    this.upcomingSuccess = '';
  }

  cancelEditUpcoming(): void {
    this.editingUpcomingId = null;
    this.resetUpcomingForm();
  }

  deleteUpcoming(id: string, name: string): void {
    if (window.confirm(`¿Seguro que quieres borrar "${name}" de Próximamente?`)) {
      this.upcomingService.delete(id);
    }
  }

  private resetUpcomingForm(): void {
    this.upcomingForm = { name: '', category: '', launchWindow: '', note: '', image: '/images/camiseta-blanca.jpg' };
  }

  onProductImageSelected(value: string): void {
    this.productForm.image = value;
  }

  onUpcomingImageSelected(value: string): void {
    this.upcomingForm.image = value;
  }

  closeReplyNotice(): void {
    if (!this.showReplyNotice || this.isReplyNoticeClosing) {
      return;
    }

    this.isReplyNoticeClosing = true;

    if (this.replyNoticeTimer) {
      clearTimeout(this.replyNoticeTimer);
      this.replyNoticeTimer = null;
    }

    if (this.replyNoticeCloseTimer) {
      clearTimeout(this.replyNoticeCloseTimer);
    }

    this.replyNoticeCloseTimer = setTimeout(() => {
      this.showReplyNotice = false;
      this.isReplyNoticeClosing = false;
      this.replyNoticeCloseTimer = null;
    }, 180);
  }

  closeCartNotice(): void {
    if (!this.showCartNotice || this.isCartNoticeClosing) {
      return;
    }

    this.isCartNoticeClosing = true;

    if (this.cartNoticeTimer) {
      clearTimeout(this.cartNoticeTimer);
      this.cartNoticeTimer = null;
    }

    if (this.cartNoticeCloseTimer) {
      clearTimeout(this.cartNoticeCloseTimer);
    }

    this.cartNoticeCloseTimer = setTimeout(() => {
      this.showCartNotice = false;
      this.isCartNoticeClosing = false;
      this.cartNoticeCloseTimer = null;
    }, 180);
  }

  private showReplyNoticeToast(): void {
    this.showReplyNotice = true;
    this.isReplyNoticeClosing = false;

    if (this.replyNoticeTimer) {
      clearTimeout(this.replyNoticeTimer);
    }

    if (this.replyNoticeCloseTimer) {
      clearTimeout(this.replyNoticeCloseTimer);
      this.replyNoticeCloseTimer = null;
    }

    this.replyNoticeTimer = setTimeout(() => {
      this.closeReplyNotice();
      this.replyNoticeTimer = null;
    }, 2800);
  }

  private showCartNoticeToast(): void {
    this.showCartNotice = true;
    this.isCartNoticeClosing = false;

    if (this.cartNoticeTimer) {
      clearTimeout(this.cartNoticeTimer);
    }

    if (this.cartNoticeCloseTimer) {
      clearTimeout(this.cartNoticeCloseTimer);
      this.cartNoticeCloseTimer = null;
    }

    this.cartNoticeTimer = setTimeout(() => {
      this.closeCartNotice();
      this.cartNoticeTimer = null;
    }, 2200);
  }

  private updateRequestCounters(): void {
    if (!this.currentUser) {
      this.pendingRequestsCount = 0;
      this.answeredRequestsCount = 0;
      this.lastAnsweredRequestsCount = 0;
      return;
    }

    if (this.isAdmin) {
      this.pendingRequestsCount = this.requestService.getUnansweredRequests().length;
      this.answeredRequestsCount = 0;
      this.lastAnsweredRequestsCount = 0;
      return;
    }

    const myRequests = this.requestService.getUserRequests(this.currentUser.id);
    this.answeredRequestsCount = myRequests.filter((requestItem) => !!requestItem.adminReply).length;
    this.pendingRequestsCount = 0;

    // Replica el comportamiento esperado: si llega una nueva respuesta,
    // abrir automáticamente la vista de mensajes.
    if (this.answeredRequestsCount > this.lastAnsweredRequestsCount) {
      this.currentView = 'messages';
      this.showReplyNoticeToast();
    }

    this.lastAnsweredRequestsCount = this.answeredRequestsCount;
  }

  onLogout(): void {
    this.authService.logout();
    window.location.reload();
  }
}
