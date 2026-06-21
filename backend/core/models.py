from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

# 1. Modelo de Clientes (CRM)
class Client(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        db_table = 'clients'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

# 2. Modelo de Impresoras (Flota)
class Printer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='printers')
    name = models.CharField(max_length=255)
    wattage = models.IntegerField(default=150)
    depreciation_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.80'))
    electricity_cost_kwh = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0.10'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        db_table = 'printers'

    def __str__(self):
        return f"{self.name} ({self.user.username})"

# 3. Modelo de Materiales e Inventario (Soporte para compras por pack y costos fraccionados)
class Material(models.Model):
    TYPE_CHOICES = [
        ('FILAMENT', 'Filamento'),
        ('COMPONENT', 'Componente Externo / Hardware')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials')
    name = models.CharField(max_length=255)
    material_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='FILAMENT')
    
    # Variables de compra a granel / pack
    purchase_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    purchase_size = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    unit_of_measure = models.CharField(max_length=50, default='g') # g, units, cm, meters, etc.
    
    # Costo unitario fraccionario (calculado automáticamente)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0.0000'))
    
    stock_qty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        db_table = 'materials'

    def __str__(self):
        return f"{self.name} ({self.get_material_type_display()})"

    def save(self, *args, **kwargs):
        # Auto-calcular costo fraccionario antes de persistir
        if self.purchase_size > 0:
            self.unit_cost = (self.purchase_cost / self.purchase_size)
        else:
            self.unit_cost = Decimal('0.0000')
        super().save(*args, **kwargs)

