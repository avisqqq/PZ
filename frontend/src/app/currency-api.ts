import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ExchangeRate, FetchResult } from './exchange-rate';

@Injectable({
  providedIn: 'root',
})
export class CurrencyApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getRates(startDate: string, endDate: string, currencyCode?: string): Observable<ExchangeRate[]> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate)
      .set('auto_fetch', 'true');

    if (currencyCode) {
      params = params.set('currency_code', currencyCode);
    }

    return this.http.get<ExchangeRate[]>(`${this.apiUrl}/currencies/range`, { params });
  }

  fetchRates(startDate: string, endDate: string): Observable<FetchResult> {
    const params = new HttpParams().set('start_date', startDate).set('end_date', endDate);

    return this.http.post<FetchResult>(`${this.apiUrl}/currencies/fetch/range`, null, { params });
  }
}
