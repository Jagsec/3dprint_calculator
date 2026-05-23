# 3D Print Calc - Gestor y Calculadora de Impresión 3D

Una aplicación web moderna y premium diseñada para cotizar proyectos de impresión 3D y gestionar el historial de cotizaciones de un negocio personal. El sistema calcula en tiempo real los costos de filamento, consumo eléctrico, depreciación de la impresora y mano de obra, aplicando un margen de ganancia configurable.

---

## Características Principales

1. **Calculadora Inteligente en Tiempo Real**:
   - **Módulo de Filamento:** Selector para tipos de filamento predefinidos (PLA, PLA+, PETG, TPU, ASA, ABS, Nylon, Fibra de Carbono), costo del rollo ($/kg), peso de la pieza (gramos) y porcentaje de desperdicio estimado.
   - **Módulo de Impresora y Consumo Eléctrico:** Tiempo de impresión (configurable en horas o minutos), consumo de la impresora (Watts), costo de la electricidad local ($/kWh) y tasa de depreciación de la máquina ($/hora).
   - **Módulo de Mano de Obra (Post-proceso):** Tiempo de post-procesamiento (horas o minutos) y tarifa horaria por el trabajo técnico de acabado.
   - **Margen de Ganancia:** Configuración porcentual (de 0% a 100%) aplicada directamente sobre el costo base (Markup simple).

2. **Historial de Cotizaciones Personalizado**:
   - Permite guardar los cálculos bajo un Nombre y una Descripción descriptiva.
   - **Buscador interactivo** en tiempo real en la pestaña de Historial para filtrar cotizaciones guardadas.
   - Botón **Editar** en cada item del historial para recargar instantáneamente sus valores en la calculadora (activando el Modo Edición para actualizar el registro o clonarlo).
   - Opción de eliminación segura de cotizaciones antiguas.

3. **Seguridad y Aislamiento Multi-usuario**:
   - Autenticación robusta basada en **JSON Web Tokens (JWT)** con renovación automática del token de acceso.
   - Aislamiento completo de base de datos a nivel de usuario: cada usuario registrado solo tiene acceso a sus propias cotizaciones guardadas.

4. **Diseño Visual de Alta Fidelidad**:
   - Interfaz nativa en modo oscuro con estética premium.
   - Efectos translúcidos (Glassmorphism), sombras profundas, HSL glow en esquinas y micro-animaciones fluidas al interactuar con botones y campos.
   - Diseño totalmente responsivo que se adapta a pantallas de computadoras y dispositivos móviles.

---

## Tecnologías Utilizadas

- **Frontend:** React.js (Vite), React Router v6, Axios (con interceptores JWT), Lucide Icons, Vanilla CSS (CSS Modules).
- **Backend:** Python 3.11, Django 4.2, Django REST Framework (DRF), SimpleJWT.
- **Base de Datos:** MySQL 8.0.
- **Contenedores:** Docker & Docker Compose.

---

## Estructura del Proyecto

```text
3dprint_calculator/
├── docker-compose.yml           # Orquestación de contenedores (db, backend, frontend)
├── README.md                    # Documentación del proyecto
├── backend/                     # Código fuente de Django REST Framework
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── calc_project/            # Configuración del proyecto Django
│   └── core/                    # Aplicación de cotizaciones (modelos, vistas, rutas, serializadores)
└── frontend/                    # Código fuente de React + Vite
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css            # Estilos globales y tema premium oscuro
        ├── services/            # Cliente de API con interceptor JWT
        ├── context/             # Gestión de la sesión de usuario (AuthContext)
        └── components/          # Vistas (Login, Register, Calculator, History, Navbar)
```

---

## Requisitos Previos

Asegúrate de tener instalados en tu sistema:
- **Docker** (versión 20.10 o superior)
- **Docker Compose**
- *Nota en Windows:* Asegúrate de abrir la aplicación **Docker Desktop** antes de ejecutar los comandos de inicio.

---

## Instalación y Arranque

Sigue estos sencillos pasos para clonar y ejecutar el proyecto localmente:

1. **Clona el Repositorio**:
   ```bash
   git clone https://github.com/Jagsec/3dprint_calculator.git
   cd 3dprint_calculator
   ```

2. **Levanta los Servicios con Docker**:
   Ejecuta el siguiente comando para compilar las imágenes e iniciar la base de datos MySQL, el backend y el frontend en segundo plano:
   ```bash
   docker compose up --build -d
   ```
   *El backend cuenta con un comando que detendrá el arranque del servidor Django hasta que la base de datos MySQL esté lista, aplicando las migraciones automáticamente en el primer inicio.*

3. **Accede a la Aplicación**:
   - **Frontend (Interfaz de Usuario):** Abre [http://localhost:5173](http://localhost:5173) en tu navegador.
   - **Backend (API REST):** Accede a [http://localhost:8000/api/](http://localhost:8000/api/)
   - **Consola de Administración de Django:** Accede a [http://localhost:8000/admin/](http://localhost:8000/admin/) (necesitarás crear un superusuario si deseas iniciar sesión aquí).

4. **Apagar los Servicios**:
   Cuando quieras detener los contenedores y liberar los puertos, ejecuta:
   ```bash
   docker compose down
   ```
   *Los datos de tus cotizaciones y usuarios permanecerán a salvo en el volumen local persistente de Docker.*
