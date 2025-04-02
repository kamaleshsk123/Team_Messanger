import { Component, NgZone, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../chat-message.model';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-chat',
  // Removed invalid 'imports' property
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit {
  private socket!: Socket;
  message = '';
  messages: ChatMessage[] = [];
  currentUserId: string; // Declare currentUserId
  currentUserName: string; // Declare currentUserName

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.currentUserId = this.getOrCreateUserId();
    this.currentUserName = `User-${this.currentUserId.substring(0, 5)}`;
    this.promptForUserName();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = Math.random().toString(36).substr(2, 9); // Simple unique ID
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
      });
    }
  }

  addMessage(newMessage: ChatMessage) {
    this.messages.push(newMessage);
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
  sendMessage() {
    if (this.message.trim() && this.socket) {
      const newMessage: ChatMessage = {
        userId: this.currentUserId, // Ensure this is defined
        userName: this.currentUserName, // Ensure this is defined
        content: this.message,
        timestamp: new Date(),
      };
      this.socket.emit('sendMessage', newMessage);
      this.message = '';
    }
  }
}
