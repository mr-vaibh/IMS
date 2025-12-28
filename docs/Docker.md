Sure! Here's a **short, clear reference guide** for your IMS Docker + Django + Next.js setup. You can keep this handy in your project.

---

# IMS Docker Setup – Quick Docs

## 1. Directory structure

```
IMS/
├─ backend/        # Django (DRF)
│  ├─ Dockerfile
│  ├─ requirements.txt
│  └─ ...
├─ frontend/       # Next.js
│  ├─ Dockerfile
│  └─ ...
├─ docker-compose.yml
└─ .env
```

---

## 2. Environment variables (`.env`)

```env
# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=*
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database
DB_NAME=inventory
DB_USER=postgres
DB_PASSWORD=root321
DB_HOST=db
DB_PORT=5432
```

> Place **only one copy in project root**. Docker-compose will inject them into containers. No need to duplicate in backend/frontend.

---

## 3. Docker commands

### Start services

```bash
docker compose up -d
```

### Stop services

```bash
docker compose down
```

### Stop and remove volumes (reset database)

```bash
docker compose down -v
```

> Use this if you change DB password or want a fresh Postgres.

### Rebuild images (if Dockerfile or dependencies change)

```bash
docker compose build
```

### Run Django commands in backend container

```bash
docker compose exec backend python manage.py <command>
```

Example:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py collectstatic --noinput
```

---

## 4. Static files (Django Admin CSS)

* **Production (Gunicorn)**:

  * Install **WhiteNoise**: `pip install whitenoise`
  * Add middleware in `settings.py`:

    ```python
    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'whitenoise.middleware.WhiteNoiseMiddleware',
        ...
    ]
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
    ```

* **Collect static files**:

```bash
docker compose exec backend python manage.py collectstatic --noinput
```

* Optional: mount static files for persistence:

```yaml
backend:
  volumes:
    - ./backend/staticfiles:/app/staticfiles
```

* **Development**: you can set `DJANGO_DEBUG=True` to serve static automatically.

---

## 5. Notes / Common Gotchas

* **DB password errors** → usually due to old Docker volume. Reset with `docker compose down -v`.
* **Admin looks unstyled** → run `collectstatic` and/or use WhiteNoise.
* **Environment variables** → make sure `.env` is in project root. Postgres reads env only on **first creation**.
* **Frontend API URL** → uses `NEXT_PUBLIC_API_URL=http://localhost:8000` to call backend.

---

This covers all the key commands and gotchas we talked about.

---

If you want, I can also make a **one-page “cheat sheet” with commands only** so it’s super quick to run everything without looking at docs. Do you want me to do that?
