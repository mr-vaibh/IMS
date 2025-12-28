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