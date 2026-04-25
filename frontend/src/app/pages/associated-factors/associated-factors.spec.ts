import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssociatedFactors } from './associated-factors';

describe('AssociatedFactors', () => {
  let component: AssociatedFactors;
  let fixture: ComponentFixture<AssociatedFactors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssociatedFactors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssociatedFactors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
