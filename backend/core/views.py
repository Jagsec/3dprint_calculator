from rest_framework import generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import (
    Estimate, Client, Printer, Material, Project, 
    ProjectPrint, ProjectMaterial, KanbanTask
)
from .serializers import (
    RegisterSerializer, UserSerializer, EstimateSerializer,
    ClientSerializer, PrinterSerializer, MaterialSerializer,
    ProjectSerializer, ProjectPrintSerializer, ProjectMaterialSerializer,
    KanbanTaskSerializer
)

# 1. Autenticación y Registro (Sin cambios)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

# 2. ViewSet original para Estimates rápidos
class EstimateViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = EstimateSerializer
    
    def get_queryset(self):
        return Estimate.objects.filter(user=self.request.user)

# 3. ViewSets Nuevos del Sistema ERP

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ClientSerializer

    def get_queryset(self):
        return Client.objects.filter(user=self.request.user)

class PrinterViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = PrinterSerializer

    def get_queryset(self):
        return Printer.objects.filter(user=self.request.user)

class MaterialViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = MaterialSerializer

    def get_queryset(self):
        return Material.objects.filter(user=self.request.user)

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

class ProjectPrintViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectPrintSerializer

    def get_queryset(self):
        return ProjectPrint.objects.filter(project__user=self.request.user)

class ProjectMaterialViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProjectMaterialSerializer

    def get_queryset(self):
        return ProjectMaterial.objects.filter(project__user=self.request.user)

class KanbanTaskViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = KanbanTaskSerializer

    def get_queryset(self):
        queryset = KanbanTask.objects.filter(project__user=self.request.user)
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

# 4. Servicios de Respaldo e Importación (Export/Import LAN)

class ExportBackupView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        
        clients = Client.objects.filter(user=user)
        printers = Printer.objects.filter(user=user)
        materials = Material.objects.filter(user=user)
        projects = Project.objects.filter(user=user)
        estimates = Estimate.objects.filter(user=user)

        data = {
            "clients": ClientSerializer(clients, many=True).data,
            "printers": PrinterSerializer(printers, many=True).data,
            "materials": MaterialSerializer(materials, many=True).data,
            "projects": ProjectSerializer(projects, many=True).data, # Serializa anidadamente prints, materiales y tareas
            "estimates": EstimateSerializer(estimates, many=True).data,
        }
        return Response(data)

