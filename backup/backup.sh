#!/bin/sh
set -e

DATE_DAY=$(date +"%Y-%m-%d_%H-%M")
DATE_MONTH=$(date +"%Y-%m")

BACKUP_BASE="/backups"
DAILY_DIR="$BACKUP_BASE/daily"
MONTHLY_DIR="$BACKUP_BASE/monthly"

DAILY_FILE="ims_daily_${DATE_DAY}.sql.gz"
MONTHLY_FILE="ims_monthly_${DATE_MONTH}.sql.gz"

mkdir -p "$DAILY_DIR" "$MONTHLY_DIR"

echo "[INFO] Starting backup at $(date)"

export PGPASSWORD="$POSTGRES_PASSWORD"

# ---- Daily backup (compressed) ----
pg_dump \
  -h db \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  | gzip > "$DAILY_DIR/$DAILY_FILE"

echo "[INFO] Daily backup created: $DAILY_FILE"

# ---- Monthly backup (once per month) ----
if [ ! -f "$MONTHLY_DIR/$MONTHLY_FILE" ]; then
  pg_dump \
    -h db \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --no-owner \
    --no-acl \
    > "$MONTHLY_DIR/$MONTHLY_FILE"

  echo "[INFO] Monthly backup created: $MONTHLY_FILE"
else
  echo "[INFO] Monthly backup already exists for this month"
fi

# ---- Cleanup ----
# Keep daily backups for 30 days
find "$DAILY_DIR" -type f -name "*.sql.gz" -mtime +30 -delete

# Keep monthly backups for 6 months (~180 days)
find "$MONTHLY_DIR" -type f -name "*.sql.gz" -mtime +180 -delete

echo "[INFO] Cleanup done"
