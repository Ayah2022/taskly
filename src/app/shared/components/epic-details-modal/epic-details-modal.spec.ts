import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicDetailsModal } from './epic-details-modal';

describe('EpicDetailsModal', () => {
  let component: EpicDetailsModal;
  let fixture: ComponentFixture<EpicDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EpicDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
