import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { App } from './app';
import { CurrencyApi } from './currency-api';
import { ExchangeRate } from './exchange-rate';

describe('Aplikacja kursow walut', () => {
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

  it('powinna utworzyc aplikacje', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('powinna wyswietlic tytul strony', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Kursy walut');
  });

  it('powinna zaladowac kursy po kliknieciu przycisku wyswietlania', () => {
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

  it('nie powinna wywolywac backendu dla zakresu dluzszego niz 93 dni', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setStartDate('2026-01-01');
    app.setEndDate('2026-05-01');
    app.loadRates();

    expect(currencyApiSpy.getRates).not.toHaveBeenCalled();
  });

  it('nie powinna wywolywac backendu dla PLN, bo jest waluta bazowa', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.setStartDate('2026-05-25');
    app.setEndDate('2026-05-25');
    app.setCurrencyCode('PLN');
    app.loadRates();

    expect(currencyApiSpy.getRates).not.toHaveBeenCalled();
  });

  it('powinna wyczyscic tabele, gdy backend zwroci blad', () => {
    currencyApiSpy.getRates.and.returnValue(throwError(() => new Error('blad backendu')));
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
