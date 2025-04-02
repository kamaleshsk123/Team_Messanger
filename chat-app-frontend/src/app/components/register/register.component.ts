import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService
      .register(this.username, this.email, this.password)
      .subscribe({
        next: () => {
          // Handle successful registration, e.g., navigate to login page
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          // Handle registration errors here
          console.error('Registration error', err);
        },
      });
  }
}
