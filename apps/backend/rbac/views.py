from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.core.management import call_command
from io import StringIO

@staff_member_required
def seed_rbac_view(request):
    output = None
    error = None

    # Define the correct password
    correct_password = '31-01-2004'

    # Check if the request is a POST and contains the password field
    if request.method == "POST":
        password = request.POST.get('password')

        # Validate the password
        if password != correct_password:
            error = "Incorrect password! Please try again."
        else:
            # Proceed with the RBAC seeding if password is correct
            buffer = StringIO()
            try:
                call_command("seed_rbac", stdout=buffer)
                output = buffer.getvalue()
            except Exception as e:
                error = str(e)

    return render(
        request,
        "rbac/seed_rbac.html",
        {
            "output": output,
            "error": error,
        },
    )
