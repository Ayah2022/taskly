import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicCardSkeleton } from './epic-card-skeleton';

describe('EpicCardSkeleton', () => {
  let component: EpicCardSkeleton;
  let fixture: ComponentFixture<EpicCardSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicCardSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(EpicCardSkeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
