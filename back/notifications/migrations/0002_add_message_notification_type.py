# This migration documents the new notification type used by Phase 2.
# No database schema change is required because notification_type is a CharField.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = []
