import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UpcomingProduct {
  id: string;
  name: string;
  category: string;
  launchWindow: string;
  note: string;
  image: string;
}

const UPCOMING_STORAGE_KEY = 'tienda-upcoming-products';

const DEFAULT_UPCOMING: UpcomingProduct[] = [
  {
    id: 'upcoming-1',
    name: 'Trench Camel',
    category: 'chaquetas',
    launchWindow: 'Llega en abril',
    note: 'Gabardina clásica en tono camel, perfecta para el entretiempo.',
    image: '/images/chaqueta-denim.avif',
  },
  {
    id: 'upcoming-2',
    name: 'Vestido Lino',
    category: 'vestidos',
    launchWindow: 'Llega en mayo',
    note: 'Vestido de lino natural, fresco y elegante para el verano.',
    image: '/images/vestido-floral.webp',
  },
];

@Injectable({
  providedIn: 'root',
})
export class UpcomingService {
  private upcomingSubject = new BehaviorSubject<UpcomingProduct[]>([]);
  public upcoming$ = this.upcomingSubject.asObservable();

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    try {
      const stored = localStorage.getItem(UPCOMING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.upcomingSubject.next(parsed);
          return;
        }
      }
    } catch {
      // fallback to defaults
    }
    this.upcomingSubject.next(DEFAULT_UPCOMING);
    this.save(DEFAULT_UPCOMING);
  }

  private save(items: UpcomingProduct[]): void {
    localStorage.setItem(UPCOMING_STORAGE_KEY, JSON.stringify(items));
  }

  getAll(): UpcomingProduct[] {
    return this.upcomingSubject.value;
  }

  add(item: Omit<UpcomingProduct, 'id'>): UpcomingProduct {
    const newItem: UpcomingProduct = { ...item, id: `upcoming-${Date.now()}` };
    const updated = [newItem, ...this.upcomingSubject.value];
    this.upcomingSubject.next(updated);
    this.save(updated);
    return newItem;
  }

  update(id: string, changes: Partial<Omit<UpcomingProduct, 'id'>>): UpcomingProduct | null {
    const items = this.upcomingSubject.value;
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...changes };
    this.upcomingSubject.next([...items]);
    this.save(items);
    return items[index];
  }

  delete(id: string): void {
    const updated = this.upcomingSubject.value.filter((i) => i.id !== id);
    this.upcomingSubject.next(updated);
    this.save(updated);
  }
}
