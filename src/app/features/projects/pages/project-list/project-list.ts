import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ProjectCard } from '../../../../shared/components/project-card/project-card';

import { ProjectsService } from '../../services/projects.service';
import { ProjectModel } from '../../models/project.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.html',
  imports: [ProjectCard, RouterLink],
})
export class ProjectList implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('loadMoreSentinel')
  set loadMoreSentinel(element: ElementRef<HTMLElement> | undefined) {
    if (element) {
      this.setupMobileObserver(element);
    } else {
      this.observer?.disconnect();
    }
  }

  readonly projects = signal<ProjectModel[]>([]);
  readonly hasMoreProjects = signal(true);
  readonly currentPage = signal(1);
  readonly limit = 10;
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly hasError = signal(false);
  readonly loadMoreError = signal(false);

  private observer?: IntersectionObserver;
  private activeRequest = false;

  private readonly mobileQuery = '(max-width: 767px)';

  ngOnInit(): void {
    this.loadProjects(1);
  }

  /**
   * Loads a page.
   * Desktop/tablet: replaces the list.
   * Mobile: appends the next page when requested.
   */
  loadProjects(page = 1, append = false): void {
    if (this.activeRequest) {
      return;
    }

    if (append && this.isLoadingMore()) {
      return;
    }

    // Reset "has more" when starting a fresh list/page navigation.
    if (!append) {
      this.hasMoreProjects.set(true);
    }

    this.activeRequest = true;

    if (append) {
      this.isLoadingMore.set(true);
      this.loadMoreError.set(false);
    } else {
      this.isLoading.set(true);
      this.hasError.set(false);
    }

    const offset = (page - 1) * this.limit;

    this.projectsService
      .getProjects(this.limit, offset)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.activeRequest = false;

          if (append) {
            this.isLoadingMore.set(false);
          } else {
            this.isLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          const newProjects = response.body ?? [];

          this.updatePaginationMetadata(response.headers.get('Content-Range'));

          // Stop infinite scrolling when the API returns
          // fewer projects than the configured page size.
          if (newProjects.length < this.limit) {
            this.hasMoreProjects.set(false);
          } else {
            this.hasMoreProjects.set(true);
          }

          if (append) {
            // Preserve existing projects on mobile.
            this.projects.update((existing) => [...existing, ...newProjects]);
          } else {
            // Replace projects when navigating pages.
            this.projects.set(newProjects);
          }

          this.currentPage.set(page);
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load projects:', error);

          if (append) {
            // Keep the already-loaded projects.
            this.loadMoreError.set(true);
          } else {
            this.hasError.set(true);
          }
        },
      });
  }

  private updatePaginationMetadata(contentRange: string | null): void {
    if (!contentRange) {
      console.error('Missing Content-Range response header.');
      this.totalCount.set(0);
      this.totalPages.set(0);
      return;
    }

    // Example: "0-9/100" or possibly "*/0".
    const match = contentRange.match(/\/(\d+|\*)$/);

    if (!match || match[1] === '*') {
      console.error('Invalid Content-Range:', contentRange);
      this.totalCount.set(0);
      this.totalPages.set(0);
      return;
    }

    const totalCount = Number(match[1]);

    this.totalCount.set(totalCount);
    this.totalPages.set(Math.ceil(totalCount / this.limit));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage() || this.isLoading()) {
      return;
    }

    this.loadProjects(page);
  }

  get visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    const pages = new Set<number>([1, total]);

    for (let page = start; page <= end; page++) {
      pages.add(page);
    }

    return [...pages].sort((a, b) => a - b);
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(this.mobileQuery).matches;
  }

  private setupMobileObserver(sentinel: ElementRef<HTMLElement>): void {
    this.observer?.disconnect();

    if (!this.isMobile() || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible) {
          return;
        }

        console.log('Mobile observer triggered');

        if (
          this.activeRequest ||
          this.isLoading() ||
          this.isLoadingMore() ||
          this.loadMoreError() ||
          !this.hasMoreProjects()
        ) {
          return;
        }

        const nextPage = this.currentPage() + 1;

        console.log('Loading mobile page:', nextPage);

        this.loadProjects(nextPage, true);
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      },
    );

    this.observer.observe(sentinel.nativeElement);

    console.log('Mobile observer attached');
  }

  retryLoadMore(): void {
    if (this.activeRequest || this.isLoadingMore() || !this.hasMoreProjects()) {
      return;
    }

    this.loadProjects(this.currentPage() + 1, true);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
