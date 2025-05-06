import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ImportsModule } from '../imports';

@Component({
  selector: 'app-chat-header',
  imports: [CommonModule, ImportsModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  @Input() user: any;
}
