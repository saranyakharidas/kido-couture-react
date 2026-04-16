web: python manage.py migrate && python manage.py ensure_admins && gunicorn ecom.wsgi:application --bind 0.0.0.0:$PORT
