import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ImportsModule } from '../imports';
@Component({
  selector: 'app-register',
  imports: [Toast, ImportsModule],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  passwordStrength: number = 0;
  passwordStrengthColor: string = 'bg-gray-300'; // Default color

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService // ✅ Use PrimeNG Toast Service
  ) {}

  onSubmit() {
    this.authService
      .register(this.username, this.email, this.password)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User registered successfully!',
          }); // ✅ Show success toast

          setTimeout(() => {
            this.router.navigate(['/login']); // Redirect to login
          }, 2000); // Delay navigation to show toast
        },
        error: (err) => {
          console.error('Registration error', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error.message || 'Registration failed',
          }); // ❌ Show error toast
        },
      });
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Check Password Strength
  checkPasswordStrength() {
    const strength = this.calculateStrength(this.password);
    this.passwordStrength = strength;

    if (strength <= 30) {
      this.passwordStrengthColor = 'bg-red-500';
    } else if (strength <= 70) {
      this.passwordStrengthColor = 'bg-yellow-500';
    } else {
      this.passwordStrengthColor = 'bg-green-500';
    }
  }

  // Calculate Strength (Simple Algorithm)
  calculateStrength(password: string): number {
    let strength = 0;
    if (password.length >= 8) strength += 30;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[\W]/.test(password)) strength += 30;
    return strength;
  }
}
