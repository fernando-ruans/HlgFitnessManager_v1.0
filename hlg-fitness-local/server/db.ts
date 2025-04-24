import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Versão para desenvolvimento local sem necessidade de banco de dados
// Esta configuração usa um mock do pool para compatibilidade com o código existente
// mas não realiza conexões reais ao banco de dados

// Mock connection string para compatibilidade
const devConnectionString = "postgresql://localdev:localdev@localhost:5432/hlg_fitness_dev";

// Criar um pool mockado que não tenta se conectar ao banco
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || devConnectionString,
  // Em modo de desenvolvimento local, evitamos conexões reais
  max: 0, 
  idleTimeoutMillis: 0
});

export const db = drizzle({ client: pool, schema });
