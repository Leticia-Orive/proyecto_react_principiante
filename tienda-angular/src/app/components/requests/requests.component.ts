import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestService, CustomerRequest } from '../../services/request.service';
import { AuthService, CurrentUser } from '../../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit, OnDestroy {
  currentUser: CurrentUser | null = null;
  isAdmin = false;
  myRequests: CustomerRequest[] = [];
  customerRequests: CustomerRequest[] = [];

  // Form data for customer
  requestForm = {
    type: 'pedido',
    subject: '',
    message: ''
  };

  requestError = '';
  requestSuccess = '';

  // Admin reply form
  adminReplies: { [key: number]: string } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private requestService: RequestService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAdmin = user?.role === 'admin' || false;
        this.loadRequests();
      });

    this.requestService.requests$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadRequests();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadRequests(): void {
    if (!this.currentUser) return;

    if (this.isAdmin) {
      this.customerRequests = this.requestService.getUnansweredRequests();
    } else {
      this.myRequests = this.requestService.getUserRequests(this.currentUser.id);
    }
  }

  onRequestInputChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    this.requestForm = {
      ...this.requestForm,
      [name]: value
    };
  }

  onCreateRequest(event: Event): void {
    event.preventDefault();
    this.requestError = '';
    this.requestSuccess = '';

    if (!this.currentUser) {
      this.requestError = 'Debes iniciar sesión';
      return;
    }

    if (!this.requestForm.subject || !this.requestForm.message) {
      this.requestError = 'Por favor completa asunto y detalle';
      return;
    }

    this.requestService.createRequest(
      this.currentUser.id,
      this.requestForm.type as 'pedido' | 'comentario',
      this.requestForm.subject,
      this.requestForm.message
    );

    this.requestSuccess = 'Solicitud enviada exitosamente';
    this.requestForm = {
      type: 'pedido',
      subject: '',
      message: ''
    };
  }

  onDeleteRequest(requestId: number): void {
    if (confirm('¿Estás seguro que quieres eliminar esta solicitud?')) {
      this.requestService.deleteRequest(requestId);
    }
  }

  getAdminReplyDraft(requestId: number): string {
    return this.adminReplies[requestId] || '';
  }

  onAdminReplyChange(requestId: number, value: string): void {
    this.adminReplies[requestId] = value;
  }

  onReplyRequest(requestId: number): void {
    const reply = this.adminReplies[requestId];
    if (!reply || !reply.trim()) {
      alert('Por favor escribe una respuesta');
      return;
    }

    this.requestService.replyToRequest(requestId, reply);
    delete this.adminReplies[requestId];
  }

  formatDateTime(timestamp: number | undefined): string {
    if (!timestamp) return '';
    return this.requestService.formatDateTime(timestamp);
  }
}
