import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeographicAnalysis } from './geographic-analysis';

describe('GeographicAnalysis', () => {
  let component: GeographicAnalysis;
  let fixture: ComponentFixture<GeographicAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeographicAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeographicAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
