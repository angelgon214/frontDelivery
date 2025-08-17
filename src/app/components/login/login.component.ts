import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CardModule],
  template: `
    <div class="login-container">
      <div class="login-split-layout">
        <div class="login-image-side">
          <div class="logo-container">
            <h1 class="logo-text">Delivery<span>Angel</span></h1>
          </div>
          <div class="image-overlay"></div>
        </div>
        
        <div class="login-form-side">
          <div class="form-container">
            <div class="welcome-text">
              <h2>¡Bienvenido de nuevo!</h2>
              <p>Inicia sesión para continuar con tus entregas</p>
            </div>
            
            <form (ngSubmit)="onSubmit()" class="login-form">
              <div class="input-container">
                <div class="input-icon-wrapper">
                  <i class="pi pi-user"></i>
                </div>
                <input 
                  pInputText 
                  id="username" 
                  [(ngModel)]="username" 
                  name="username"
                  class="modern-input"
                  placeholder="Usuario"
                  required
                />
              </div>
              
              <div class="input-container">
                <div class="input-icon-wrapper">
                  <i class="pi pi-lock"></i>
                </div>
                <input 
                  pInputText 
                  type="password" 
                  id="password" 
                  [(ngModel)]="password" 
                  name="password"
                  class="modern-input"
                  placeholder="Contraseña"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                class="submit-button"
                [disabled]="loading"
              >
                <span *ngIf="!loading">Acceder</span>
                <i *ngIf="loading" class="pi pi-spin pi-spinner"></i>
              </button>
            </form>
            
            <div class="demo-accounts" *ngIf="!loading">
              <div class="account-cards">
                <div class="account-card admin-card">
                  <div class="account-icon">
                    <i class="pi pi-shield"></i>
                  </div>
                  <div class="account-details">
                    <span class="account-type">admin</span>
                    <span class="account-creds">123456</span>
                  </div>
                </div>
                <div class="account-card delivery-card">
                  <div class="account-icon">
                    <i class="pi pi-truck"></i>
                  </div>
                  <div class="account-details">
                    <span class="account-type">delivery1</span>
                    <span class="account-creds">123456</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    
    .login-split-layout {
      display: flex;
      height: 100%;
      width: 100%;
    }
    
    .login-image-side {
      flex: 1;
      background-image: url('https://images.unsplash.com/photo-1526367790999-0150786686a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1352&q=80');
      background-size: cover;
      background-position: center;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%);
      z-index: 1;
    }
    
    .logo-container {
      position: relative;
      z-index: 2;
      text-align: center;
    }
    
    .logo-text {
      font-size: 4rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      margin: 0;
    }
    
    .logo-text span {
      color: #FF6B6B;
    }
    
    .login-form-side {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: white;
    }
    
    .form-container {
      width: 80%;
      max-width: 450px;
      padding: 2rem;
    }
    
    .welcome-text {
      margin-bottom: 2.5rem;
    }
    
    .welcome-text h2 {
      font-size: 2.2rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 0.5rem 0;
    }
    
    .welcome-text p {
      font-size: 1rem;
      color: #666;
      margin: 0;
    }
    
    .login-form {
      margin-bottom: 2rem;
    }
    
    .input-container {
      position: relative;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
    }
    
    .input-icon-wrapper {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      z-index: 2;
    }
    
    .modern-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: none;
      border-radius: 8px;
      background-color: #f7f9fc;
      font-size: 1rem;
      transition: all 0.3s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }
    
    .modern-input:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255,107,107,0.2), 0 4px 12px rgba(0,0,0,0.08);
      background-color: white;
    }
    
    .modern-input::placeholder {
      color: #aaa;
    }
    
    .submit-button {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(255,107,107,0.3);
    }
    
    .submit-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255,107,107,0.4);
    }
    
    .submit-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255,107,107,0.3);
    }
    
    .submit-button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .demo-accounts {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
    }
    
    .demo-accounts h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #666;
      margin: 0 0 1rem 0;
      text-align: center;
    }
    
    .account-cards {
      display: flex;
      gap: 1rem;
    }
    
    .account-card {
      flex: 1;
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s;
      cursor: pointer;
    }
    
    .admin-card {
      background-color: #f0f7ff;
      border: 1px solid #d0e1fd;
    }
    
    .delivery-card {
      background-color: #f0fff4;
      border: 1px solid #d0fddb;
    }
    
    .account-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .account-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    
    .admin-card .account-icon {
      background-color: #2b6cb0;
      color: white;
    }
    
    .delivery-card .account-icon {
      background-color: #2f855a;
      color: white;
    }
    
    .account-details {
      display: flex;
      flex-direction: column;
    }
    
    .account-type {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
    }
    
    .account-creds {
      font-size: 0.8rem;
      color: #666;
      font-family: 'Courier New', monospace;
    }
    
    /* Responsive Design */
    @media (max-width: 992px) {
      .login-split-layout {
        flex-direction: column;
      }
      
      .login-image-side {
        flex: 0 0 200px;
      }
      
      .logo-text {
        font-size: 3rem;
      }
    }
    
    @media (max-width: 576px) {
      .form-container {
        width: 90%;
        padding: 1.5rem;
      }
      
      .welcome-text h2 {
        font-size: 1.8rem;
      }
      
      .account-cards {
        flex-direction: column;
      }
      
      .logo-text {
        font-size: 2.5rem;
      }
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(50px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .login-image-side {
      animation: fadeIn 1s ease-out;
    }
    
    .form-container {
      animation: slideInRight 0.8s ease-out;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.username || !this.password) return;
    
    this.loading = true;
    
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/delivery']);
        }
      },
      error: (error) => {
        this.loading = false;
        alert('Error de login: ' + error.error.message);
      }
    });
  }
}