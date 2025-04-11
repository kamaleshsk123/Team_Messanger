import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { io, Socket } from 'socket.io-client';
import { ImportsModule } from '../imports';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-sidenav',
  imports: [ImportsModule],
  providers: [MessageService],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent implements OnInit {
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  isExpanded: boolean = false;
  currentUser: any;
  onlineUsers: any[] = [];
  private socket!: Socket;
  showDropdown = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.authService.getOnlineUsers().subscribe((response) => {
      this.onlineUsers = response.onlineUsers;
    });
    this.fetchUserDetails();
  }

  private fetchUserDetails() {
    this.authService.getUserDetails().subscribe({
      next: (response) => {
        this.currentUser = response;
        console.log('response :', response);
        this.initializeSocket();
      },
      error: (err) => {
        console.error('Error fetching user details:', err);
      },
    });
  }

  private initializeSocket() {
    this.socket = io('http://localhost:5000');

    if (this.currentUser) {
      this.socket.emit('userConnected', {
        userId: this.currentUser.userId,
        userName: this.currentUser.username,
        profileImage: this.currentUser.profileImage,
      });
    }

    this.socket.on('onlineUsers', (users: any[]) => {
      this.onlineUsers = users.filter(
        (user) => user.userId !== this.currentUser?.userId
      );
    });
  }

  toggleSidenav() {
    this.isExpanded = !this.isExpanded; // Toggle sidebar
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Use setTimeout to wait until DOM updates
    setTimeout(() => {
      const clickedInside = this.dropdownContainer?.nativeElement.contains(
        event.target
      );
      if (!clickedInside) {
        this.showDropdown = false;
      }
    }, 0);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'You have been logged out successfully!',
        }); // ✅ Show toast after successful logout
        localStorage.removeItem('token');
        // this.router.navigate(['/login']);
        setTimeout(() => {
          this.router.navigate(['/login']); // Redirect to chat
        }, 1000);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message || 'An error occurred during logout',
        }); // ❌ Error toast
      },
    });
  }
}
