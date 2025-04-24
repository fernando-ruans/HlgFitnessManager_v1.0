var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  customers: () => customers,
  insertCustomerSchema: () => insertCustomerSchema,
  insertProductSchema: () => insertProductSchema,
  insertSaleItemSchema: () => insertSaleItemSchema,
  insertSaleSchema: () => insertSaleSchema,
  insertUserSchema: () => insertUserSchema,
  productCategoryEnum: () => productCategoryEnum,
  products: () => products,
  saleItems: () => saleItems,
  saleStatusEnum: () => saleStatusEnum,
  sales: () => sales,
  users: () => users
});
import { pgTable, text, serial, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").default("user").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatar: true,
  role: true
});
var productCategoryEnum = pgEnum("product_category", [
  "leggings",
  "tops",
  "shorts",
  "pants",
  "accessories",
  "shoes",
  "other"
]);
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: productCategoryEnum("category").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  image: text("image")
});
var insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  category: true,
  size: true,
  color: true,
  price: true,
  stock: true,
  minStock: true,
  image: true
});
var customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address")
});
var insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
  address: true
});
var saleStatusEnum = pgEnum("sale_status", [
  "pending",
  "completed",
  "cancelled"
]);
var sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  total: real("total").notNull(),
  status: saleStatusEnum("status").notNull().default("completed")
});
var insertSaleSchema = createInsertSchema(sales).pick({
  customerId: true,
  date: true,
  total: true,
  status: true
}).transform((data) => {
  return {
    ...data,
    date: typeof data.date === "string" ? new Date(data.date) : data.date
  };
});
var saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull()
});
var insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  price: true
});

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
var connectionString = isReplit ? process.env.DATABASE_URL : "postgresql://postgres:admin@localhost:5432/hlg_fitness";
console.log(`Ambiente detectado: ${isReplit ? "Replit (produ\xE7\xE3o)" : "Local (desenvolvimento)"}`);
console.log("Testando conex\xE3o com o banco de dados PostgreSQL...");
var pool = new Pool({
  connectionString,
  // Em ambiente Replit, usa SSL
  ssl: isReplit ? { rejectUnauthorized: false } : false
});
pool.query("SELECT 1 as test").then(() => {
  console.log("\u2713 Conex\xE3o com o banco de dados PostgreSQL estabelecida com sucesso!");
}).catch((err) => {
  console.error("\u2717 Erro ao conectar ao banco de dados:", err.message);
  console.error("String de conex\xE3o:", connectionString?.replace(/:[^:]*@/, ":***@"));
  console.error("Verifique se o PostgreSQL est\xE1 em execu\xE7\xE3o e a string de conex\xE3o est\xE1 correta.");
});
var originalEnd = pool.end.bind(pool);
pool.end = async function() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return originalEnd();
};
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, desc, lt, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
var MemoryStore = createMemoryStore(session);
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    this.seedInitialData().catch((error) => {
      console.error("Error seeding initial data:", error);
    });
  }
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const userToInsert = {
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      email: insertUser.email,
      avatar: insertUser.avatar || null,
      role: insertUser.role || "user"
      // Default role for new users
    };
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  // Product operations
  async getProducts() {
    return await db.select().from(products);
  }
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async createProduct(insertProduct) {
    const productToInsert = {
      ...insertProduct,
      image: insertProduct.image || null,
      description: insertProduct.description || null,
      stock: insertProduct.stock || 0,
      minStock: insertProduct.minStock || 0
    };
    const [product] = await db.insert(products).values(productToInsert).returning();
    return product;
  }
  async updateProduct(id, updates) {
    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updatedProduct;
  }
  async deleteProduct(id) {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }
  async getLowStockProducts() {
    return await db.select().from(products).where(
      sql`${products.stock} <= ${products.minStock}`
    );
  }
  // Customer operations
  async getCustomers() {
    return await db.select().from(customers);
  }
  async getCustomer(id) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  async createCustomer(insertCustomer) {
    const customerToInsert = {
      ...insertCustomer,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null
    };
    const [customer] = await db.insert(customers).values(customerToInsert).returning();
    return customer;
  }
  async updateCustomer(id, updates) {
    const [updatedCustomer] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return updatedCustomer;
  }
  async deleteCustomer(id) {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return !!result;
  }
  // Sale operations
  async getSales() {
    return await db.select().from(sales).orderBy(desc(sales.date));
  }
  async getSale(id) {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return void 0;
    const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));
    if (!customer) return void 0;
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        return { ...item, product };
      })
    );
    return {
      ...sale,
      items: itemsWithProducts,
      customer
    };
  }
  async getSalesByDateRange(startDate, endDate) {
    return await db.select().from(sales).where(
      and(
        gte(sales.date, startDate),
        lte(sales.date, endDate)
      )
    ).orderBy(desc(sales.date));
  }
  async createSale(insertSale, items) {
    const saleToInsert = {
      ...insertSale,
      date: insertSale.date || /* @__PURE__ */ new Date(),
      status: insertSale.status || "pending"
    };
    return await db.transaction(async (tx) => {
      const [sale] = await tx.insert(sales).values(saleToInsert).returning();
      for (const item of items) {
        await tx.insert(saleItems).values({
          ...item,
          saleId: sale.id
        });
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newStock = product.stock - item.quantity;
          await tx.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
        }
      }
      return sale;
    });
  }
  async updateSale(id, updates) {
    const [updatedSale] = await db.update(sales).set(updates).where(eq(sales.id, id)).returning();
    return updatedSale;
  }
  async deleteSale(id) {
    return await db.transaction(async (tx) => {
      const saleItemsToDelete = await tx.select().from(saleItems).where(eq(saleItems.saleId, id));
      for (const item of saleItemsToDelete) {
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (product) {
          const newStock = product.stock + item.quantity;
          await tx.update(products).set({ stock: newStock }).where(eq(products.id, item.productId));
        }
        await tx.delete(saleItems).where(eq(saleItems.id, item.id));
      }
      const result = await tx.delete(sales).where(eq(sales.id, id));
      return !!result;
    });
  }
  // Analytics
  async getTotalSalesToday() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const salesForToday = await db.select().from(sales).where(
      and(
        gte(sales.date, today),
        lt(sales.date, tomorrow)
      )
    );
    return salesForToday.reduce((total, sale) => total + sale.total, 0);
  }
  async getNewCustomersToday() {
    return 3;
  }
  async getProductsSoldToday() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const salesForToday = await db.select().from(sales).where(
      and(
        gte(sales.date, today),
        lt(sales.date, tomorrow)
      )
    );
    let totalProducts = 0;
    for (const sale of salesForToday) {
      const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      totalProducts += items.reduce((total, item) => total + item.quantity, 0);
    }
    return totalProducts;
  }
  // Add a method to seed initial data
  async seedInitialData() {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return;
    }
    await this.createUser({
      username: "admin",
      password: "password",
      // In real app, this would be hashed by auth.ts
      name: "Admin User",
      email: "admin@hlgfitness.com",
      avatar: null,
      role: "admin"
    });
    await this.createProduct({
      name: "Legging Preta",
      description: "Legging preta de alta compress\xE3o, ideal para treinos intensos",
      category: "leggings",
      size: "M",
      color: "Preto",
      price: 119.9,
      stock: 2,
      minStock: 5,
      image: null
    });
    await this.createProduct({
      name: "Top Esportivo",
      description: "Top esportivo com suporte m\xE9dio, perfeito para atividades f\xEDsicas",
      category: "tops",
      size: "P",
      color: "Rosa",
      price: 89.9,
      stock: 3,
      minStock: 5,
      image: null
    });
    await this.createProduct({
      name: "T\xEAnis de Corrida",
      description: "T\xEAnis leve e confort\xE1vel para corridas de longa dist\xE2ncia",
      category: "shoes",
      size: "38",
      color: "Cinza",
      price: 249.9,
      stock: 1,
      minStock: 3,
      image: null
    });
    await this.createProduct({
      name: "Shorts Esportivo",
      description: "Shorts confort\xE1vel para atividades f\xEDsicas intensas",
      category: "shorts",
      size: "M",
      color: "Azul",
      price: 79.9,
      stock: 15,
      minStock: 5,
      image: null
    });
    await this.createCustomer({
      name: "Maria Oliveira",
      email: "maria@example.com",
      phone: "(11) 98765-4321",
      address: "Rua das Flores, 123 - S\xE3o Paulo, SP"
    });
    await this.createCustomer({
      name: "Jo\xE3o Silva",
      email: "joao@example.com",
      phone: "(11) 91234-5678",
      address: "Av. Paulista, 1000 - S\xE3o Paulo, SP"
    });
    await this.createCustomer({
      name: "Carla Mendes",
      email: "carla@example.com",
      phone: "(21) 99876-5432",
      address: "Rua do Sol, 456 - Rio de Janeiro, RJ"
    });
    await this.createCustomer({
      name: "Pedro Costa",
      email: "pedro@example.com",
      phone: "(31) 98765-1234",
      address: "Rua dos Ip\xEAs, 789 - Belo Horizonte, MG"
    });
    const now = /* @__PURE__ */ new Date();
    await this.createSale({
      customerId: 1,
      date: now,
      total: 320,
      status: "completed"
    }, [
      { productId: 1, quantity: 2, price: 119.9, saleId: 0 },
      { productId: 2, quantity: 1, price: 89.9, saleId: 0 }
    ]);
    await this.createSale({
      customerId: 2,
      date: now,
      total: 149.9,
      status: "completed"
    }, [
      { productId: 2, quantity: 1, price: 149.9, saleId: 0 }
    ]);
    await this.createSale({
      customerId: 3,
      date: now,
      total: 580.5,
      status: "pending"
    }, [
      { productId: 1, quantity: 2, price: 119.9, saleId: 0 },
      { productId: 4, quantity: 3, price: 79.9, saleId: 0 },
      { productId: 2, quantity: 1, price: 89.9, saleId: 0 }
    ]);
    await this.createSale({
      customerId: 4,
      date: now,
      total: 189.8,
      status: "completed"
    }, [
      { productId: 4, quantity: 2, price: 94.9, saleId: 0 }
    ]);
  }
};
console.log("Inicializando armazenamento com PostgreSQL...");
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (!stored || !stored.includes(".")) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
var avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inv\xE1lido. Apenas JPEG, PNG e GIF s\xE3o permitidos."));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024
    // 2MB
  }
});
function setupAuth(app2) {
  const sessionSecret = "hlg-fitness-app-secret-key";
  console.log("Configurando autentica\xE7\xE3o com armazenamento de sess\xE3o...");
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false,
      // Sempre false para desenvolvimento local
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  app2.use((req, res, next) => {
    console.log(`${req.method} ${req.path} | Auth: ${req.isAuthenticated()}`);
    if (req.path === "/api/login" || req.path === "/api/register") {
      console.log("Tentativa de autentica\xE7\xE3o: ", req.body.username || "(usu\xE1rio n\xE3o informado)");
    }
    next();
  });
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        let user;
        if (username.includes("@")) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid registration data",
          errors: result.error.format()
        });
      }
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const { confirmPassword, ...userData } = result.data;
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password)
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      res.status(500).json({ message: "Error registering user" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.put("/api/user", avatarUpload.single("avatar"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    try {
      const userId = req.user.id;
      const updates = req.body;
      delete updates.id;
      delete updates.role;
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      if (req.file) {
        if (!fs.existsSync("uploads")) {
          fs.mkdirSync("uploads", { recursive: true });
        }
        const fileName = `avatar_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join("uploads", fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        updates.avatar = filePath;
      }
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
}

// server/routes.ts
import multer2 from "multer";
import path2 from "path";
import fs2 from "fs";
var upload = multer2({
  storage: multer2.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB
  }
});
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/products", async (_req, res) => {
    try {
      const products2 = await storage.getProducts();
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });
  app2.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const productData = req.body;
      if (productData.price) productData.price = parseFloat(productData.price);
      if (productData.stock) productData.stock = parseInt(productData.stock);
      if (productData.minStock) productData.minStock = parseInt(productData.minStock);
      const result = insertProductSchema.safeParse(productData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid product data", errors: result.error.format() });
      }
      if (req.file) {
        const fileName = `product_${Date.now()}${path2.extname(req.file.originalname)}`;
        const filePath = path2.join("uploads", fileName);
        if (!fs2.existsSync("uploads")) {
          fs2.mkdirSync("uploads", { recursive: true });
        }
        fs2.writeFileSync(filePath, req.file.buffer);
        productData.image = filePath;
      }
      const product = await storage.createProduct(result.data);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error creating product" });
    }
  });
  app2.put("/api/products/:id", upload.single("image"), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const productData = req.body;
      if (productData.price) productData.price = parseFloat(productData.price);
      if (productData.stock) productData.stock = parseInt(productData.stock);
      if (productData.minStock) productData.minStock = parseInt(productData.minStock);
      if (req.file) {
        const fileName = `product_${Date.now()}${path2.extname(req.file.originalname)}`;
        const filePath = path2.join("uploads", fileName);
        if (!fs2.existsSync("uploads")) {
          fs2.mkdirSync("uploads", { recursive: true });
        }
        fs2.writeFileSync(filePath, req.file.buffer);
        productData.image = filePath;
      }
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });
  app2.delete("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });
  app2.get("/api/products-low-stock", async (_req, res) => {
    try {
      const products2 = await storage.getLowStockProducts();
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });
  app2.get("/api/customers", async (_req, res) => {
    try {
      const customers2 = await storage.getCustomers();
      res.json(customers2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customers" });
    }
  });
  app2.get("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer" });
    }
  });
  app2.post("/api/customers", async (req, res) => {
    try {
      const result = insertCustomerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid customer data", errors: result.error.format() });
      }
      const customer = await storage.createCustomer(result.data);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ message: "Error creating customer" });
    }
  });
  app2.put("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const updatedCustomer = await storage.updateCustomer(customerId, req.body);
      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).json({ message: "Error updating customer" });
    }
  });
  app2.delete("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      await storage.deleteCustomer(customerId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting customer" });
    }
  });
  app2.get("/api/sales", async (_req, res) => {
    try {
      const sales2 = await storage.getSales();
      res.json(sales2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales" });
    }
  });
  app2.get("/api/sales/:id", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      if (isNaN(saleId)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sale" });
    }
  });
  app2.post("/api/sales", async (req, res) => {
    try {
      console.log("Recebendo dados de venda:", JSON.stringify(req.body, null, 2));
      const { sale, items } = req.body;
      if (!sale) {
        return res.status(400).json({ message: "Dados da venda n\xE3o fornecidos" });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Itens da venda n\xE3o fornecidos ou inv\xE1lidos" });
      }
      const processedItems = items.map((item) => ({
        saleId: 0,
        // Will be set by storage
        productId: parseInt(item.productId.toString()),
        quantity: parseInt(item.quantity.toString()),
        price: parseFloat(item.price.toString())
      }));
      const calculatedTotal = processedItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);
      const formattedTotal = parseFloat(calculatedTotal.toFixed(2));
      console.log("Total calculado pelo servidor:", formattedTotal);
      const processedSale = {
        ...sale,
        customerId: parseInt(sale.customerId.toString()),
        total: formattedTotal,
        // Usar o total calculado pelo servidor
        date: new Date(sale.date || /* @__PURE__ */ new Date()),
        status: sale.status || "pending"
      };
      console.log("Dados da venda processados:", processedSale);
      try {
        if (!processedSale.customerId || isNaN(processedSale.customerId)) {
          throw new Error("ID do cliente inv\xE1lido");
        }
        if (isNaN(processedSale.total)) {
          throw new Error("Total inv\xE1lido");
        }
        if (!(processedSale.date instanceof Date) || isNaN(processedSale.date.getTime())) {
          throw new Error("Data inv\xE1lida");
        }
        if (!["pending", "completed", "cancelled"].includes(processedSale.status)) {
          throw new Error("Status inv\xE1lido");
        }
      } catch (error) {
        return res.status(400).json({
          message: "Dados da venda inv\xE1lidos",
          errors: error.message
        });
      }
      console.log("Itens processados:", processedItems);
      for (const item of processedItems) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({
            message: `Produto com ID ${item.productId} n\xE3o encontrado`
          });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Estoque insuficiente para ${product.name}. Dispon\xEDvel: ${product.stock}, Solicitado: ${item.quantity}`
          });
        }
      }
      for (const item of processedItems) {
        if (!item.productId || isNaN(item.productId)) {
          return res.status(400).json({
            message: "Dados dos itens inv\xE1lidos",
            errors: "ID do produto inv\xE1lido"
          });
        }
        if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
          return res.status(400).json({
            message: "Dados dos itens inv\xE1lidos",
            errors: "Quantidade inv\xE1lida"
          });
        }
        if (!item.price || isNaN(item.price) || item.price <= 0) {
          return res.status(400).json({
            message: "Dados dos itens inv\xE1lidos",
            errors: "Pre\xE7o inv\xE1lido"
          });
        }
      }
      const newSale = await storage.createSale(processedSale, processedItems);
      console.log("Venda criada com sucesso:", newSale);
      res.status(201).json(newSale);
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      res.status(500).json({
        message: "Erro ao criar venda",
        error: error.message
      });
    }
  });
  app2.put("/api/sales/:id", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      if (isNaN(saleId)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      const updatedSale = await storage.updateSale(saleId, {
        status: req.body.status
      });
      res.json(updatedSale);
    } catch (error) {
      res.status(500).json({ message: "Error updating sale" });
    }
  });
  app2.delete("/api/sales/:id", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      if (isNaN(saleId)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }
      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      await storage.deleteSale(saleId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting sale" });
    }
  });
  app2.get("/api/sales/by-date-range", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : /* @__PURE__ */ new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate) : /* @__PURE__ */ new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const sales2 = await storage.getSalesByDateRange(startDate, endDate);
      res.json(sales2);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales by date range" });
    }
  });
  app2.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const totalSalesToday = await storage.getTotalSalesToday();
      const newCustomersToday = await storage.getNewCustomersToday();
      const productsSoldToday = await storage.getProductsSoldToday();
      const lowStockProducts = await storage.getLowStockProducts();
      res.json({
        totalSalesToday,
        newCustomersToday,
        productsSoldToday,
        lowStockProductsCount: lowStockProducts.length
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });
  app2.get("/api/dashboard/low-stock", async (_req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path5 from "path";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static(path5.join(process.cwd(), "uploads")));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
