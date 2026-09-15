import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = input(false);

  readonly closeMobileMenu = output<void>();

  readonly activeProjectExpanded = signal(false);

  toggleActiveProject(): void {
    this.activeProjectExpanded.update((open) => !open);
  }
  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
