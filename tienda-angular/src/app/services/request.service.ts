import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CustomerRequest {
  id: number;
  userId: number;
  type: 'pedido' | 'comentario';
  subject: string;
  message: string;
  createdAt: number;
  adminReply?: string;
  repliedAt?: number;
}

const REQUESTS_STORAGE_KEY = 'tienda-customer-requests';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private requestsSubject = new BehaviorSubject<CustomerRequest[]>([]);
  public requests$ = this.requestsSubject.asObservable();

  constructor() {
    this.hydrateRequests();
  }

  private hydrateRequests(): void {
    const stored = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (stored) {
      try {
        const requests = JSON.parse(stored);
        this.requestsSubject.next(Array.isArray(requests) ? requests : []);
      } catch (e) {
        console.error('Error hydrating requests:', e);
      }
    }
  }

  private saveRequests(requests: CustomerRequest[]): void {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  }

  getRequests(): CustomerRequest[] {
    return this.requestsSubject.value;
  }

  getUserRequests(userId: number): CustomerRequest[] {
    return this.requestsSubject.value.filter(r => r.userId === userId);
  }

  getUnansweredRequests(): CustomerRequest[] {
    return this.requestsSubject.value.filter(r => !r.adminReply);
  }

  createRequest(
    userId: number,
    type: 'pedido' | 'comentario',
    subject: string,
    message: string
  ): CustomerRequest {
    const requests = this.requestsSubject.value;
    const newRequest: CustomerRequest = {
      id: Math.max(0, ...requests.map(r => r.id)) + 1,
      userId,
      type,
      subject,
      message,
      createdAt: Date.now()
    };

    requests.push(newRequest);
    this.requestsSubject.next(requests);
    this.saveRequests(requests);

    return newRequest;
  }

  replyToRequest(requestId: number, reply: string): CustomerRequest | null {
    const requests = this.requestsSubject.value;
    const request = requests.find(r => r.id === requestId);

    if (!request) return null;

    request.adminReply = reply;
    request.repliedAt = Date.now();

    this.requestsSubject.next(requests);
    this.saveRequests(requests);

    return request;
  }

  deleteRequest(requestId: number): boolean {
    const requests = this.requestsSubject.value.filter(r => r.id !== requestId);
    if (requests.length === this.requestsSubject.value.length) return false;

    this.requestsSubject.next(requests);
    this.saveRequests(requests);

    return true;
  }

  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
  }
}
