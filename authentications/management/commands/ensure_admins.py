import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or reset configured admin users from environment variables."

    def handle(self, *args, **options):
        password = os.getenv("ADMIN_PASSWORD")
        if not password:
            self.stdout.write("ADMIN_PASSWORD is not set. Skipping admin reset.")
            return

        admins = self._parse_admins()
        if not admins:
            raise CommandError("No admin users configured.")

        for username, email in admins:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": email},
            )
            user.email = email
            user.is_superuser = True
            user.is_staff = True
            user.is_active = True
            user.set_password(password)
            user.save()

            action = "created" if created else "reset"
            self.stdout.write(self.style.SUCCESS(f"{username}: {action}"))

    def _parse_admins(self):
        raw_admins = os.getenv("ADMIN_USERS")
        if raw_admins:
            admins = []
            for entry in raw_admins.split(","):
                entry = entry.strip()
                if not entry:
                    continue

                if ":" in entry:
                    username, email = entry.split(":", 1)
                else:
                    username = entry
                    email = f"{entry}@example.com"

                admins.append((username.strip(), email.strip()))
            return admins

        return [
            ("admin", os.getenv("ADMIN_EMAIL", "nighilsukumaran@gmail.com")),
            ("admins", os.getenv("ADMINS_EMAIL", "admins@gmail.com")),
        ]
