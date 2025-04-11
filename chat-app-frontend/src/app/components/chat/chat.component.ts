import {
  Component,
  NgZone,
  OnInit,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../../chat-message.model';
import { ImportsModule } from '../imports';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { AuthService } from '../../auth.service';
import { SidenavComponent } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-chat',
  // Removed invalid 'imports' property
  imports: [ImportsModule, PickerComponent, SidenavComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('emojiPicker') emojiPickerRef!: ElementRef;
  @ViewChild('emojiButton') emojiButtonRef!: ElementRef;
  private socket!: Socket;
  message = '';
  messages: ChatMessage[] = [];
  currentUserId: string;
  currentUserName: string;
  isTyping = false;
  typingTimeout: any;
  typingUser: string | null = null;
  showEmojiPicker = false;
  isDarkMode = false; // Dark mode support
  user: any;
  isSending = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private eRef: ElementRef,
    private authService: AuthService
  ) {
    this.currentUserId = this.getOrCreateUserId();
    this.currentUserName = `User-${this.currentUserId.substring(0, 5)}`;
    this.promptForUserName();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchUserDetails(); // ✅ Fetch user details from API
    }
  }

  private fetchUserDetails() {
    this.authService.getUserDetails().subscribe({
      next: (response) => {
        this.user = response;
        this.currentUserId = this.user.userId;
        this.currentUserName = this.user.username;
        localStorage.setItem('userId', this.currentUserId);
        localStorage.setItem('userName', this.currentUserName);

        console.log('User Details:', this.user);

        // ✅ Initialize WebSocket connection after fetching user details
        this.initializeSocket();
      },
      error: (err) => {
        console.error('Error fetching user details:', err);
      },
    });
  }

  private initializeSocket() {
    this.socket = io('http://localhost:5000');

    this.socket.emit('userConnected', {
      userId: this.currentUserId,
      userName: this.currentUserName,
    });

    this.socket.on('receiveMessage', (msg: ChatMessage) => {
      this.messages.push(msg);
      this.scrollToBottom();
    });

    // Listen for typing events
    this.socket.on('userTyping', (userName: string) => {
      if (userName !== this.currentUserName) {
        this.typingUser = userName;
        this.isTyping = true;
      }
    });

    this.socket.on('stopTyping', (userName: string) => {
      if (userName !== this.currentUserName) {
        this.typingUser = null;
        this.isTyping = false;
      }
    });
  }

  addMessage(newMessage: ChatMessage) {
    this.messages.push(newMessage);
    this.scrollToBottom();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (
      this.showEmojiPicker &&
      this.emojiPickerRef &&
      this.emojiButtonRef &&
      !this.emojiPickerRef.nativeElement.contains(event.target) &&
      !this.emojiButtonRef.nativeElement.contains(event.target)
    ) {
      this.showEmojiPicker = false;
    }
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    this.message += event.emoji.native;
    this.showEmojiPicker = false;
  }

  // Close picker when clicking outside
  // @HostListener('document:click', ['$event'])
  // clickOutside(event: Event) {
  //   if (!this.eRef.nativeElement.contains(event.target)) {
  //     this.showEmojiPicker = false;
  //   }
  // }

  private promptForUserName(): void {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      this.currentUserName = storedUserName;
    } else {
      const userName = prompt('Please enter your display name:', '');
      if (userName && userName.trim() !== '') {
        this.currentUserName = userName.trim();
        localStorage.setItem('userName', this.currentUserName);
      } else {
        this.currentUserName = `User-${this.currentUserId.substring(0, 5)}`;
      }
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  /**
   * Sends the message and resets the input field
   */
  sendMessage() {
    if (this.message.trim() && this.socket) {
      const newMessage: ChatMessage = {
        userId: this.currentUserId,
        userName: this.currentUserName,
        content: this.message,
        timestamp: new Date(),
      };
      this.socket.emit('sendMessage', newMessage, () => {
        this.isSending = false; // Reset loading state after sending
      });
      this.message = '';
      this.isTyping = true;
      this.socket.emit('stopTyping', this.currentUserName);
      this.scrollToBottom();
    }
  }

  /**
   * Handles typing event when a user types a message
   */
  typing() {
    if (!this.isTyping) {
      this.isTyping = false;
      this.socket.emit('userTyping', this.currentUserName);
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this.typingUser = null; // Ensure it clears
      this.socket.emit('stopTyping', this.currentUserName);
    }, 2000);
  }
}
