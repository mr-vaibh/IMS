def paginate(qs, request, max_limit=200):
    try:
        limit = min(int(request.GET.get("limit", 50)), max_limit)
    except ValueError:
        limit = 50

    try:
        offset = int(request.GET.get("offset", 0))
    except ValueError:
        offset = 0

    total = qs.count()
    items = qs[offset: offset + limit]

    return items, {
        "limit": limit,
        "offset": offset,
        "total": total,
        "has_next": offset + limit < total,
        "has_prev": offset > 0,
    }
