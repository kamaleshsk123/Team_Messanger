import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ImportsModule } from '../imports';
import { ImageUploadService } from '../../service/image-upload.service';
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
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService, // ✅ Use PrimeNG Toast Service
    private imageUploadService: ImageUploadService
  ) {}

  onSubmit() {
    if (this.selectedFile) {
      this.imageUploadService
        .uploadImage(this.selectedFile, this.username)
        .subscribe({
          next: (response) => {
            console.log('Image uploaded:', response.secure_url);
            this.registerUser(response.secure_url); // Register with Cloudinary URL
          },
          error: (err) => {
            console.error('Image upload failed', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Image Upload Failed',
              detail: 'Please try again!',
            });
          },
        });
    } else {
      this.registerUser(null); // Register without image
    }
  }
  registerUser(imageUrl: string | null) {
    this.authService
      .register(this.username, this.email, this.password, imageUrl)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User registered successfully!',
          });

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          console.error('Registration error', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error.message || 'Registration failed',
          });
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

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