# 4. Modelo de Proyectos
class Project(models.Model):
    STATUS_CHOICES = [
        ('QUOTED', 'Presupuestado'),
        ('APPROVED', 'Aprobado'),
        ('IN_PRODUCTION', 'En Producción'),
        ('DELIVERED', 'Entregado'),
        ('PAID', 'Pagado')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('30.00'))
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='QUOTED')
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'projects'

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    # Propiedades dinámicas de agregación de costos
    @property
    def material_cost(self):
        return sum((item.material_cost for item in self.prints.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def electricity_cost(self):
        return sum((item.electricity_cost for item in self.prints.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def depreciation_cost(self):
        return sum((item.printer_depreciation_cost for item in self.prints.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def post_process_cost(self):
        return sum((item.post_process_cost for item in self.prints.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def prints_cost(self):
        return sum((item.total_cost for item in self.prints.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def hardware_cost(self):
        return sum((item.total_cost for item in self.project_materials.all()), Decimal('0.00')).quantize(Decimal('0.01'))

    @property
    def direct_cost(self):
        return (self.prints_cost + self.hardware_cost).quantize(Decimal('0.01'))

    @property
    def margin_value(self):
        return (self.direct_cost * (self.margin_percentage / Decimal('100.0'))).quantize(Decimal('0.01'))

    @property
    def total_price(self):
        return (self.direct_cost + self.margin_value).quantize(Decimal('0.01'))

# 5. Modelo de Piezas Impresas dentro de un Proyecto
class ProjectPrint(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='prints')
    name = models.CharField(max_length=255)
    printer = models.ForeignKey(Printer, on_delete=models.SET_NULL, null=True, blank=True, related_name='project_prints')
    
    # Datos del material
    filament_type = models.CharField(max_length=50, default='PLA')
    filament_cost_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    part_weight_grams = models.DecimalField(max_digits=10, decimal_places=2)
    waste_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10.00'))
    
    # Datos de impresión y electricidad
    print_time_minutes = models.IntegerField()
    printer_wattage = models.IntegerField()
    electricity_cost_kwh = models.DecimalField(max_digits=10, decimal_places=4)
    printer_depreciation_hour = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Datos de post-procesado (mano de obra)
    post_process_minutes = models.IntegerField(default=0)
    post_process_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_prints'

    @property
    def material_cost(self):
        weight_kg = self.part_weight_grams / Decimal('1000.0')
        waste_factor = Decimal('1.0') + (self.waste_percentage / Decimal('100.0'))
        return (weight_kg * waste_factor * self.filament_cost_per_kg).quantize(Decimal('0.01'))

    @property
    def electricity_cost(self):
        kw = self.printer_wattage / Decimal('1000.0')
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (kw * hours * self.electricity_cost_kwh).quantize(Decimal('0.01'))

    @property
    def printer_depreciation_cost(self):
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (hours * self.printer_depreciation_hour).quantize(Decimal('0.01'))

    @property
    def post_process_cost(self):
        hours = Decimal(self.post_process_minutes) / Decimal('60.0')
        return (hours * self.post_process_hourly_rate).quantize(Decimal('0.01'))

    @property
    def total_cost(self):
        return (self.material_cost + self.electricity_cost + self.printer_depreciation_cost + self.post_process_cost).quantize(Decimal('0.01'))

# 6. Relación de Materiales de Hardware agregados a un Proyecto
class ProjectMaterial(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_materials')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='project_materials')
    quantity_used = models.DecimalField(max_digits=10, decimal_places=2) # Decimal para soportar fracciones (ej. 40.5 cm)

    class Meta:
        db_table = 'project_materials'

    @property
    def total_cost(self):
        return (self.quantity_used * self.material.unit_cost).quantize(Decimal('0.01'))

# 7. Modelo de Tareas para Kanban de Manufactura
class KanbanTask(models.Model):
    STATUS_CHOICES = [
        ('TODO', 'Por Hacer'),
        ('DESIGNING', 'Diseño / Slicing'),
        ('QUEUE', 'Cola de Impresión'),
        ('PRINTING', 'Imprimiendo'),
        ('POST_PROCESSING', 'Post-procesado'),
        ('QC', 'Control de Calidad'),
        ('DONE', 'Listo / Entregado')
    ]
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='TODO')
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-created_at']
        db_table = 'kanban_tasks'

    def __str__(self):
        return f"{self.title} - {self.project.name}"

# 8. Mantener el Estimate original para cotizaciones rápidas unitarias
class Estimate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='estimates')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    filament_type = models.CharField(max_length=50, default='PLA')
    filament_cost_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    part_weight_grams = models.DecimalField(max_digits=10, decimal_places=2)
    waste_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    print_time_minutes = models.IntegerField()
    printer_wattage = models.IntegerField()
    electricity_cost_kwh = models.DecimalField(max_digits=10, decimal_places=4)
    printer_depreciation_hour = models.DecimalField(max_digits=10, decimal_places=2)
    post_process_minutes = models.IntegerField()
    post_process_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'estimates'

    @property
    def material_cost(self):
        weight_kg = self.part_weight_grams / Decimal('1000.0')
        waste_factor = Decimal('1.0') + (self.waste_percentage / Decimal('100.0'))
        return (weight_kg * waste_factor * self.filament_cost_per_kg).quantize(Decimal('0.01'))

    @property
    def electricity_cost(self):
        kw = self.printer_wattage / Decimal('1000.0')
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (kw * hours * self.electricity_cost_kwh).quantize(Decimal('0.01'))

    @property
    def printer_depreciation_cost(self):
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (hours * self.printer_depreciation_hour).quantize(Decimal('0.01'))

    @property
    def post_process_cost(self):
        hours = Decimal(self.post_process_minutes) / Decimal('60.0')
        return (hours * self.post_process_hourly_rate).quantize(Decimal('0.01'))

    @property
    def direct_cost(self):
        return (self.material_cost + self.electricity_cost + self.printer_depreciation_cost + self.post_process_cost).quantize(Decimal('0.01'))

    @property
    def margin_value(self):
        return (self.direct_cost * (self.margin_percentage / Decimal('100.0'))).quantize(Decimal('0.01'))

    @property
    def total_price(self):
        return (self.direct_cost + self.margin_value).quantize(Decimal('0.01'))
