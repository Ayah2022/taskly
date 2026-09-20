import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectEpics } from './project-epics';

describe('ProjectEpics', () => {
  let component: ProjectEpics;
  let fixture: ComponentFixture<ProjectEpics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectEpics],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectEpics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
