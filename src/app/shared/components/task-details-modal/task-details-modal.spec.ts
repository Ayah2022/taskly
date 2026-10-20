import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskDetailsModal } from './task-details-modal';

describe('TaskDetailsModal', () => {
  let component: TaskDetailsModal;
  let fixture: ComponentFixture<TaskDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDetailsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailsModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
