import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { CurrencyApi } from './currency-api';
import { ExchangeRate } from './exchange-rate';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly currencyApi = inject(CurrencyApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly today = new Date().toISOString().slice(0, 10);
  readonly startDate = signal(this.today);
  readonly endDate = signal(this.today);
  readonly currencyCode = signal('');
  readonly activeChartCurrencyCode = signal('');
  readonly rates = signal<ExchangeRate[]>([]);
  readonly sortState = signal<Sort>({ active: 'effective_date', direction: 'desc' });
  readonly isLoading = signal(false);
  readonly displayedColumns = [
    'effective_date',
    'currency_code',
    'currency_name',
    'rate',
    'table_number',
  ];

  readonly totalRates = computed(() => this.rates().length);

  readonly sortedRates = computed(() => {
    const sort = this.sortState();
    const rates = [...this.rates()];

    if (!sort.active || !sort.direction) {
      return rates;
    }

    return rates.sort((left, right) => {
      const result = this.compareRates(left, right, sort.active);
      return sort.direction === 'asc' ? result : -result;
    });
  });

  readonly groupedSummary = computed(() => {
    const years = new Set<string>();
    const quarters = new Set<string>();
    const months = new Set<string>();
    const days = new Set<string>();

    for (const rate of this.rates()) {
      const [year, month] = rate.effective_date.split('-');
      const quarter = Math.ceil(Number(month) / 3);
      years.add(year);
      quarters.add(`${year} Q${quarter}`);
      months.add(`${year}-${month}`);
      days.add(rate.effective_date);
    }

    return {
      years: years.size,
      quarters: quarters.size,
      months: months.size,
      days: days.size,
    };
  });

  readonly chartSeries = computed(() => {
    if (!this.activeChartCurrencyCode()) {
      return [];
    }

    const grouped = new Map<string, ExchangeRate[]>();

    for (const rate of this.rates()) {
      if (!grouped.has(rate.currency_code)) {
        grouped.set(rate.currency_code, []);
      }
      grouped.get(rate.currency_code)?.push(rate);
    }

    return Array.from(grouped.entries())
      .slice(0, 5)
      .map(([code, rates]) => ({
        code,
        rates: [...rates].sort((left, right) =>
          left.effective_date.localeCompare(right.effective_date),
        ),
      }));
  });

  readonly chartBounds = computed(() => {
    const values = this.chartSeries().flatMap((series) =>
      series.rates.map((rate) => Number(rate.rate)),
    );

    if (values.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  readonly chartMinLabel = computed(() => this.chartBounds().min.toFixed(4));
  readonly chartMaxLabel = computed(() => this.chartBounds().max.toFixed(4));

  loadRates(): void {
    const validationError = this.validateDateRange();
    if (validationError) {
      this.showMessage(validationError);
      return;
    }

    if (this.normalizedCurrencyCode() === 'PLN') {
      this.showMessage('PLN jest waluta bazowa NBP i nie wystepuje w tabeli kursow A.');
      return;
    }

    this.isLoading.set(true);
    this.currencyApi
      .getRates(this.startDate(), this.endDate(), this.normalizedCurrencyCode())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rates) => {
          this.rates.set(rates);
          this.activeChartCurrencyCode.set(this.normalizedCurrencyCode() ?? '');
        },
        error: () => {
          this.rates.set([]);
          this.activeChartCurrencyCode.set('');
          this.showMessage('Nie udalo sie pobrac kursow z backendu.');
        },
      });
  }

  fetchRates(): void {
    const validationError = this.validateDateRange();
    if (validationError) {
      this.showMessage(validationError);
      return;
    }

    this.isLoading.set(true);
    this.currencyApi
      .fetchRates(this.startDate(), this.endDate())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.showMessage(
            `Zapisano: ${result.saved_records}, pominieto duplikaty: ${result.skipped_duplicates}`,
          );
          this.loadRates();
        },
        error: () => {
          this.rates.set([]);
          this.activeChartCurrencyCode.set('');
          this.showMessage('Nie udalo sie pobrac danych z NBP.');
        },
      });
  }

  setStartDate(value: string): void {
    this.startDate.set(value);
  }

  setEndDate(value: string): void {
    this.endDate.set(value);
  }

  setCurrencyCode(value: string): void {
    this.currencyCode.set(value.toUpperCase().trim());
  }

  setSort(sort: Sort): void {
    this.sortState.set(sort);
  }

  private normalizedCurrencyCode(): string | undefined {
    const code = this.currencyCode().trim().toUpperCase();
    return code.length === 3 ? code : undefined;
  }

  private validateDateRange(): string | null {
    if (this.startDate() > this.endDate()) {
      return 'Data poczatkowa musi byc wczesniejsza lub rowna koncowej.';
    }

    if (this.endDate() > this.today) {
      return 'NBP udostepnia tylko opublikowane kursy. Data koncowa nie moze byc z przyszlosci.';
    }

    const start = new Date(`${this.startDate()}T00:00:00`);
    const end = new Date(`${this.endDate()}T00:00:00`);
    const rangeInDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    if (rangeInDays > 93) {
      return 'API NBP pozwala pobrac maksymalnie 93 dni w jednym zapytaniu. Wybierz krotszy zakres.';
    }

    return null;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3500 });
  }

  private compareRates(left: ExchangeRate, right: ExchangeRate, column: string): number {
    switch (column) {
      case 'effective_date':
        return left.effective_date.localeCompare(right.effective_date);
      case 'currency_code':
        return left.currency_code.localeCompare(right.currency_code);
      case 'currency_name':
        return left.currency_name.localeCompare(right.currency_name, 'pl');
      case 'rate':
        return Number(left.rate) - Number(right.rate);
      case 'table_number':
        return left.table_number.localeCompare(right.table_number);
      default:
        return 0;
    }
  }

  getChartPoints(rates: ExchangeRate[]): string {
    if (rates.length === 0) {
      return '';
    }

    const { min, max } = this.chartBounds();
    const range = max - min || 1;
    const width = 100;
    const height = 100;

    return rates
      .map((rate, index) => {
        const x = rates.length === 1 ? width / 2 : (index / (rates.length - 1)) * width;
        const y = height - ((Number(rate.rate) - min) / range) * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }
}
