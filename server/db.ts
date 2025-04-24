import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Detecção automática do ambiente para usar a string de conexão apropriada
// Em ambiente de desenvolvimento local, usa a string fixa
// Em produção (Replit), usa a variável de ambiente DATABASE_URL
const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
const connectionString = isReplit
  ? process.env.DATABASE_URL
  : 'postgresql://postgres:admin@localhost:5432/hlg_fitness';

console.log(`Ambiente detectado: ${isReplit ? 'Replit (produção)' : 'Local (desenvolvimento)'}`);
console.log("Testando conexão com o banco de dados PostgreSQL...");

// Criar pool de conexão
const pool = new Pool({ 
  connectionString,
  // Em ambiente Replit, usa SSL
  ssl: isReplit ? { rejectUnauthorized: false } : false
});

// Testar a conexão
pool.query("SELECT 1 as test")
  .then(() => {
    console.log("✓ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!");
  })
  .catch(err => {
    console.error("✗ Erro ao conectar ao banco de dados:", err.message);
    console.error("String de conexão:", connectionString?.replace(/:[^:]*@/, ':***@')); // Esconde a senha
    console.error("Verifique se o PostgreSQL está em execução e a string de conexão está correta.");
  });

// Adicionar handler para suporte a PDF
const originalEnd = pool.end.bind(pool);
pool.end = async function() {
  // Aguardar operações pendentes antes de encerrar
  await new Promise(resolve => setTimeout(resolve, 100));
  return originalEnd();
};

// Exportar instância do drizzle e o pool
export const db = drizzle(pool, { schema });
export { pool };
