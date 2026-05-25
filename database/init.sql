CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    table_type VARCHAR(1) NOT NULL,
    table_number VARCHAR(32) NOT NULL,
    effective_date DATE NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    rate NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_exchange_rate
        UNIQUE (table_type, effective_date, currency_code)
);

