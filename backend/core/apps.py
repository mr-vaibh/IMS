# backend/core/apps.py
from django.apps import AppConfig
import threading

class CoreConfig(AppConfig):
    name = "core"

    def ready(self):
        from core.license import validate_license
        from core.watchdog import start_watchdog

        validate_license()

        t = threading.Thread(
            target=start_watchdog,
            daemon=True
        )
        t.start()
