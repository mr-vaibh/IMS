from django.urls import path
from .views import stock_report_pdf, movement_report_pdf, inventory_valuation_pdf, low_stock_report_pdf, audit_report_pdf, order_report_pdf

urlpatterns = [
    path("stock/pdf", stock_report_pdf),
    path("movement/pdf", movement_report_pdf),
    path("valuation/pdf", inventory_valuation_pdf),
    path("low-stock/pdf", low_stock_report_pdf),
    path("audit/pdf", audit_report_pdf),
    path("orders/pdf", order_report_pdf)
]
