import { TestBed } from '@angular/core/testing';

import { SlidersService } from './sliders.service';
import {HttpClientTestingModule} from "@angular/common/http/testing";

describe('UsdbSlidersService', () => {
  let service: SlidersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
    });
    service = TestBed.inject(SlidersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