class ImportBackupView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        data = request.data

        if not isinstance(data, dict):
            return Response({"detail": "Datos de backup inválidos, deben ser un objeto JSON."}, status=400)

        try:
            # Diccionarios de mapeo para re-enlazar llaves primarias auto-incrementables
            client_map = {}
            printer_map = {}
            material_map = {}

            # Opcional: Eliminar datos previos del usuario para evitar duplicaciones
            # Descomentar si el usuario explícitamente prefiere sobreescribir
            # Client.objects.filter(user=user).delete()
            # Printer.objects.filter(user=user).delete()
            # Material.objects.filter(user=user).delete()
            # Project.objects.filter(user=user).delete()
            # Estimate.objects.filter(user=user).delete()

            # 1. Importar Clientes
            for c in data.get('clients', []):
                old_id = c.get('id')
                client = Client.objects.create(
                    user=user,
                    name=c.get('name'),
                    email=c.get('email'),
                    phone=c.get('phone'),
                    notes=c.get('notes')
                )
                client_map[old_id] = client.id

            # 2. Importar Impresoras
            for p in data.get('printers', []):
                old_id = p.get('id')
                printer = Printer.objects.create(
                    user=user,
                    name=p.get('name'),
                    wattage=p.get('wattage', 150),
                    depreciation_per_hour=p.get('depreciation_per_hour', '0.80'),
                    electricity_cost_kwh=p.get('electricity_cost_kwh', '0.10')
                )
                printer_map[old_id] = printer.id

            # 3. Importar Inventario de Materiales
            for m in data.get('materials', []):
                old_id = m.get('id')
                material = Material.objects.create(
                    user=user,
                    name=m.get('name'),
                    material_type=m.get('material_type', 'FILAMENT'),
                    purchase_cost=m.get('purchase_cost', '0.00'),
                    purchase_size=m.get('purchase_size', '1.00'),
                    unit_of_measure=m.get('unit_of_measure', 'g'),
                    stock_qty=m.get('stock_qty', '0.00'),
                    details=m.get('details')
                )
                material_map[old_id] = material.id

            # 4. Importar Historial de Cotizaciones Rápidas
            for e in data.get('estimates', []):
                Estimate.objects.create(
                    user=user,
                    name=e.get('name'),
                    description=e.get('description'),
                    filament_type=e.get('filament_type', 'PLA'),
                    filament_cost_per_kg=e.get('filament_cost_per_kg'),
                    part_weight_grams=e.get('part_weight_grams'),
                    waste_percentage=e.get('waste_percentage'),
                    print_time_minutes=e.get('print_time_minutes'),
                    printer_wattage=e.get('printer_wattage'),
                    electricity_cost_kwh=e.get('electricity_cost_kwh'),
                    printer_depreciation_hour=e.get('printer_depreciation_hour'),
                    post_process_minutes=e.get('post_process_minutes'),
                    post_process_hourly_rate=e.get('post_process_hourly_rate'),
                    margin_percentage=e.get('margin_percentage')
                )

            # 5. Importar Proyectos Complejos
            for pr in data.get('projects', []):
                old_proj_id = pr.get('id')
                old_cli_id = pr.get('client')
                new_cli_id = client_map.get(old_cli_id) if old_cli_id else None

                project = Project.objects.create(
                    user=user,
                    client_id=new_cli_id,
                    name=pr.get('name'),
                    description=pr.get('description'),
                    margin_percentage=pr.get('margin_percentage', '30.00'),
                    status=pr.get('status', 'QUOTED'),
                    due_date=pr.get('due_date'),
                    labor_minutes=pr.get('labor_minutes', 0),
                    labor_hourly_rate=pr.get('labor_hourly_rate', '8.00')
                )

                # Re-vincular e importar ProjectPrints asociados
                for prt in pr.get('prints', []):
                    old_prt_printer_id = prt.get('printer')
                    new_printer_id = printer_map.get(old_prt_printer_id) if old_prt_printer_id else None
                    
                    ProjectPrint.objects.create(
                        project=project,
                        name=prt.get('name'),
                        printer_id=new_printer_id,
                        filament_type=prt.get('filament_type', 'PLA'),
                        filament_cost_per_kg=prt.get('filament_cost_per_kg'),
                        part_weight_grams=prt.get('part_weight_grams'),
                        waste_percentage=prt.get('waste_percentage', '10.00'),
                        print_time_minutes=prt.get('print_time_minutes'),
                        printer_wattage=prt.get('printer_wattage'),
                        electricity_cost_kwh=prt.get('electricity_cost_kwh'),
                        printer_depreciation_hour=prt.get('printer_depreciation_hour')
                    )

                # Re-vincular e importar ProjectMaterials asociados
                for pm in pr.get('project_materials', []):
                    old_mat_id = pm.get('material')
                    new_mat_id = material_map.get(old_mat_id)
                    if new_mat_id:
                        ProjectMaterial.objects.create(
                            project=project,
                            material_id=new_mat_id,
                            quantity_used=pm.get('quantity_used')
                        )

                # Re-vincular e importar Tareas Kanban asociadas
                for t in pr.get('tasks', []):
                    KanbanTask.objects.create(
                        project=project,
                        title=t.get('title'),
                        description=t.get('description'),
                        status=t.get('status', 'TODO'),
                        due_date=t.get('due_date')
                    )

            return Response({"detail": "Copia de seguridad importada exitosamente."})
        except Exception as e:
            return Response({"detail": f"Error al procesar la importación: {str(e)}"}, status=500)

# 5. Recuperación de Contraseña (Gmail SMTP)
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "El correo electrónico es obligatorio."}, status=400)

        # Buscar usuarios con este correo (case insensitive)
        users = User.objects.filter(email__iexact=email)
        
        # Enviar correo si existen usuarios asociados
        for user in users:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Construir URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            subject = "Recuperación de Contraseña - 3D Print ERP"
            message = (
                f"Hola {user.username},\n\n"
                f"Has solicitado restablecer tu contraseña para tu cuenta de 3D Print ERP.\n\n"
                f"Por favor, haz clic en el siguiente enlace para continuar con el restablecimiento:\n\n"
                f"{reset_url}\n\n"
                f"Si no solicitaste este cambio, puedes ignorar este correo de forma segura.\n\n"
                f"Atentamente,\n"
                f"Equipo de 3D Print ERP"
            )
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False
            )

        return Response({
            "detail": "Si el correo electrónico está registrado, recibirás un mensaje con instrucciones para restablecer tu contraseña."
        }, status=200)

class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({"detail": "Todos los campos son obligatorios (uidb64, token, new_password)."}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Tu contraseña ha sido restablecida exitosamente."}, status=200)
        else:
            return Response({"detail": "El enlace de recuperación es inválido o ha expirado."}, status=400)

