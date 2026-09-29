import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEpic } from './add-epic';

describe('AddEpic', () => {
  let component: AddEpic;
  let fixture: ComponentFixture<AddEpic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEpic],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEpic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
