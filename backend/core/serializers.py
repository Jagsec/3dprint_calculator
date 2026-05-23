from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Estimate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

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

class EstimateSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    # Read-only properties computed on the model
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
            'id', 'user', 'name', 'description',
            'filament_type', 'filament_cost_per_kg', 'part_weight_grams', 'waste_percentage',
            'print_time_minutes', 'printer_wattage', 'electricity_cost_kwh', 'printer_depreciation_hour',
            'post_process_minutes', 'post_process_hourly_rate',
            'margin_percentage',
            'material_cost', 'electricity_cost', 'printer_depreciation_cost', 'post_process_cost',
            'direct_cost', 'margin_value', 'total_price',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
