import { Component, OnInit, inject, signal } from '@angular/core';
import { filter } from 'rxjs';
import { ProjectModel } from '../../features/projects/models/project.model';

import {
  RouterLink,
  RouterLinkActive,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-footer',
  templateUrl: './footer.html',
})
export class Footer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
}
