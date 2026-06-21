from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from decimal import Decimal

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=50, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='clients', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'clients',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Printer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('wattage', models.IntegerField(default=150)),
                ('depreciation_per_hour', models.DecimalField(decimal_places=2, default=Decimal('0.80'), max_digits=10)),
                ('electricity_cost_kwh', models.DecimalField(decimal_places=4, default=Decimal('0.10'), max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='printers', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'printers',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('material_type', models.CharField(choices=[('FILAMENT', 'Filamento'), ('COMPONENT', 'Componente Externo / Hardware')], default='FILAMENT', max_length=50)),
                ('purchase_cost', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('purchase_size', models.DecimalField(decimal_places=2, default=Decimal('1.00'), max_digits=10)),
                ('unit_of_measure', models.CharField(default='g', max_length=50)),
                ('unit_cost', models.DecimalField(decimal_places=4, default=Decimal('0.0000'), max_digits=10)),
                ('stock_qty', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('details', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='materials', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'materials',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('margin_percentage', models.DecimalField(decimal_places=2, default=Decimal('30.00'), max_digits=5)),
                ('status', models.CharField(choices=[('QUOTED', 'Presupuestado'), ('APPROVED', 'Aprobado'), ('IN_PRODUCTION', 'En Producción'), ('DELIVERED', 'Entregado'), ('PAID', 'Pagado')], default='QUOTED', max_length=50)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='core.client')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='projects', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'projects',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProjectPrint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('filament_type', models.CharField(default='PLA', max_length=50)),
                ('filament_cost_per_kg', models.DecimalField(decimal_places=2, max_digits=10)),
                ('part_weight_grams', models.DecimalField(decimal_places=2, max_digits=10)),
                ('waste_percentage', models.DecimalField(decimal_places=2, default=Decimal('10.00'), max_digits=5)),
                ('print_time_minutes', models.IntegerField()),
                ('printer_wattage', models.IntegerField()),
                ('electricity_cost_kwh', models.DecimalField(decimal_places=4, max_digits=10)),
                ('printer_depreciation_hour', models.DecimalField(decimal_places=2, max_digits=10)),
                ('post_process_minutes', models.IntegerField(default=0)),
                ('post_process_hourly_rate', models.DecimalField(decimal_places=2, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prints', to='core.project')),
                ('printer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='project_prints', to='core.printer')),
            ],
            options={
                'db_table': 'project_prints',
            },
        ),
        migrations.CreateModel(
            name='ProjectMaterial',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_used', models.DecimalField(decimal_places=2, max_digits=10)),
                ('material', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_materials', to='core.material')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='project_materials', to='core.project')),
            ],
            options={
                'db_table': 'project_materials',
            },
        ),
        migrations.CreateModel(
            name='KanbanTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, null=True)),
                ('status', models.CharField(choices=[('TODO', 'Por Hacer'), ('DESIGNING', 'Diseño / Slicing'), ('QUEUE', 'Cola de Impresión'), ('PRINTING', 'Imprimiendo'), ('POST_PROCESSING', 'Post-procesado'), ('QC', 'Control de Calidad'), ('DONE', 'Listo / Entregado')], default='TODO', max_length=50)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='core.project')),
            ],
            options={
                'db_table': 'kanban_tasks',
                'ordering': ['due_date', '-created_at'],
            },
        ),
    ]
