--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: product_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_category AS ENUM (
    'leggings',
    'tops',
    'shorts',
    'pants',
    'accessories',
    'shoes',
    'other'
);


--
-- Name: sale_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sale_status AS ENUM (
    'pending',
    'completed',
    'cancelled'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text
);


--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    category public.product_category NOT NULL,
    size text NOT NULL,
    color text NOT NULL,
    price real NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 5 NOT NULL,
    image text
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price real NOT NULL
);


--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    total real NOT NULL,
    status public.sale_status DEFAULT 'completed'::public.sale_status NOT NULL
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    avatar text,
    role text DEFAULT 'user'::text NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, email, phone, address) FROM stdin;
1       Maria Oliveira  maria@example.com       (11) 98765-4321 Rua das Flores, 123 - São Paulo, SP
2       João Silva      joao@example.com        (11) 91234-5678 Av. Paulista, 1000 - São Paulo, SP
3       Carla Mendes    carla@example.com       (21) 99876-5432 Rua do Sol, 456 - Rio de Janeiro, RJ
4       Pedro Costa     pedro@example.com       (31) 98765-1234 Rua dos Ipês, 789 - Belo Horizonte, MG
5       Geruza Caloteira        gera@mail.com   77 9 8898-9989  Rua dos Calotes 568
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, description, category, size, color, price, stock, min_stock, image) FROM stdin;
4       Shorts Esportivo        Shorts confortável para atividades físicas intensas     shorts  M       Azul    79.9    15      5       \N
3       Tênis de Corrida        Tênis leve e confortável para corridas de longa distância       shoes   38      Cinza   249.9   4       4       uploads/product_1745309572436.jpg
1       Legging Preta   Legging preta de alta compressão, ideal para treinos intensos   leggings        M       Preto   119.9   1       5       \N
2       Top Esportivo   Top esportivo com suporte médio, perfeito para atividades físicas       tops    P       Rosa    89.9    2       5       \N
5               legging pants   M       Rosa    200     4       2       uploads/product_1745308464536.jpg
6       Leg de dança    leg     tops    M       preta   150     3       5       uploads/product_1745445160765.jpg
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sale_items (id, sale_id, product_id, quantity, price) FROM stdin;
15      10      1       1       119.9
16      10      2       1       89.9
17      11      6       2       150
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, customer_id, date, total, status) FROM stdin;
10      4       2025-04-23 18:46:32.647 209.8   completed
11      5       2025-04-23 18:46:56.611 300     completed
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
CYZkzoTNLWsHGbr-ltPa_ijHv9stQm49        {"cookie":{"originalMaxAge":86400000,"expires":"2025-04-24T22:14:36.173Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":4}}     2025-04-24 22:18:34
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, name, email, avatar, role) FROM stdin;
1       admin   password        Admin User      admin@hlgfitness.com    \N      admin
2       admin2  09e510c304baa840b46c44ea46dac45d7baeaf23693ffe9a4f1f84ee91352056dd9aba12c15acc33b26de4363ef0632cb147fc998f97f8cdad5a6b3cd445183e.ca377faedbc0b2cfe10ce1aa2c7e3d2a       Admin User      admin2@hlgfitness.com   \N      user
4       test    7ea3b9023366f4f5cd60c4d56b72d0e72bcf66fb1ddb844ea4c17aae1edc4ca878d7daccc1261929c0511dfc1a52203a9bffd4b297a6f0eeec6f41f835d7d7d7.35b43625c3cd11b2ef808291a86c7e67       test    test@test.com   uploads/avatar_4_1745432377009.jpg      user
\.


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customers_id_seq', 5, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 6, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 17, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
--
-- Criar índices adicionais para melhorar performance
--
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items USING btree (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items USING btree (product_id);

--
-- Funções e triggers para gerenciamento automático de estoque
--

-- Função para atualizar o estoque após uma venda
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Atualizar o estoque do produto
  UPDATE public.products 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$function$;

-- Trigger para atualizar o estoque
DROP TRIGGER IF EXISTS trigger_update_stock_after_sale ON public.sale_items;
CREATE TRIGGER trigger_update_stock_after_sale
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_stock_after_sale();

-- Função para verificar estoque baixo
CREATE OR REPLACE FUNCTION public.check_low_stock()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Verificar se o estoque está abaixo do mínimo
  IF NEW.stock <= NEW.min_stock THEN
    -- Em um sistema real, poderia enviar notificação ou email
    RAISE NOTICE 'Produto % está com estoque baixo: % unidades (mínimo: %)', 
      NEW.name, NEW.stock, NEW.min_stock;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger para verificar estoque baixo
DROP TRIGGER IF EXISTS trigger_check_low_stock ON public.products;
CREATE TRIGGER trigger_check_low_stock
AFTER UPDATE OF stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock();

--
-- View para relatórios de vendas
--
CREATE OR REPLACE VIEW public.view_sales_report AS
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
FROM public.sales s
JOIN public.customers c ON s.customer_id = c.id
JOIN public.sale_items si ON s.id = si.sale_id
GROUP BY s.id, c.id
ORDER BY s.date DESC;

-- PostgreSQL database dump complete
--

