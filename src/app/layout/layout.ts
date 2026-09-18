import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';

import { Header } from './header/header';
import { Sidebar } from './sidebar/sidebar';
import { Breadcrumb } from '../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-layout',
  imports: [Header, Sidebar, RouterOutlet, Breadcrumb],
  templateUrl: './layout.html',
})
export class Layout {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
