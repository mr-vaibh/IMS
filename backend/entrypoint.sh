#!/bin/sh
set -e

echo "Waiting for database..."

# wait until Postgres is ready
until python - <<EOF
import psycopg2
import os
try:
    psycopg2.connect(
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        host=os.environ.get("DB_HOST"),
        port=os.environ.get("DB_PORT"),
    )
except Exception as e:
    raise SystemExit(1)
EOF
do
  sleep 1
done

echo "Database is ready."

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Seeding RBAC..."
python manage.py seed_rbac || true
# ^ prevents container crash if seed already ran

echo "Starting Gunicorn..."
exec "$@"
