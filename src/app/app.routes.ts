import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent)
  },
  { 
    path: 'delivery', 
    loadComponent: () => import('./components/delivery-dashboard/delivery-dashboard').then(m => m.DeliveryDashboardComponent)
  }
];
