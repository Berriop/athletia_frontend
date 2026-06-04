# 🏃‍♂️ Athletia Frontend Web App

**Athletia** es una aplicación integral diseñada para que los atletas lleven un control riguroso de su rendimiento, nutrición, calidad de sueño y recuperación. Este repositorio contiene el código fuente del **Frontend**, caracterizado por una arquitectura limpia, una interfaz de usuario moderna basada en *Glassmorphism* y lógicas avanzadas de analítica local.

---

## 🎨 UI / UX Destacada

- **Diseño Moderno (Glassmorphism):** Paneles translúcidos, fondos vibrantes interactivos y desenfoques (blurs) para una experiencia premium.
- **Coach Inteligente (Smart Coach):** Un motor de reglas 100% frontend que analiza tu sueño, estrés, lesiones y carga de trabajo para brindarte recomendaciones automatizadas en el Dashboard.
- **Recovery Score:** Cálculo dinámico de una puntuación de recuperación (0-100) basada en tus métricas recientes, reflejado con indicadores de colores.
- **Sistema Global de Notificaciones:** Interfaz personalizada en la barra superior para confirmaciones de éxito y errores sin usar alertas intrusivas del navegador.
- **Portales en React (ConfirmDialog):** Modales construidos sobre `createPortal` para evitar conflictos de z-index y contextos CSS locales.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React 18
- **Construcción y empaquetado:** Vite
- **Lenguaje:** TypeScript
- **Enrutamiento:** React Router v6
- **Estilos:** Vanilla CSS (CSS Modules / Variables Globales)
- **Cliente HTTP:** Axios
- **Iconografía:** Lucide React

---

## 🏗️ Arquitectura (Basada en Clean Architecture)

El código del frontend está estructurado para escalar sin ensuciar los componentes visuales con lógicas complejas o llamadas a la API sueltas:

1. **`src/components/`**: Componentes visuales puros y reutilizables (Botones, Modales, Headers).
2. **`src/pages/`**: Vistas principales ensambladas (Dashboard, CRUDs, Login).
3. **`src/services/`**: Capa de abstracción de red (Cliente Axios centralizado con interceptores automáticos de JWT y servicios por dominio como `workout.service.ts`).
4. **`src/contexts/`**: Manejo de estado global (Sesión de Usuario, Notificaciones).
5. **`src/utils/`**: Lógica pura de negocio y helpers (ej. cálculo de `Recovery Score` y `Smart Coach`).
6. **`src/types/`**: Interfaces de TypeScript que espejean los contratos de la API.

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

### 1. Clonar el repositorio
```bash
git clone <tu-url-del-repo-frontend>
cd athletia_frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto para enlazar la aplicación a tu backend.
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Ejecutar entorno de desarrollo
```bash
npm run dev
```
La aplicación estará disponible por defecto en `http://localhost:5173`.

### 5. Compilar para Producción
```bash
npm run build
```
Generará la carpeta `/dist` lista para ser desplegada en Vercel, Netlify u otros servicios.

---

## 🔐 Manejo de Sesión y Rutas

- Las rutas de la aplicación están protegidas mediante el componente `<ProtectedRoute>`.
- Si un usuario no está autenticado e intenta acceder al Dashboard, es redirigido automáticamente a `/login`.
- El token JWT se guarda localmente y se inyecta automáticamente en los `Headers` de todas las peticiones a la API gracias a los **Interceptores de Axios**.
- Si el backend devuelve un error `401 Unauthorized` por un token vencido, la aplicación automáticamente cierra la sesión y limpia el estado global.


