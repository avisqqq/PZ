export interface ExchangeRate {
  id: number;
  table_type: string;
  table_number: string;
  effective_date: string;
  currency_code: string;
  currency_name: string;
  rate: string;
  created_at: string;
}

export interface FetchResult {
  requested_dates: string[];
  saved_records: number;
  skipped_duplicates: number;
}

