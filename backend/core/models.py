from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

class Estimate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='estimates')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Filament variables
    FILAMENT_CHOICES = [
        ('PLA', 'PLA'),
        ('PLA_PLUS', 'PLA+'),
        ('PETG', 'PETG'),
        ('TPU', 'TPU'),
        ('ASA', 'ASA'),
        ('ABS', 'ABS'),
        ('NYLON', 'Nylon'),
        ('CARBON_FIBER', 'Fibra de Carbono'),
    ]
    filament_type = models.CharField(max_length=50, choices=FILAMENT_CHOICES, default='PLA')
    filament_cost_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    part_weight_grams = models.DecimalField(max_digits=10, decimal_places=2)
    waste_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Printer and electricity variables
    print_time_minutes = models.IntegerField()
    printer_wattage = models.IntegerField()
    electricity_cost_kwh = models.DecimalField(max_digits=10, decimal_places=4)
    printer_depreciation_hour = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Post-processing variables
    post_process_minutes = models.IntegerField()
    post_process_hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Margin
    margin_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'estimates'
        
    def __str__(self):
        return f"{self.name} - {self.user.username}"
        
    @property
    def material_cost(self):
        # Cost = (weight_g / 1000) * (1 + waste% / 100) * cost_per_kg
        weight_kg = self.part_weight_grams / Decimal('1000.0')
        waste_factor = Decimal('1.0') + (self.waste_percentage / Decimal('100.0'))
        return (weight_kg * waste_factor * self.filament_cost_per_kg).quantize(Decimal('0.01'))
        
    @property
    def electricity_cost(self):
        # Cost = (wattage / 1000) * (minutes / 60) * cost_kwh
        kw = self.printer_wattage / Decimal('1000.0')
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (kw * hours * self.electricity_cost_kwh).quantize(Decimal('0.01'))
        
    @property
    def printer_depreciation_cost(self):
        # Cost = (minutes / 60) * dep_hour
        hours = Decimal(self.print_time_minutes) / Decimal('60.0')
        return (hours * self.printer_depreciation_hour).quantize(Decimal('0.01'))
        
    @property
    def post_process_cost(self):
        # Cost = (minutes / 60) * rate_hour
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
