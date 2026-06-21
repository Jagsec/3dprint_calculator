from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, UserDetailView, EstimateViewSet,
    ClientViewSet, PrinterViewSet, MaterialViewSet,
    ProjectViewSet, ProjectPrintViewSet, ProjectMaterialViewSet,
    KanbanTaskViewSet, ExportBackupView, ImportBackupView,
    PasswordResetRequestView, PasswordResetConfirmView
)

router = DefaultRouter()
router.register(r'estimates', EstimateViewSet, basename='estimate')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'printers', PrinterViewSet, basename='printer')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'project-prints', ProjectPrintViewSet, basename='projectprint')
router.register(r'project-materials', ProjectMaterialViewSet, basename='projectmaterial')
router.register(r'tasks', KanbanTaskViewSet, basename='task')

urlpatterns = [
    # Autenticación
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', UserDetailView.as_view(), name='auth_user'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    
    # Respaldo (Backup/Restore)
    path('backup/export/', ExportBackupView.as_view(), name='backup_export'),
    path('backup/import/', ImportBackupView.as_view(), name='backup_import'),
    
    # CRUD general
    path('', include(router.urls)),
]
