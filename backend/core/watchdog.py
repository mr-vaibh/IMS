# backend/core/watchdog.py
import time
from core.license import validate_license

def start_watchdog():
    while True:
        time.sleep(60 * 60) # 1 hour
        validate_license()
