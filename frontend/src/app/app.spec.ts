import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { App } from './app';
import { CurrencyApi } from './currency-api';
import { ExchangeRate } from './exchange-rate';

describe('App', () => {
  let currencyApiSpy: jasmine.SpyObj<CurrencyApi>;

  beforeEach(async () => {
    currencyApiSpy = jasmine.createSpyObj<CurrencyApi>('CurrencyApi', ['getRates', 'fetchRates']);
    currencyApiSpy.getRates.and.returnValue(of([]));
    currencyApiSpy.fetchRates.and.returnValue(
      of({ requested_dates: ['2026-05-25'], saved_records: 1, skipped_duplicates: 0 }),
    );

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: CurrencyApi, useValue: currencyApiSpy },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render page title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Kursy walut');
  });

  it('should load rates after clicking display button', () => {
    const rates: ExchangeRate[] = [
      {
        id: 1,
        table_type: 'A',
        table_number: '099/A/NBP/2026',
        effective_date: '2026-05-25',
        currency_code: 'USD',
        currency_name: 'dolar amerykanski',
        rate: '3.6374',
        created_at: '2026-05-25T12:00:00',
      },
    ];
    currencyApiSpy.getRates.and.returnValue(of(rates));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setStartDate('2026-05-25');
    app.setEndDate('2026-05-25');
    app.setCurrencyCode('USD');
    app.loadRates();

    expect(currencyApiSpy.getRates).toHaveBeenCalledWith('2026-05-25', '2026-05-25', 'USD');
    expect(app.rates()).toEqual(rates);
  });

  it('should not call backend for range longer than 93 days', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setStartDate('2026-01-01');
    app.setEndDate('2026-05-01');
    app.loadRates();

    expect(currencyApiSpy.getRates).not.toHaveBeenCalled();
  });

  it('should not call backend for PLN because it is the base currency', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setStartDate('2026-05-25');
    app.setEndDate('2026-05-25');
    app.setCurrencyCode('PLN');
    app.loadRates();

    expect(currencyApiSpy.getRates).not.toHaveBeenCalled();
  });

  it('should clear table when backend returns an error', () => {
    currencyApiSpy.getRates.and.returnValue(throwError(() => new Error('backend error')));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.rates.set([
      {
        id: 1,
        table_type: 'A',
        table_number: '099/A/NBP/2026',
        effective_date: '2026-05-25',
        currency_code: 'USD',
        currency_name: 'dolar amerykanski',
        rate: '3.6374',
        created_at: '2026-05-25T12:00:00',
      },
    ]);

    app.loadRates();

    expect(app.rates()).toEqual([]);
  });
});
