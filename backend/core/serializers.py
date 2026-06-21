from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Estimate, Client, Printer, Material, Project, ProjectPrint, ProjectMaterial, KanbanTask

# 1. Serializador de Usuario
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

# 2. Serializador de Registro de Usuario
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        
    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value
        
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está registrado.")
        return value
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# 3. Serializador de Clientes (CRM)
class ClientSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Client
        fields = ('id', 'user', 'name', 'email', 'phone', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

# 4. Serializador de Impresoras (Flota)
class PrinterSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Printer
        fields = ('id', 'user', 'name', 'wattage', 'depreciation_per_hour', 'electricity_cost_kwh', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

# 5. Serializador de Inventario y Materiales
class MaterialSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=4, read_only=True)

    class Meta:
        model = Material
        fields = (
            'id', 'user', 'name', 'material_type', 
            'purchase_cost', 'purchase_size', 'unit_of_measure', 
            'unit_cost', 'stock_qty', 'details', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'unit_cost', 'created_at', 'updated_at')

# 6. Serializador de Piezas Impresas del Proyecto
class ProjectPrintSerializer(serializers.ModelSerializer):
    # Propiedades dinámicas
    material_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    electricity_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    printer_depreciation_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    post_process_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    printer_details = PrinterSerializer(source='printer', read_only=True)

    class Meta:
        model = ProjectPrint
        fields = (
            'id', 'project', 'name', 'printer', 'printer_details',
            'filament_type', 'filament_cost_per_kg', 'part_weight_grams', 'waste_percentage',
            'print_time_minutes', 'printer_wattage', 'electricity_cost_kwh', 'printer_depreciation_hour',
            'post_process_minutes', 'post_process_hourly_rate',
            'material_cost', 'electricity_cost', 'printer_depreciation_cost', 'post_process_cost', 'total_cost',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

# 7. Serializador de Componentes Externos del Proyecto
class ProjectMaterialSerializer(serializers.ModelSerializer):
    material_details = MaterialSerializer(source='material', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProjectMaterial
        fields = ('id', 'project', 'material', 'material_details', 'quantity_used', 'total_cost')
        read_only_fields = ('id', 'total_cost')

# 8. Serializador de Tareas de Kanban
class KanbanTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = KanbanTask
        fields = ('id', 'project', 'title', 'description', 'status', 'due_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

# 9. Serializador Completo de Proyectos (con agregación de costos)
class ProjectSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    client_details = ClientSerializer(source='client', read_only=True)
    
    # Listas anidadas de ítems
    prints = ProjectPrintSerializer(many=True, read_only=True)
    project_materials = ProjectMaterialSerializer(many=True, read_only=True)
    tasks = KanbanTaskSerializer(many=True, read_only=True)

    # Costos globales agregados
    material_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    electricity_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    depreciation_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    post_process_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    prints_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    hardware_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    direct_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    margin_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'user', 'client', 'client_details', 'name', 'description', 
            'margin_percentage', 'status', 'due_date', 
            'prints', 'project_materials', 'tasks',
            'material_cost', 'electricity_cost', 'depreciation_cost', 'post_process_cost', 
            'prints_cost', 'hardware_cost', 'direct_cost', 'margin_value', 'total_price',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

# 10. Serializador Original para Estimates rápidos (sin cambios)
class EstimateSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    material_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    electricity_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    printer_depreciation_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    post_process_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    direct_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    margin_value = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Estimate
        fields = (
            'id', 'user', 'name', 'description', 'filament_type',
            'filament_cost_per_kg', 'part_weight_grams', 'waste_percentage',
            'print_time_minutes', 'printer_wattage', 'electricity_cost_kwh', 'printer_depreciation_hour',
            'post_process_minutes', 'post_process_hourly_rate',
            'margin_percentage',
            'material_cost', 'electricity_cost', 'printer_depreciation_cost', 'post_process_cost',
            'direct_cost', 'margin_value', 'total_price',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
