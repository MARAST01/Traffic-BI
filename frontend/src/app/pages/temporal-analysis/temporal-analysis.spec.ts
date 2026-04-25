import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemporalAnalysis } from './temporal-analysis';

describe('TemporalAnalysis', () => {
  let component: TemporalAnalysis;
  let fixture: ComponentFixture<TemporalAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemporalAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemporalAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
