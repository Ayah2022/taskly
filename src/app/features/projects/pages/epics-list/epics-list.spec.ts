import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EpicsList } from './epics-list';

describe('EpicsList', () => {
  let component: EpicsList;
  let fixture: ComponentFixture<EpicsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpicsList],
    }).compileComponents();

    fixture = TestBed.createComponent(EpicsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
