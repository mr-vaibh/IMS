2️⃣ Clear access rules (non-negotiable)
Viewing companies
User can VIEW companies WHERE:
- company.created_by == user

Mutating data (CUD)
User can CREATE / UPDATE / DELETE data ONLY IF:
- request.user.userprofile.company == target.company

### RBAC
http://localhost:8000/rbac/seed-rbac/
Password - DOB

### .env.sample

```md
# Django
DJANGO_SECRET_KEY=django-secure-1@gbpfei4ilw$%di79sv@yl56vookkz86e3k=9t7pr)xrqvi4
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



# PDF
pdfEndpoint="/api/reports/stock/pdf"

brew install cairo pango gdk-pixbuf glib libffi
export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig"
export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
source ~/.zshrc