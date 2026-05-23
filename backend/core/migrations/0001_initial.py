# Generated manually to prevent needing execution before docker-compose runs
from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Estimate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('filament_type', models.CharField(default='PLA', max_length=50)),
                ('filament_cost_per_kg', models.DecimalField(decimal_places=2, max_digits=10)),
                ('part_weight_grams', models.DecimalField(decimal_places=2, max_digits=10)),
                ('waste_percentage', models.DecimalField(decimal_places=2, max_digits=5)),
                ('print_time_minutes', models.IntegerField()),
                ('printer_wattage', models.IntegerField()),
                ('electricity_cost_kwh', models.DecimalField(decimal_places=4, max_digits=10)),
                ('printer_depreciation_hour', models.DecimalField(decimal_places=2, max_digits=10)),
                ('post_process_minutes', models.IntegerField()),
                ('post_process_hourly_rate', models.DecimalField(decimal_places=2, max_digits=10)),
                ('margin_percentage', models.DecimalField(decimal_places=2, max_digits=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='estimates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'estimates',
                'ordering': ['-created_at'],
            },
        ),
    ]
