# Lasac CRM — Guía de Setup

## 1. Instalar Node.js
Descargá la versión LTS desde https://nodejs.org e instalala.
Verificá con: `node -v` (debe mostrar v20 o v22)

## 2. Instalar dependencias
```bash
npm install
```

## 3. Crear cuenta en Supabase
1. Andá a https://supabase.com → "Start your project" → creá cuenta gratis
2. Creá un nuevo proyecto: nombre "lasac-crm", elegí una contraseña segura
3. Esperá ~2 minutos que se inicialice

## 4. Ejecutar el schema de base de datos
1. En Supabase, andá a **SQL Editor** (menú izquierdo)
2. Hacé click en "New query"
3. Copiá y pegá todo el contenido de `supabase/migrations/001_initial_schema.sql`
4. Hacé click en "Run"

## 5. Configurar variables de entorno
1. Copiá el archivo `.env.example` como `.env.local`
2. En Supabase → Settings → API, copiá:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
3. Completá los datos de Evolution API con tu servidor

## 6. Crear el primer usuario
1. En Supabase → Authentication → Users → "Add user"
2. Email: tu email, contraseña: la que quieras
3. Luego en SQL Editor ejecutá:
```sql
INSERT INTO public.users (id, full_name, email, role)
SELECT id, 'Tu Nombre', email, 'admin'
FROM auth.users
WHERE email = 'tu@email.com';
```

## 7. Correr el proyecto
```bash
npm run dev
```
Abrí http://localhost:3000 → te redirige a /login

## 8. Configurar webhook de WhatsApp (Evolution API)
En tu Evolution API, configurá el webhook de la instancia apuntando a:
```
https://crm.lasac.com.ar/api/whatsapp/webhook
```
Eventos a activar: `messages.upsert`

## 9. Deploy en Vercel
```bash
npm install -g vercel
vercel
```
Seguí los pasos, cargá las variables de entorno en el dashboard de Vercel.
Después configurá el dominio: crm.lasac.com.ar → apuntá el DNS a Vercel.
