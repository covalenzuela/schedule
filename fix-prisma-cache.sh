#!/bin/bash

# 🔧 Script de solución rápida para problemas de Prisma Client
# Regenera el cliente de Prisma y limpia el cache de Next.js

echo "🔧 Solucionando problemas de Prisma Client..."
echo ""

# 1. Regenerar cliente de Prisma
echo "📦 Regenerando cliente de Prisma..."
npx prisma generate

# 2. Sincronizar con la base de datos
echo ""
echo "🗄️  Sincronizando schema con la base de datos..."
npx prisma db push

# 3. Limpiar cache de Next.js
echo ""
echo "🧹 Limpiando cache de Next.js..."
rm -rf .next

# 4. Limpiar cache de node_modules/.cache
echo ""
echo "🧹 Limpiando cache de node_modules..."
rm -rf node_modules/.cache

echo ""
echo "✅ ¡Listo! Ahora reinicia el servidor de desarrollo:"
echo "   Presiona Ctrl+C en el terminal donde corre 'npm run dev'"
echo "   Luego ejecuta: npm run dev"
echo ""
