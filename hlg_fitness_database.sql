-- Script SQL para importação do banco de dados HLG Fitness
-- Versão 1.0 - Abril 2025

-- Configurações iniciais
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remover tabelas existentes em caso de reimportação
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS sale_status;
DROP TYPE IF EXISTS product_category;

-- Criar tipos enumerados
CREATE TYPE product_category AS ENUM (
  'leggings',
  'tops',
  'shorts',
  'pants',
  'accessories',
  'shoes',
  'other'
);

CREATE TYPE sale_status AS ENUM (
  'pending',
  'completed',
  'cancelled'
);

-- Criar tabelas

-- Tabela de usuários
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Tabela de produtos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category product_category NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  image TEXT
);

-- Tabela de clientes
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT
);

-- Tabela de vendas
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL,
  status sale_status NOT NULL DEFAULT 'completed'
);

-- Tabela de itens de venda
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price REAL NOT NULL
);

-- Adicionar índices para melhorar performance
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

-- Inserir dados iniciais

-- Inserir usuário administrador
-- Senha: senha123 (já está com hash no formato usado pela aplicação)
INSERT INTO users (username, password, name, email, role) VALUES
('admin', '4bcfac1c9c61f72a8a4c8ab6db6d3e4a099a7df8b714d720ed821bcc4cfd9b5b2f3c63e52f46a0cea7ef9953da4de43e8f4a10d9a233593bfc85f72b2d6d92f9.b99b42f3bd9b9ce2', 'Admin User', 'admin@hlgfitness.com', 'admin');

-- Inserir produtos de exemplo
INSERT INTO products (name, description, category, size, color, price, stock, min_stock, image) VALUES
('Legging Preta', 'Legging preta de alta compressão, ideal para treinos intensos', 'leggings', 'M', 'Preto', 119.90, 15, 5, 'uploads/product_1745308464536.jpg'),
('Top Esportivo', 'Top esportivo com suporte médio, perfeito para atividades físicas', 'tops', 'P', 'Rosa', 89.90, 10, 5, 'uploads/product_1745309572436.jpg'),
('Tênis de Corrida', 'Tênis leve e confortável para corridas de longa distância', 'shoes', '38', 'Cinza', 249.90, 3, 3, NULL),
('Shorts Esportivo', 'Shorts confortável para atividades físicas intensas', 'shorts', 'M', 'Azul', 79.90, 20, 5, NULL),
('Calça de Moletom', 'Calça de moletom confortável para dias frios', 'pants', 'G', 'Cinza', 129.90, 8, 3, NULL),
('Boné Esportivo', 'Boné para proteger do sol durante atividades ao ar livre', 'accessories', 'Único', 'Preto', 49.90, 15, 5, NULL);

-- Inserir clientes de exemplo
INSERT INTO customers (name, email, phone, address) VALUES
('Maria Oliveira', 'maria@example.com', '(11) 98765-4321', 'Rua das Flores, 123 - São Paulo, SP'),
('João Silva', 'joao@example.com', '(11) 91234-5678', 'Av. Paulista, 1000 - São Paulo, SP'),
('Carla Mendes', 'carla@example.com', '(21) 99876-5432', 'Rua do Sol, 456 - Rio de Janeiro, RJ'),
('Pedro Costa', 'pedro@example.com', '(31) 98765-1234', 'Rua dos Ipês, 789 - Belo Horizonte, MG'),
('Fernanda Santos', 'fernanda@example.com', '(41) 97654-3210', 'Av. das Araucárias, 234 - Curitiba, PR');

-- Inserir vendas de exemplo
INSERT INTO sales (customer_id, date, total, status) VALUES
(1, CURRENT_TIMESTAMP - INTERVAL '2 day', 329.70, 'completed'),
(2, CURRENT_TIMESTAMP - INTERVAL '1 day', 249.90, 'completed'),
(3, CURRENT_TIMESTAMP, 339.60, 'pending'),
(4, CURRENT_TIMESTAMP, 159.80, 'completed');

-- Inserir itens das vendas
INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES
(1, 1, 2, 119.90), -- 2 Leggings para Maria
(1, 2, 1, 89.90),  -- 1 Top para Maria
(2, 3, 1, 249.90), -- 1 Tênis para João
(3, 1, 2, 119.90), -- 2 Leggings para Carla
(3, 4, 1, 79.90),  -- 1 Shorts para Carla
(3, 2, 1, 89.90),  -- 1 Top para Carla
(4, 4, 2, 79.90);  -- 2 Shorts para Pedro

-- Criar uma view para relatórios
CREATE OR REPLACE VIEW view_sales_report AS
SELECT 
  s.id as sale_id,
  s.date as sale_date,
  s.total as sale_total,
  s.status as sale_status,
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(si.id) as total_items,
  SUM(si.quantity) as total_quantity
FROM sales s
JOIN customers c ON s.customer_id = c.id
JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, c.id
ORDER BY s.date DESC;

-- Criar uma função para atualizar o estoque após uma venda
CREATE OR REPLACE FUNCTION update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o estoque do produto
  UPDATE products 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para atualizar o estoque
CREATE TRIGGER trigger_update_stock_after_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_sale();

-- Criar função para verificar estoque baixo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o estoque está abaixo do mínimo
  IF NEW.stock <= NEW.min_stock THEN
    -- Em um sistema real, poderia enviar notificação ou email
    RAISE NOTICE 'Produto % está com estoque baixo: % unidades (mínimo: %)', 
      NEW.name, NEW.stock, NEW.min_stock;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger para verificar estoque baixo
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION check_low_stock();

-- Conceder permissões
-- (Ajuste conforme necessário para seu ambiente)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seu_usuario;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;