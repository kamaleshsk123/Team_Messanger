import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ImportsModule } from '../imports';

@Component({
  selector: 'app-login',
  imports: [ImportsModule, Toast],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private messageService: MessageService
  ) {}

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User login successfully!',
        }); // ✅ Show success toast
        setTimeout(() => {
          this.router.navigate(['/chat']); // Redirect to login
        }, 500); // Delay navigation to show toast
        // Redirect to chat
      },
      error: (err) => {
        console.error('Login error', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message || 'Login failed',
        }); // ❌ Show error toast
      },
    });
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
