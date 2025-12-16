#!/bin/bash

# 🚀 Script de migración de base de datos
# Este script automatiza: generate, migrate, seed

set -e  # Salir si hay algún error

echo "🎯 Iniciando proceso de migración..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Generar cliente de Prisma
echo -e "${BLUE}📦 Paso 1/4: Generando cliente de Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Cliente generado${NC}"
echo ""

# 2. Aplicar migraciones
echo -e "${BLUE}🔄 Paso 2/4: Aplicando migraciones...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
echo ""

# 3. Verificar estado de la base de datos
echo -e "${BLUE}🔍 Paso 3/4: Verificando estado...${NC}"
npx prisma migrate status
echo ""

# 4. Preguntar si desea ejecutar seed (opcional)
echo -e "${YELLOW}🌱 Paso 4/4: ¿Deseas ejecutar el seed? (s/n)${NC}"
read -p "Respuesta: " answer

if [ "$answer" = "s" ] || [ "$answer" = "S" ]; then
    echo -e "${BLUE}🌱 Ejecutando seed...${NC}"
    npm run db:seed
    echo -e "${GREEN}✅ Seed completado${NC}"
else
    echo -e "${YELLOW}⏭️  Seed omitido${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ¡Migración completada exitosamente!${NC}"
echo ""
echo "Comandos útiles:"
echo "  - Ver base de datos: npm run db:studio"
echo "  - Crear migración: npx prisma migrate dev --name nombre_migracion"
echo "  - Resetear DB: npx prisma migrate reset"
