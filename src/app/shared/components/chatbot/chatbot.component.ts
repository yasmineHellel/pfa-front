import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatbotService, ChatMessage } from '../../../core/services/chatbot.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen   = false;
  messages: ChatMessage[] = [];
  input    = '';
  loading  = false;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.messages = [{
      role: 'bot',
      text: 'Bonjour ! Je suis votre assistant IA GarageFlow. Comment puis-je vous aider avec vos réparations aujourd\'hui ?',
      time: this.now(),
    }];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  get isMecanicien(): boolean {
    return this.authService.getRole() === 'MECANICIEN';
  }

  toggle(): void { this.isOpen = !this.isOpen; }
  close():  void { this.isOpen = false; }

  send(): void {
    const text = this.input.trim();
    if (!text || this.loading) return;

    this.messages.push({ role: 'user', text, time: this.now() });
    this.input   = '';
    this.loading = true;

    this.chatbotService.sendMessage(text).subscribe({
      next: res => {
        this.messages.push({ role: 'bot', text: res.reply, time: this.now() });
        this.loading = false;
      },
      error: () => {
        this.messages.push({
          role: 'bot',
          text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
          time: this.now(),
        });
        this.loading = false;
      }
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }

  private now(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
