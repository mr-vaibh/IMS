from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from inventory.models import Warehouse
from company.models import Company

# Create your views here.


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def company_list_create(request):
    if request.method == "GET":
        qs = Company.objects.filter(created_by=request.user).order_by("name")
        return Response([
            {"id": c.id, "name": c.name, "created_by_me": c.created_by_id == request.user.id}
            for c in qs
        ])

    # CREATE (admin only later)
    c = Company.objects.create(name=request.data["name"], created_by=request.user)
    return Response({"id": c.id, "name": c.name}, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_warehouses(request, company_id):
    qs = Warehouse.objects.filter(
        company_id=company_id,
        deleted_at__isnull=True
    ).order_by("name")

    return Response([
        {
            "id": w.id,
            "name": w.name,
            "code": w.code,
        }
        for w in qs
    ])
