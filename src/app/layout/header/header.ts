import { Component, inject, OnInit, output, signal } from '@angular/core';

import { UserService } from '../../core/services/user.service';
import type { UserModel } from '../../core/models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header implements OnInit {
  private readonly userService = inject(UserService);
  readonly menuToggle = output<void>();
  readonly user = signal<UserModel | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.userService.getCurrentUser();

      this.user.set(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }

  getUserInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
