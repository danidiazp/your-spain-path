# Ruta a España

**Plataforma digital de orientación migratoria** para personas que quieren mudarse a España. Convierte la información dispersa de las administraciones públicas en un plan claro, paso a paso, con checklist documental, tiempos orientativos y recursos oficiales.

> No somos un despacho legal ni prometemos resultados. Acompañamos. Cada caso depende del expediente y la administración competente. La plataforma no sustituye asesoramiento jurídico individual.

## Producto

- **Diagnóstico personalizado** en menos de 2 minutos.
- **Recomendación de ruta principal + 2 alternativas** con viabilidad, dificultad y tiempos orientativos.
- **Dashboard** con estado del caso, próximo paso, checklist documental, timeline y recursos oficiales.
- **Tareas personales persistentes** vinculadas a la ruta elegida.
- **Rutas cubiertas en v1**: Estudios · Trabajo (cuenta ajena) · Reagrupación familiar.

## Stack técnico

- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **UI**: Tailwind CSS v3 + shadcn/ui + framer-motion
- **3D**: react-globe.gl (lazy + condicional para móvil)
- **Backend**: Lovable Cloud (Supabase) — Postgres con RLS, Auth, Edge Functions
- **Estado**: TanStack Query, hook `useAuth` con sesión persistida
- **Validación**: zod (donde aplica)

## Estructura del proyecto

```
src/
├── components/        # Header, Footer, HeroGlobe, ProtectedRoute, LegalDisclaimer, ui/*
├── hooks/             # useAuth, use-toast, use-mobile
├── integrations/
│   └── supabase/      # client + types (auto-generados, no editar)
├── lib/
│   ├── wizard.ts      # Motor de recomendación + tipos
│   ├── storage.ts     # localStorage + persistAssessment() en Supabase
│   └── utils.ts
├── pages/
│   ├── Index.tsx          # Landing con globo 3D
│   ├── Onboarding.tsx     # Wizard 8 preguntas
│   ├── Results.tsx        # Recomendación + alternativas
│   ├── Auth.tsx           # Login / signup
│   ├── Dashboard.tsx      # Panel privado
│   ├── RouteDetail.tsx    # Detalle público de cada ruta
│   ├── Resources.tsx      # Biblioteca de recursos oficiales
│   ├── Profile.tsx        # Edición perfil
│   └── NotFound.tsx
└── index.css          # Design system (HSL tokens)

supabase/
├── config.toml
└── migrations/        # Esquema y RLS (no editar manualmente)
```

## Páginas principales

| Ruta | Descripción | Acceso |
|------|-------------|--------|
| `/` | Landing con hero, cómo funciona y preview de rutas | Público |
| `/diagnostico` | Wizard de 8 preguntas con persistencia local | Público |
| `/resultados` | Ruta principal + 2 alternativas con viabilidad | Público |
| `/auth` | Login / registro | Público |
| `/rutas/:slug` | Detalle público de una ruta | Público |
| `/recursos` | Biblioteca de recursos oficiales | Público |
| `/dashboard` | Estado del caso, próximo paso, checklist, timeline | Privado |
| `/perfil` | Editar perfil personal | Privado |

## Modelo de datos

- `profiles` — perfil del usuario (1:1 con `auth.users`)
- `migration_routes` — rutas migratorias publicadas
- `route_steps` — pasos secuenciales de cada ruta
- `route_documents` — documentos requeridos por ruta
- `assessment_results` — diagnósticos guardados del usuario
- `user_tasks` — tareas personales persistentes
- `resources` — recursos oficiales (enlaces, instituciones)

Todas las tablas tienen **RLS activado**. Los datos personales (`profiles`, `assessment_results`, `user_tasks`) están restringidos por `auth.uid()`. El catálogo (`migration_routes`, `route_steps`, `route_documents`, `resources`) es de lectura pública.

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev          # http://localhost:8080

# Build
npm run build
npm run preview

# Tests
npm test
```

> Las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) se gestionan automáticamente por Lovable Cloud.

## Posicionamiento legal

- Toda recomendación es **orientativa**, no asesoramiento jurídico individual.
- Cada decisión administrativa depende del expediente concreto y de la administración competente.
- Las fuentes oficiales se enlazan directamente: Ministerio de Asuntos Exteriores, Portal de Inmigración, Sede Electrónica de Administraciones Públicas, Policía Nacional, Ministerio de Justicia.

## Contribuir

Editar contenido de rutas, documentos o recursos requiere migración SQL en `supabase/migrations/`. Para cambios de UI, los componentes son modulares y siguen el design system declarado en `src/index.css` y `tailwind.config.ts`.
