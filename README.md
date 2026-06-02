# Athletia Frontend

Aplicación cliente para Athletia, desarrollada con React, Vite y TypeScript.

## 🚀 Tecnologías

* React 18
* Vite
* TypeScript
* React Router DOM v6
* Axios
* Lucide React (Iconos)
* CSS puro (Glassmorphism design)

## 📁 Estructura del Proyecto

* `src/components/` → UI reutilizable y presentacional (Header, Sidebar).
* `src/contexts/` → `AuthContext` para el manejo de sesión global.
* `src/layouts/` → Layouts principales (MainLayout).
* `src/pages/` → Las distintas vistas de la aplicación.
* `src/routes/` → Definición de rutas, `ProtectedRoute` y `PublicRoute`.
* `src/services/` → Cliente Axios (`api.ts`) centralizado y servicios para consumo de endpoints.
* `src/types/` → Definiciones estrictas de TypeScript.

## 🛠️ Instalación y Setup

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

La aplicación estará corriendo en `http://localhost:5173`.

## 🔐 Características implementadas

* **Autenticación completa**: Login, Registro, Logout.
* **Persistencia de sesión**: El JWT se guarda en `localStorage`.
* **Protección de rutas**: 
  * `ProtectedRoute` bloquea acceso sin token.
  * `PublicRoute` bloquea `/login` si ya hay sesión.
  * Interceptor Axios: Redirige automáticamente al detectar 401.
* **Dashboard unificado**: Consumo de endpoints en paralelo con `Promise.all`.
