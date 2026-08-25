# Social Debt Frontend Model

Una interfaz de usuario moderna e interactiva diseñada para detectar, clasificar y visualizar la **Deuda Social** (_Social Debt_) en conversaciones, discusiones de código y comunidades de desarrollo de software.

Este proyecto actúa como el front-end principal para un modelo de clasificación, proporcionando herramientas visuales para análisis tanto de texto individual como de conjuntos de datos (datasets) masivos mediante archivos `.csv` y `.xlsx`.

## 🚀 Características Principales

- 💬 **Interfaz de Chat Interactiva:** Analiza comentarios de texto individualmente para detectar macrocausas, microcausas, riesgos de deuda social y _community smells_.
- 📊 **Procesamiento en Lote (Batch):** Sube archivos `.csv` o `.xlsx` estructurados para clasificar cientos de comentarios a la vez.
- 📈 **Dashboard de Métricas Avanzado:** Visualiza la distribución de macrocausas, el Índice de Deuda Social (SDI) y métricas de diversidad generadas a partir de tus datasets mediante gráficos interactivos.
- 🗂️ **Historial Local:** Todo tu historial de análisis e interacciones se guarda localmente en el navegador usando IndexedDB, preservando la privacidad y disponibilidad offline.
- 🎨 **Diseño Moderno (Glassmorphism):** Desarrollado con una estética rica, animaciones fluidas, menús responsivos y compatibilidad multiplataforma (Mobile & PC).

## 🛠️ Stack Tecnológico

- **Framework Core:** [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Visualización de Datos:** [Recharts](https://recharts.org/)
- **Procesamiento de Archivos:** [PapaParse](https://www.papaparse.com/) (CSV) y [SheetJS / xlsx](https://sheetjs.com/) (Excel)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Almacenamiento Local:** `idb-keyval` (IndexedDB)

## 📦 Estructura del Proyecto

```text
src/
├── app/                  # Layout y Rutas principales de Next.js (App Router)
├── features/             # Módulos por dominio
│   ├── chat-interface/       # Componentes visuales del Chat, Sidebar, Modales
│   ├── batch-classification/ # Lógica visual y reportes de procesamiento en lote
│   ├── metrics-dashboard/    # El Dashboard (BatchDashboard) con gráficos
│   ├── ontology/             # Diccionario y mapas de color de la ontología
│   └── file-validation/      # Hooks para validar datasets
├── lib/                  # Utilidades compartidas (Ej: IndexedDB config)
```

## ⚙️ Requisitos Previos

- Node.js 18.x o superior.
- Gestor de paquetes `npm` (o `yarn` / `pnpm`).

## 🚀 Empezando (Getting Started)

1. **Clona el repositorio** e ingresa al directorio:

   ```bash
   git clone <url-del-repositorio>
   cd social-debt-frontend-model
   ```

2. **Instala las dependencias**:

   ```bash
   npm install
   ```

3. **Configura las variables de entorno** (si aplica):
   Crea un archivo `.env.local` en la raíz del proyecto para definir variables clave, por ejemplo, URIs de la API de backend:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

4. **Inicia el servidor de desarrollo**:

   ```bash
   npm run dev
   ```

5. **Abre el proyecto**: Navega a [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📜 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

- `npm run dev`: Ejecuta la app en modo desarrollo.
- `npm run build`: Compila la aplicación para producción de forma optimizada.
- `npm run start`: Inicia el servidor de producción previamente compilado.
- `npm run lint`: Evalúa el código usando ESLint para asegurar su calidad.
- `npx prettier --write .`: Formatea automáticamente todo el código fuente del proyecto.
