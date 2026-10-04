import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicCard } from './epic-card';

describe('EpicCard', () => {
  let component: EpicCard;
  let fixture: ComponentFixture<EpicCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicCard],
    }).compileComponents();

    fixture = TestBed.createComponent(EpicCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
