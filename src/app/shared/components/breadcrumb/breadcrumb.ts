import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
})
export class Breadcrumb {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs.set(this.buildBreadcrumbs());
    });
  }

  private buildBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];

    let route = this.route;
    let url = '';

    while (route.firstChild) {
      route = route.firstChild;

      const routePath = route.snapshot.url.map((segment) => segment.path).join('/');

      if (routePath) {
        url += `/${routePath}`;
      }

      const breadcrumb = route.snapshot.data['breadcrumb'];

      if (!breadcrumb) {
        continue;
      }

      let label = breadcrumb;

      // Dynamic project name
      if (breadcrumb === 'project') {
        const project = route.snapshot.data['project'];

        if (project) {
          label = project.name;
        }
      }

      breadcrumbs.push({
        label,
        url,
      });
    }

    // Hide breadcrumb on /projects
    if (this.router.url === '/projects') {
      return [];
    }

    return breadcrumbs;
  }
}
