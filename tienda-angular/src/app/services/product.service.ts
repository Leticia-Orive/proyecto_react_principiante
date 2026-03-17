import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  availableSizes: string[];
  description: string;
  image: string;
  stock: number;
}

const PRODUCTS_STORAGE_KEY = 'tienda-products';

const DEFAULT_PRODUCT_ROWS = [
  [1, 'Camiseta Blanca', 'camisetas', 29.99, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'Cómoda camiseta blanca 100% algodón', '/images/camiseta-blanca.jpg', 12],
  [2, 'Camiseta Azul', 'camisetas', 29.99, ['XS', 'S', 'M', 'L', 'XL'], 'Camiseta azul clásica de calidad', '/images/camiseta-azul.webp', 15],
  [3, 'Camiseta Pato', 'camisetas', 34.99, ['S', 'M', 'L', 'XL'], 'Camiseta con estampado divertido', '/images/camiseta-pato.avif', 8],
  [4, 'Jeans Azul', 'pantalones', 59.99, ['S', 'M', 'L', 'XL', 'XXL'], 'Jeans azul clasico ajustado', '/images/jeans-azul.avif', 10],
  [5, 'Sudadera Gris', 'sudaderas', 49.99, ['XS', 'S', 'M', 'L', 'XL'], 'Sudadera gris cómoda y cálida', '/images/sudadera-gris.png', 12],
  [6, 'Sudadera Baggy', 'sudaderas', 54.99, ['S', 'M', 'L', 'XL'], 'Sudadera oversized de moda', '/images/sudadera-baggy.jpg', 7],
  [7, 'Chaqueta Denim', 'chaquetas', 79.99, ['XS', 'S', 'M', 'L', 'XL'], 'Chaqueta vaquera clásica', '/images/chaqueta-denim.avif', 5],
  [8, 'Chaqueta Bomber', 'chaquetas', 89.99, ['S', 'M', 'L', 'XL', 'XXL'], 'Chaqueta bomber moderna', '/images/chaqueta-bomber.webp', 6],
  [9, 'Chaqueta Champions', 'chaquetas', 99.99, ['M', 'L', 'XL'], 'Chaqueta deportiva', '/images/chaqueta-champions.jpg', 4],
  [10, 'Vestido Floral', 'vestidos', 69.99, ['XS', 'S', 'M', 'L'], 'Vestido con flores', '/images/vestido-floral.webp', 9],
  [11, 'Vestido Sweetra', 'vestidos', 74.99, ['S', 'M', 'L'], 'Vestido elegante', '/images/vestido-sweetra.webp', 5],
  [12, 'Cargo Beige', 'pantalones', 64.99, ['S', 'M', 'L', 'XL'], 'Pantalón cargo cómodo', '/images/cargo-beige.jpg', 8],
  [13, 'Pantalones Baggy', 'pantalones', 59.99, ['XS', 'S', 'M', 'L', 'XL'], 'Pantalones baggy trendy', '/images/pantalones-baggy.webp', 11],
  [14, 'Pantalones Negros', 'pantalones', 54.99, ['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'Pantalones negros básicos', '/images/pantalones-negros.webp', 14],
  [15, 'Camiseta Estampada', 'camisetas', 34.99, ['S', 'M', 'L', 'XL'], 'Camiseta con estampado', '/images/camiseta-estampada.webp', 6],
  [16, 'Bomber Oliva', 'chaquetas', 84.99, ['S', 'M', 'L', 'XL'], 'Bomber color oliva', '/images/bomber-oliva.webp', 7],
  [17, 'Gorra Negra', 'accesorios', 19.99, ['Único'], 'Gorra negra clásica', '/images/gorra-negra.webp', 20],
  [18, 'Zapatillas Blancas', 'calzado', 79.99, ['35', '36', '37', '38', '39', '40', '41', '42'], 'Zapatillas blancas cómodas', '/images/zapatillas-blancas.webp', 15],
  [19, 'Bandolera', 'accesorios', 39.99, ['Único'], 'Bandolera versátil', '/images/bandolera.webp', 10],
  [20, 'Botines Negros', 'calzado', 89.99, ['35', '36', '37', '38', '39', '40', '41'], 'Botines elegantes', '/images/botines-negros.jpg', 5],
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<string[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.hydrateProducts();
  }

  private hydrateProducts(): void {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (stored) {
      try {
        const products = JSON.parse(stored);
        this.productsSubject.next(products);
        this.updateCategories();
        return;
      } catch (e) {
        console.error('Error hydrating products:', e);
      }
    }

    // Crear products por defecto
    const defaultProducts: Product[] = DEFAULT_PRODUCT_ROWS.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      category: row[2] as string,
      price: row[3] as number,
      availableSizes: row[4] as string[],
      description: row[5] as string,
      image: row[6] as string,
      stock: row[7] as number
    }));

    this.productsSubject.next(defaultProducts);
    this.saveProducts(defaultProducts);
    this.updateCategories();
  }

  private saveProducts(products: Product[]): void {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }

  private updateCategories(): void {
    const products = this.productsSubject.value;
    const categories = Array.from(new Set(products.map(p => p.category))).sort();
    this.categoriesSubject.next(categories);
  }

  getProducts(): Product[] {
    return this.productsSubject.value;
  }

  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find(p => p.id === id);
  }

  getProductsByCategory(category: string): Product[] {
    return this.productsSubject.value.filter(p => p.category === category);
  }

  searchProducts(query: string): Product[] {
    const term = query.toLowerCase();
    return this.productsSubject.value.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  addProduct(product: Omit<Product, 'id'>): Product {
    const products = this.productsSubject.value;
    const newId = Math.max(0, ...products.map(p => p.id)) + 1;
    const newProduct: Product = { ...product, id: newId };

    products.push(newProduct);
    this.productsSubject.next(products);
    this.saveProducts(products);
    this.updateCategories();

    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const products = this.productsSubject.value;
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return null;

    products[index] = { ...products[index], ...updates };
    this.productsSubject.next(products);
    this.saveProducts(products);
    this.updateCategories();

    return products[index];
  }

  deleteProduct(id: number): boolean {
    const products = this.productsSubject.value.filter(p => p.id !== id);
    if (products.length === this.productsSubject.value.length) return false;

    this.productsSubject.next(products);
    this.saveProducts(products);
    this.updateCategories();

    return true;
  }

  updateStock(productId: number, sizeOrQuantity: string | number, quantity: number): boolean {
    const products = this.productsSubject.value;
    const product = products.find(p => p.id === productId);

    if (!product) return false;

    product.stock = Math.max(0, product.stock - quantity);
    this.productsSubject.next(products);
    this.saveProducts(products);

    return true;
  }
}
