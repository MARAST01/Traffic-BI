import { TestBed } from '@angular/core/testing';

import { Filters } from './filters';

describe('Filters', () => {
  let service: Filters;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Filters);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
