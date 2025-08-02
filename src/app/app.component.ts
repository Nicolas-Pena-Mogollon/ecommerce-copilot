import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './presentation/components/navbar/navbar.component';
import { ChatBubbleComponent } from './presentation/components/chat-bubble/chat-bubble.component';
import { DynamicPopupService } from './application/services/dynamic-popup.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ChatBubbleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'IndraShop';
  private popupService = inject(DynamicPopupService);

  testPopup(): void {
    console.log('Testing popup...');
    this.popupService.createTestProductInfoPopup();
  }
}
