import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CurrencyApi } from './currency-api';

describe('CurrencyApi', () => {
  let service: CurrencyApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrencyApi, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CurrencyApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request rates from range endpoint with filters', () => {
    service.getRates('2026-05-01', '2026-05-25', 'USD').subscribe((rates) => {
      expect(rates).toEqual([]);
    });

    const request = httpMock.expectOne((req) => req.url === '/api/currencies/range');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('start_date')).toBe('2026-05-01');
    expect(request.request.params.get('end_date')).toBe('2026-05-25');
    expect(request.request.params.get('currency_code')).toBe('USD');
    expect(request.request.params.get('auto_fetch')).toBe('true');
    request.flush([]);
  });

  it('should call fetch range endpoint', () => {
    service.fetchRates('2026-05-01', '2026-05-25').subscribe((result) => {
      expect(result.saved_records).toBe(3);
    });

    const request = httpMock.expectOne((req) => req.url === '/api/currencies/fetch/range');
    expect(request.request.method).toBe('POST');
    expect(request.request.params.get('start_date')).toBe('2026-05-01');
    expect(request.request.params.get('end_date')).toBe('2026-05-25');
    request.flush({
      requested_dates: ['2026-05-01'],
      saved_records: 3,
      skipped_duplicates: 0,
    });
  });
});
