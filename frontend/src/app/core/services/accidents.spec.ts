import { TestBed } from '@angular/core/testing';

import { Accidents } from './accidents';

describe('Accidents', () => {
  let service: Accidents;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Accidents);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
