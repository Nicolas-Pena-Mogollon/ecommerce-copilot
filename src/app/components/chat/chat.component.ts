import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { UiContextService } from '../../services/ui-context.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  userInput = '';
  response = '';
  selectedImage: File | null = null;

  constructor(
    private apiService: ApiService,
    private uiContextService: UiContextService
  ) {}

  sendMessage() {
    if (this.selectedImage) {
      this.apiService.sendVisionMessage(this.userInput, this.selectedImage).subscribe(
        (res) => (this.response = res.reply),
        (err) => console.error(err)
      );
    } else {
      const context = this.uiContextService.getUiContext(this.userInput);
      this.apiService.sendTextMessage({
        userInput: this.userInput,
        uiContext: context
      }).subscribe(
        (res) => (this.response = res.reply),
        (err) => console.error(err)
      );
    }

    this.userInput = '';
    this.selectedImage = null;
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }
}