import {
  Component,
  NgZone,
  OnInit,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../chat-message.model';
import { v4 as uuidv4 } from 'uuid';
import { ImportsModule } from '../imports';

@Component({
  selector: 'app-chat',
  // Removed invalid 'imports' property
  imports: [ImportsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  private socket!: Socket;
  message = '';
  messages: ChatMessage[] = [];
  currentUserId: string;
  currentUserName: string;
  isTyping = false;
  typingTimeout: any;
  typingUser: string | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
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
  }

  addMessage(newMessage: ChatMessage) {
    this.messages.push(newMessage);
    this.scrollToBottom();
  }

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
      this.socket.emit('sendMessage', newMessage);
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
