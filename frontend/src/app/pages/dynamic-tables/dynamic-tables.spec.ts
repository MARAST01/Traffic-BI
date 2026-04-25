import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicTables } from './dynamic-tables';

describe('DynamicTables', () => {
  let component: DynamicTables;
  let fixture: ComponentFixture<DynamicTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicTables]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
