import {
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, finalize, map } from 'rxjs';

import { EpicModel } from '../../models/epic.model';
import { EpicsService } from '../../services/epics.service';
import { EpicCard } from '../../../../shared/components/epic-card/epic-card';
import { EpicCardSkeleton } from '../../../../shared/components/epic-card-skeleton/epic-card-skeleton';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EpicDetailsModal } from '../../../../shared/components/epic-details-modal/epic-details-modal';

@Component({
  imports: [EpicCard, EpicCardSkeleton, RouterLink,EpicDetailsModal],
  selector: 'app-epics-list',
  styleUrl: './epics-list.css',
  templateUrl: './epics-list.html',
})
export class EpicsList implements OnInit, OnDestroy {
  private readonly epicsService = inject(EpicsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  readonly searchTerm = signal('');
  readonly projectId = signal<string | null>(null);

  readonly epics = signal<EpicModel[]>([]);
  readonly currentPage = signal(1);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly hasError = signal(false);
  readonly loadMoreError = signal(false);
  readonly hasMoreEpics = signal(true);

  readonly limit = 5;

  private activeRequest = false;
  private observer?: IntersectionObserver;

  private readonly mobileQuery = '(max-width: 767px)';
  private readonly dirty = signal(false);
  protected readonly selectedEpicId = signal<string | null>(null);

  @ViewChild('loadMoreSentinel')
  set loadMoreSentinel(element: ElementRef<HTMLElement> | undefined) {
    this.observer?.disconnect();

    if (element) {
      this.setupMobileObserver(element);
    }
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('projectId')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projectId) => {
        this.projectId.set(projectId);

        // Reset state when navigating to another project.
        this.epics.set([]);
        this.currentPage.set(1);
        this.totalCount.set(0);
        this.totalPages.set(0);
        this.hasMoreEpics.set(true);
        this.loadMoreError.set(false);
        this.hasError.set(false);

        this.loadEpics(1);
      });
  }

  loadEpics(page = 1, append = false): void {
    if (this.activeRequest) {
      return;
    }

    const projectId = this.projectId();

    // Guard against a missing route parameter.
    if (!projectId) {
      return;
    }

    const offset = (page - 1) * this.limit;

    this.activeRequest = true;

    if (append) {
      this.isLoadingMore.set(true);
      this.loadMoreError.set(false);
    } else {
      this.isLoading.set(true);
      this.hasError.set(false);
    }

    this.epicsService
      .getProjectEpics(projectId, this.limit, offset)
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
          const newEpics = response.body ?? [];

          this.updatePaginationMetadata(response.headers.get('Content-Range'));

          this.hasMoreEpics.set(newEpics.length === this.limit);

          if (append) {
            this.epics.update((existing) => [...existing, ...newEpics]);
          } else {
            this.epics.set(newEpics);
          }

          this.currentPage.set(page);
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load epics:', error);

          if (append) {
            this.loadMoreError.set(true);
          } else {
            this.hasError.set(true);
          }
        },
      });
  }

  readonly filteredEpics = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.epics();
    }

    return this.epics().filter((epic) => epic.title.toLowerCase().includes(term));
  });



  protected onEpicUpdated(updated: EpicModel): void {
    this.epics.update((list) => list.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)));
    this.dirty.set(true);
  }

  protected closeModal(): void {
    this.selectedEpicId.set(null);
    if (this.dirty()) {
      this.dirty.set(false);
      this.loadEpics(); // your existing list-loading method, ideally without a full-grid spinner
    }
  }

  private updatePaginationMetadata(contentRange: string | null): void {
    const match = contentRange?.match(/\/(\d+|\*)$/);

    if (!match || match[1] === '*') {
      this.totalCount.set(0);
      this.totalPages.set(0);
      return;
    }

    const total = Number(match[1]);

    this.totalCount.set(total);
    this.totalPages.set(Math.ceil(total / this.limit));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage() || this.isLoading()) {
      return;
    }

    this.loadEpics(page);
  }

  get visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, total]);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let page = start; page <= end; page++) {
      pages.add(page);
    }

    return [...pages].sort((a, b) => a - b);
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.matchMedia(this.mobileQuery).matches;
  }

  private setupMobileObserver(sentinel: ElementRef<HTMLElement>): void {
    if (!this.isMobile() || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        if (
          this.activeRequest ||
          this.isLoading() ||
          this.isLoadingMore() ||
          this.loadMoreError() ||
          !this.hasMoreEpics()
        ) {
          return;
        }

        this.loadEpics(this.currentPage() + 1, true);
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      },
    );

    this.observer.observe(sentinel.nativeElement);
  }

  retryLoadMore(): void {
    if (this.activeRequest || this.isLoadingMore() || !this.hasMoreEpics()) {
      return;
    }

    this.loadEpics(this.currentPage() + 1, true);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
