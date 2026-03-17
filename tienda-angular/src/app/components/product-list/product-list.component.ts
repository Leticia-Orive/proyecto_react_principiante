import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { UpcomingService, UpcomingProduct } from '../../services/upcoming.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  @Input() isAdmin = false;
  @Output() addedToCart = new EventEmitter<void>();
  @Output() editProduct = new EventEmitter<Product>();

  products: Product[] = [];
  filteredProducts: Product[] = [];
  upcomingProducts: UpcomingProduct[] = [];
  categories: string[] = [];
  selectedCategory = 'Todas';
  searchQuery = '';
  sortOrder = 'default';
  selectedSize = '';
  selectedProduct: Product | null = null;
  quantityToAdd = 1;
  successMessage = '';

  // Cart quantity modal state
  cartModalProduct: Product | null = null;
  cartModalSize = '';
  cartModalQuantity = '1';
  cartModalError = '';

  showFiltersNotice = false;
  isFiltersNoticeClosing = false;
  private filtersNoticeTimer: ReturnType<typeof setTimeout> | null = null;
  private filtersNoticeCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private upcomingService: UpcomingService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.upcomingService.upcoming$.subscribe(items => {
      this.upcomingProducts = items;
    });
  }

  private loadProducts(): void {
    this.productService.products$.subscribe(products => {
      this.products = products;
      this.applyFilters();
    });
  }

  private loadCategories(): void {
    this.productService.categories$.subscribe(categories => {
      this.categories = categories;
    });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onSortChange(order: string): void {
    this.sortOrder = order;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedCategory = 'Todas';
    this.searchQuery = '';
    this.sortOrder = 'default';
    this.applyFilters();
    this.showFiltersNoticeToast();
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    if (this.selectedCategory && this.selectedCategory !== 'Todas') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    if (this.sortOrder === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortOrder === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    this.filteredProducts = filtered;
  }

  openProductModal(product: Product): void {
    this.selectedProduct = product;
    this.selectedSize = '';
    this.quantityToAdd = 1;
    this.successMessage = '';
  }

  closeProductModal(): void {
    this.selectedProduct = null;
  }

  addToCart(): void {
    if (!this.selectedProduct || !this.selectedSize) {
      alert('Por favor selecciona una talla');
      return;
    }

    this.cartService.addToCart(
      this.selectedProduct.id,
      this.selectedProduct.name,
      this.selectedProduct.price,
      this.selectedSize,
      this.quantityToAdd
    );

    this.successMessage = `${this.selectedProduct.name} agregado al carrito`;
    this.addedToCart.emit();
    setTimeout(() => {
      this.closeProductModal();
    }, 1500);
  }

  onBuyNow(product: Product): void {
    if (product.stock <= 0) {
      alert(`"${product.name}" está agotado.`);
      return;
    }
    // Por ahora, "Comprar ahora" simplemente abre el modal de cantidad
    const availableSizes = product.availableSizes.length > 0 ? product.availableSizes[0] : '';
    this.onOpenAddToCartModal(product, availableSizes);
  }

  onOpenAddToCartModal(product: Product, size: string): void {
    this.cartModalProduct = product;
    this.cartModalSize = size;
    this.cartModalQuantity = '1';
    this.cartModalError = '';
  }

  onCloseAddToCartModal(): void {
    this.cartModalProduct = null;
    this.cartModalSize = '';
    this.cartModalQuantity = '1';
    this.cartModalError = '';
  }

  onConfirmAddToCart(): void {
    if (!this.cartModalProduct) return;

    const product = this.cartModalProduct;
    const size = this.cartModalSize;
    const quantity = parseInt(this.cartModalQuantity, 10);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      this.cartModalError = 'Ingresa una cantidad válida (mínimo 1).';
      return;
    }

    if (quantity > product.stock) {
      this.cartModalError = `Solo hay ${product.stock} unidad(es) disponibles para agregar.`;
      return;
    }

    this.cartService.addToCart(product.id, product.name, product.price, size, quantity);
    this.addedToCart.emit();
    this.onCloseAddToCartModal();
  }

  decreaseQuantity(): void {
    const current = parseInt(this.cartModalQuantity, 10);
    if (current > 1) {
      this.cartModalQuantity = (current - 1).toString();
    }
  }

  increaseQuantity(): void {
    const current = parseInt(this.cartModalQuantity, 10);
    if (current < (this.cartModalProduct?.stock || 0)) {
      this.cartModalQuantity = (current + 1).toString();
    }
  }

  isLowStock(product: Product): boolean {
    return product.stock <= 5;
  }

  onEditProduct(product: Product): void {
    this.editProduct.emit(product);
  }

  onDeleteProduct(product: Product): void {
    if (window.confirm(`¿Seguro que quieres borrar "${product.name}"?`)) {
      this.productService.deleteProduct(product.id);
      this.cartService.removeByProductId(product.id);
    }
  }

  closeFiltersNotice(): void {
    if (!this.showFiltersNotice || this.isFiltersNoticeClosing) {
      return;
    }

    this.isFiltersNoticeClosing = true;

    if (this.filtersNoticeTimer) {
      clearTimeout(this.filtersNoticeTimer);
      this.filtersNoticeTimer = null;
    }

    if (this.filtersNoticeCloseTimer) {
      clearTimeout(this.filtersNoticeCloseTimer);
    }

    this.filtersNoticeCloseTimer = setTimeout(() => {
      this.showFiltersNotice = false;
      this.isFiltersNoticeClosing = false;
      this.filtersNoticeCloseTimer = null;
    }, 180);
  }

  private showFiltersNoticeToast(): void {
    this.showFiltersNotice = true;
    this.isFiltersNoticeClosing = false;

    if (this.filtersNoticeTimer) {
      clearTimeout(this.filtersNoticeTimer);
    }

    if (this.filtersNoticeCloseTimer) {
      clearTimeout(this.filtersNoticeCloseTimer);
      this.filtersNoticeCloseTimer = null;
    }

    this.filtersNoticeTimer = setTimeout(() => {
      this.closeFiltersNotice();
      this.filtersNoticeTimer = null;
    }, 2000);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = '/images/camiseta-blanca.jpg';
    }
  }
}
