import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { LoginService } from '../../features/auth/services/login.service';
import { filter } from 'rxjs';
import { ProjectModel } from '../../features/projects/models/project.model';
import { SlicePipe } from '@angular/common';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SlicePipe],
  templateUrl: './sidebar.html',
})
export class Sidebar implements OnInit {
  isLoggingOut = false;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly logoutError = signal<string | null>(null);
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = input(false);
  readonly closeMobileMenu = output<void>();
  readonly activeProjectExpanded = signal(false);
  private readonly loginService = inject(LoginService);

  readonly activeProjectId = signal<string | null>(null);
  readonly activeProjectName = signal<string | null>(null);

  ngOnInit() {
    // Get the project immediately on page load / refresh
    this.updateActiveProject();

    // Update it whenever navigation happens
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateActiveProject();
    });
  }
  private updateActiveProject(): void {
    const project = this.getActiveProject();

    this.activeProjectId.set(project?.id ?? null);
    this.activeProjectName.set(project?.name ?? null);
  }

  private getActiveProject(): ProjectModel | null {
    let route = this.route;
    while (route) {
      const project = route.snapshot.data['project'];

      if (project) {
        return project;
      }

      if (!route.firstChild) {
        break;
      }

      route = route.firstChild;
    }

    return null;
  }

  toggleActiveProject(): void {
    this.activeProjectExpanded.update((open) => !open);
  }
  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  async onLogout(): Promise<void> {
    this.logoutError.set(null);

    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    const result = await this.loginService.logout();

    if (!result.ok) {
      this.isLoggingOut = false;

      this.logoutError.set(result.message ?? 'Unable to log out. Please try again.');

      return;
    } else {
      await this.router.navigate(['/login']);

      return;
    }
  }
}
