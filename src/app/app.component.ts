import { Component } from '@angular/core';
import { ChatComponent } from './components/chat/chat.component';
import { ProductListComponent } from './components/product-list/product-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatComponent, ProductListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}