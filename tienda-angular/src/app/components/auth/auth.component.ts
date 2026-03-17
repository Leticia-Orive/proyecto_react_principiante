import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  isLoginMode = true;
  name = '';
  email = '';
  password = '';
  error = '';
  success = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      // Could navigate away or hide this component
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.resetMessages();
    this.resetForm();
  }

  onSubmit(): void {
    this.resetMessages();

    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.isLoginMode) {
      const result = this.authService.login(this.email, this.password);
      if (result.success) {
        this.success = 'Login exitoso';
        this.resetForm();
        setTimeout(() => window.location.reload(), 500);
      } else {
        this.error = result.error || 'Error al iniciar sesión';
      }
    } else {
      if (!this.name) {
        this.error = 'Por favor completa todos los campos';
        return;
      }

      const result = this.authService.register(this.name, this.email, this.password);
      if (result.success) {
        this.success = 'Registro exitoso. Ahora puedes iniciar sesión.';
        this.isLoginMode = true;
        this.resetForm();
      } else {
        this.error = result.error || 'Error al registrarse';
      }
    }
  }

  private resetForm(): void {
    this.name = '';
    this.email = '';
    this.password = '';
  }

  private resetMessages(): void {
    this.error = '';
    this.success = '';
  }
}
