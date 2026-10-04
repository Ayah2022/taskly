import { Component, inject, DestroyRef, signal, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
// import { SlicePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class Breadcrumb implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    // Build immediately for the current URL.
    this.breadcrumbs.set(this.buildBreadcrumbs());

    // Rebuild whenever navigation finishes.
    this.listenToRouterEvents();
  }

  private listenToRouterEvents(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.breadcrumbs.set(this.buildBreadcrumbs());
      });
  }

  private buildBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];

    let route = this.router.routerState.root;
    let url = '';

    while (route.firstChild) {
      route = route.firstChild;

      const routePath = route.snapshot.url.map((segment) => segment.path).join('/');

      if (routePath) {
        url += `/${routePath}`;
      }

      const breadcrumb = route.routeConfig?.data?.['breadcrumb'];
      if (!breadcrumb) {
        continue;
      }

      let label = breadcrumb;
      console.log({
        routePath,
        breadcrumb,
        resolvedData: route.snapshot.data,
      });
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
