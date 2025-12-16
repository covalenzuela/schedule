#!/usr/bin/env node

/**
 * 🚀 Script de migración de base de datos (Node.js)
 * Este script automatiza: generate, migrate deploy, seed (opcional)
 */

import { execSync } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, description) {
  log(`\n${description}`, colors.blue);
  try {
    execSync(command, { stdio: "inherit" });
    log("✅ Completado", colors.green);
    return true;
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.reset);
    return false;
  }
}

async function main() {
  log("🎯 Iniciando proceso de migración...", colors.blue);

  // 1. Generar cliente
  if (
    !exec("npx prisma generate", "📦 Paso 1/4: Generando cliente de Prisma...")
  ) {
    process.exit(1);
  }

  // 2. Aplicar migraciones
  if (
    !exec("npx prisma migrate deploy", "🔄 Paso 2/4: Aplicando migraciones...")
  ) {
    process.exit(1);
  }

  // 3. Verificar estado
  exec("npx prisma migrate status", "🔍 Paso 3/4: Verificando estado...");

  // 4. Preguntar por seed
  log("\n🌱 Paso 4/4: ¿Deseas ejecutar el seed? (s/n)", colors.yellow);

  rl.question("Respuesta: ", (answer) => {
    if (answer.toLowerCase() === "s") {
      exec("npm run db:seed", "🌱 Ejecutando seed...");
    } else {
      log("⏭️  Seed omitido", colors.yellow);
    }

    log("\n🎉 ¡Migración completada exitosamente!", colors.green);
    log("\nComandos útiles:");
    log("  - Ver base de datos: npm run db:studio");
    log("  - Crear migración: npx prisma migrate dev --name nombre_migracion");
    log("  - Resetear DB: npx prisma migrate reset");

    rl.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
