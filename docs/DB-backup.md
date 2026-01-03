# PostgreSQL Backup & Restore (Docker)

This project uses a **Docker-based automated PostgreSQL backup system** with daily and monthly retention.

No application code is involved.

---

## How It Works

* A dedicated **backup container** runs alongside Postgres
* A **cron job** inside the container runs a shell script
* Backups are written to the host machine via a mounted volume

### Backup Strategy

| Type    | Location           | Retention |
| ------- | ------------------ | --------- |
| Daily   | `backups/daily/`   | 30 days   |
| Monthly | `backups/monthly/` | 6 months  |

---

## Files Involved

```
backup/
├── backup.sh          # Backup script
├── crontabs/
│   └── root           # Cron schedule
backups/
├── daily/             # Daily .sql files
├── monthly/           # Monthly .sql files
```

---

## Cron Schedule

Defined in `backup/crontabs/root`:

```cron
0 2 * * * /backup.sh >> /backups/backup.log 2>&1
```

Runs **every day at 02:00**.

---

## Environment Variables Used

Provided via `.env` / Docker Compose:

```env
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

---

## Run Backup Manually (Recommended for Testing)

```bash
docker exec ims_backup sh -c "/backup.sh"
```

Check output:

```bash
cat backups/backup.log
```

---

## Verify Backups

```bash
ls backups/daily
ls backups/monthly
```

Each file is a full database dump.

---

## Restore From Backup

### 1️⃣ Stop backend (optional but safer)

```bash
docker compose stop backend
```

### 2️⃣ Restore a backup file

```bash
cat backups/daily/ims_daily_YYYY-MM-DD_HH-MM.sql | \
docker exec -i ims_db psql \
  -U POSTGRES_USER \
  -d POSTGRES_DB
```

Or monthly:

```bash
cat backups/monthly/ims_monthly_YYYY-MM.sql | \
docker exec -i ims_db psql \
  -U POSTGRES_USER \
  -d POSTGRES_DB
```

---

## Restore Into a Fresh Database

```bash
docker exec -it ims_db psql -U POSTGRES_USER
```

```sql
DROP DATABASE ims;
CREATE DATABASE ims;
\q
```

Then restore using the command above.

---

## Cleanup Policy (Automatic)

* Daily backups older than **30 days** → deleted
* Monthly backups older than **6 months** → deleted
* Cleanup runs every time the backup script runs

---

## Common Checks

### Backup container status

```bash
docker ps | grep ims_backup
```

### Cron running

```bash
docker logs ims_backup
```

Note: Keep check of the timezone of the Alpine image where cron is running.

---

## Notes

* Backups are **plain SQL** (portable, readable)
* Safe across environments (`--no-owner --no-acl`)
* No serializers, no Django dependency
* Works entirely at database level
