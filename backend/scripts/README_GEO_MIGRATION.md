# Geocoding DB Update

Run the SQL to add GPS columns to the `records` table (PostgreSQL):

```sql
\i backend/scripts/add_gps_columns_records.sql
```

If you use a different schema name, adjust the table name accordingly. Columns are nullable and won't block existing data.
