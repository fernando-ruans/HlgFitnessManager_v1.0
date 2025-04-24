import { users, products, customers, sales, saleItems, type User, type InsertUser, type InsertProduct, type Product, type InsertCustomer, type Customer, type InsertSale, type Sale, type InsertSaleItem, type SaleItem, type SaleWithItems } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, gte, lte, desc, lt, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(): Promise<Product[]>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Sale operations
  getSales(): Promise<Sale[]>;
  getSale(id: number): Promise<SaleWithItems | undefined>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<Sale>;
  updateSale(id: number, sale: Partial<Sale>): Promise<Sale | undefined>;
  deleteSale(id: number): Promise<boolean>;
  
  // Analytics
  getTotalSalesToday(): Promise<number>;
  getNewCustomersToday(): Promise<number>;
  getProductsSoldToday(): Promise<number>;
  
  // Session store
  sessionStore: any; // Fix for SessionStore type
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private sales: Map<number, Sale>;
  private saleItems: Map<number, SaleItem>;
  
  currentUserId: number;
  currentProductId: number;
  currentCustomerId: number;
  currentSaleId: number;
  currentSaleItemId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.sales = new Map();
    this.saleItems = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentCustomerId = 1;
    this.currentSaleId = 1;
    this.currentSaleItemId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Add a default admin user
    this.createUser({
      username: "admin",
      password: "senha123", // Senha mais fácil de lembrar
      name: "Admin User",
      email: "admin@hlgfitness.com",
      avatar: "",
    });
    
    // Seed with some initial data
    this.seedInitialData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, role: "user" };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.stock <= product.minStock
    );
  }
  
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  // Sale operations
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }
  
  async getSale(id: number): Promise<SaleWithItems | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const customer = await this.getCustomer(sale.customerId);
    if (!customer) return undefined;
    
    const saleItems = Array.from(this.saleItems.values()).filter(
      (item) => item.saleId === id
    );
    
    const itemsWithProducts = await Promise.all(
      saleItems.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return { ...item, product: product! };
      })
    );
    
    return {
      ...sale,
      items: itemsWithProducts,
      customer
    };
  }
  
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(
      (sale) => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      }
    );
  }
  
  async createSale(insertSale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    const id = this.currentSaleId++;
    const sale: Sale = { ...insertSale, id };
    this.sales.set(id, sale);
    
    // Create sale items and update product stock
    for (const item of items) {
      const itemId = this.currentSaleItemId++;
      const saleItem: SaleItem = { ...item, id: itemId, saleId: id };
      this.saleItems.set(itemId, saleItem);
      
      // Update product stock
      const product = await this.getProduct(item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        await this.updateProduct(product.id, { stock: newStock });
      }
    }
    
    return sale;
  }
  
  async updateSale(id: number, updates: Partial<Sale>): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const updatedSale = { ...sale, ...updates };
    this.sales.set(id, updatedSale);
    return updatedSale;
  }
  
  async deleteSale(id: number): Promise<boolean> {
    // Delete sale items first
    const saleItemsToDelete = Array.from(this.saleItems.values()).filter(
      (item) => item.saleId === id
    );
    
    for (const item of saleItemsToDelete) {
      this.saleItems.delete(item.id);
      
      // Restore product stock
      const product = await this.getProduct(item.productId);
      if (product) {
        const newStock = product.stock + item.quantity;
        await this.updateProduct(product.id, { stock: newStock });
      }
    }
    
    return this.sales.delete(id);
  }
  
  // Analytics
  async getTotalSalesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sales = Array.from(this.sales.values()).filter(
      (sale) => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      }
    );
    
    return sales.reduce((total, sale) => total + sale.total, 0);
  }
  
  async getNewCustomersToday(): Promise<number> {
    // In a real app, this would count customers created today
    // For this simple implementation, we'll return a static number
    return 5;
  }
  
  async getProductsSoldToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const salesToday = Array.from(this.sales.values()).filter(
      (sale) => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      }
    );
    
    let totalProducts = 0;
    for (const sale of salesToday) {
      const saleItems = Array.from(this.saleItems.values()).filter(
        (item) => item.saleId === sale.id
      );
      
      totalProducts += saleItems.reduce((total, item) => total + item.quantity, 0);
    }
    
    return totalProducts;
  }
  
  // Seed initial data for demo purposes
  private async seedInitialData() {
    // Add some products
    await this.createProduct({
      name: "Legging Preta",
      description: "Legging preta de alta compressão, ideal para treinos intensos",
      category: "leggings",
      size: "M",
      color: "Preto",
      price: 119.90,
      stock: 2,
      minStock: 5,
      image: "",
    });
    
    await this.createProduct({
      name: "Top Esportivo",
      description: "Top esportivo com suporte médio, perfeito para atividades físicas",
      category: "tops",
      size: "P",
      color: "Rosa",
      price: 89.90,
      stock: 3,
      minStock: 5,
      image: "",
    });
    
    await this.createProduct({
      name: "Tênis de Corrida",
      description: "Tênis leve e confortável para corridas de longa distância",
      category: "shoes",
      size: "38",
      color: "Cinza",
      price: 249.90,
      stock: 1,
      minStock: 3,
      image: "",
    });
    
    await this.createProduct({
      name: "Shorts Esportivo",
      description: "Shorts confortável para atividades físicas intensas",
      category: "shorts",
      size: "M",
      color: "Azul",
      price: 79.90,
      stock: 15,
      minStock: 5,
      image: "",
    });
    
    // Add some customers
    await this.createCustomer({
      name: "Maria Oliveira",
      email: "maria@example.com",
      phone: "(11) 98765-4321",
      address: "Rua das Flores, 123 - São Paulo, SP",
    });
    
    await this.createCustomer({
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 91234-5678",
      address: "Av. Paulista, 1000 - São Paulo, SP",
    });
    
    await this.createCustomer({
      name: "Carla Mendes",
      email: "carla@example.com",
      phone: "(21) 99876-5432",
      address: "Rua do Sol, 456 - Rio de Janeiro, RJ",
    });
    
    await this.createCustomer({
      name: "Pedro Costa",
      email: "pedro@example.com",
      phone: "(31) 98765-1234",
      address: "Rua dos Ipês, 789 - Belo Horizonte, MG",
    });
    
    // Add some sales
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Sale 1 - Maria
    const sale1 = await this.createSale({
      customerId: 1,
      date: now,
      total: 320,
      status: "completed",
    }, [
      { saleId: 0, productId: 1, quantity: 2, price: 119.90 },
      { saleId: 0, productId: 2, quantity: 1, price: 89.90 }
    ]);
    
    // Sale 2 - João
    const sale2 = await this.createSale({
      customerId: 2,
      date: now,
      total: 149.90,
      status: "completed",
    }, [
      { saleId: 0, productId: 2, quantity: 1, price: 149.90 }
    ]);
    
    // Sale 3 - Carla
    const sale3 = await this.createSale({
      customerId: 3,
      date: now,
      total: 580.50,
      status: "pending",
    }, [
      { saleId: 0, productId: 1, quantity: 2, price: 119.90 },
      { saleId: 0, productId: 4, quantity: 3, price: 79.90 },
      { saleId: 0, productId: 2, quantity: 1, price: 89.90 }
    ]);
    
    // Sale 4 - Pedro
    const sale4 = await this.createSale({
      customerId: 4,
      date: now,
      total: 189.80,
      status: "completed",
    }, [
      { saleId: 0, productId: 4, quantity: 2, price: 94.90 }
    ]);
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof PostgresSessionStore>;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Inicializar o banco de dados com dados de exemplo
    this.seedInitialData().catch(error => {
      console.error("Error seeding initial data:", error);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    // Ensure these fields have default values if not provided
    const userToInsert = {
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      email: insertUser.email,
      avatar: insertUser.avatar || null,
      role: insertUser.role || "user" // Default role for new users
    };
    
    const [user] = await db.insert(users).values(userToInsert).returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Ensure these fields have default values if not provided
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
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.stock} <= ${products.minStock}`
      );
  }
  
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    // Ensure these fields have default values if not provided
    const customerToInsert = {
      ...insertCustomer,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null
    };
    
    const [customer] = await db.insert(customers).values(customerToInsert).returning();
    return customer;
  }
  
  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return !!result;
  }
  
  // Sale operations
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.date));
  }
  
  async getSale(id: number): Promise<SaleWithItems | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;
    
    const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));
    if (!customer) return undefined;
    
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    
    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId));
        return { ...item, product: product! };
      })
    );
    
    return {
      ...sale,
      items: itemsWithProducts,
      customer
    };
  }
  
  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(
        and(
          gte(sales.date, startDate),
          lte(sales.date, endDate)
        )
      )
      .orderBy(desc(sales.date));
  }
  
  async createSale(insertSale: InsertSale, items: InsertSaleItem[]): Promise<Sale> {
    // Ensure these fields have default values if not provided
    const saleToInsert = {
      ...insertSale,
      date: insertSale.date || new Date(),
      status: insertSale.status || "pending"
    };
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert the sale
      const [sale] = await tx.insert(sales).values(saleToInsert).returning();
      
      // Insert all sale items and update product stock
      for (const item of items) {
        // Insert sale item
        await tx.insert(saleItems).values({
          ...item,
          saleId: sale.id
        });
        
        // Update product stock
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (product) {
          const newStock = product.stock - item.quantity;
          await tx
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, item.productId));
        }
      }
      
      return sale;
    });
  }
  
  async updateSale(id: number, updates: Partial<Sale>): Promise<Sale | undefined> {
    const [updatedSale] = await db
      .update(sales)
      .set(updates)
      .where(eq(sales.id, id))
      .returning();
    
    return updatedSale;
  }
  
  async deleteSale(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get all sale items
      const saleItemsToDelete = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, id));
      
      // Restore product stock and delete sale items
      for (const item of saleItemsToDelete) {
        // Get product
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (product) {
          // Restore stock
          const newStock = product.stock + item.quantity;
          await tx
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, item.productId));
        }
        
        // Delete sale item
        await tx
          .delete(saleItems)
          .where(eq(saleItems.id, item.id));
      }
      
      // Delete the sale
      const result = await tx
        .delete(sales)
        .where(eq(sales.id, id));
      
      return !!result;
    });
  }
  
  // Analytics
  async getTotalSalesToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const salesForToday = await db
      .select()
      .from(sales)
      .where(
        and(
          gte(sales.date, today),
          lt(sales.date, tomorrow)
        )
      );
    
    return salesForToday.reduce((total, sale) => total + sale.total, 0);
  }
  
  async getNewCustomersToday(): Promise<number> {
    // We'd need to add a createdAt field to the customers table to implement this accurately
    // For now, we'll return a placeholder value
    return 3;
  }
  
  async getProductsSoldToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const salesForToday = await db
      .select()
      .from(sales)
      .where(
        and(
          gte(sales.date, today),
          lt(sales.date, tomorrow)
        )
      );
    
    let totalProducts = 0;
    
    for (const sale of salesForToday) {
      const items = await db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, sale.id));
      
      totalProducts += items.reduce((total, item) => total + item.quantity, 0);
    }
    
    return totalProducts;
  }

  // Add a method to seed initial data
  async seedInitialData() {
    // Check if we already have users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return; // Data already exists, no need to seed
    }

    // Add a default admin user with a secure password (in a real app, you'd hash this)
    await this.createUser({
      username: "admin",
      password: "password", // In real app, this would be hashed by auth.ts
      name: "Admin User",
      email: "admin@hlgfitness.com",
      avatar: null,
      role: "admin"
    });
    
    // Add some products
    await this.createProduct({
      name: "Legging Preta",
      description: "Legging preta de alta compressão, ideal para treinos intensos",
      category: "leggings",
      size: "M",
      color: "Preto",
      price: 119.90,
      stock: 2,
      minStock: 5,
      image: null,
    });
    
    await this.createProduct({
      name: "Top Esportivo",
      description: "Top esportivo com suporte médio, perfeito para atividades físicas",
      category: "tops",
      size: "P",
      color: "Rosa",
      price: 89.90,
      stock: 3,
      minStock: 5,
      image: null,
    });
    
    await this.createProduct({
      name: "Tênis de Corrida",
      description: "Tênis leve e confortável para corridas de longa distância",
      category: "shoes",
      size: "38",
      color: "Cinza",
      price: 249.90,
      stock: 1,
      minStock: 3,
      image: null,
    });
    
    await this.createProduct({
      name: "Shorts Esportivo",
      description: "Shorts confortável para atividades físicas intensas",
      category: "shorts",
      size: "M",
      color: "Azul",
      price: 79.90,
      stock: 15,
      minStock: 5,
      image: null,
    });
    
    // Add some customers
    await this.createCustomer({
      name: "Maria Oliveira",
      email: "maria@example.com",
      phone: "(11) 98765-4321",
      address: "Rua das Flores, 123 - São Paulo, SP",
    });
    
    await this.createCustomer({
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 91234-5678",
      address: "Av. Paulista, 1000 - São Paulo, SP",
    });
    
    await this.createCustomer({
      name: "Carla Mendes",
      email: "carla@example.com",
      phone: "(21) 99876-5432",
      address: "Rua do Sol, 456 - Rio de Janeiro, RJ",
    });
    
    await this.createCustomer({
      name: "Pedro Costa",
      email: "pedro@example.com",
      phone: "(31) 98765-1234",
      address: "Rua dos Ipês, 789 - Belo Horizonte, MG",
    });
    
    // Add some sales
    const now = new Date();
    
    // Sale 1 - Maria
    await this.createSale({
      customerId: 1,
      date: now,
      total: 320,
      status: "completed",
    }, [
      { productId: 1, quantity: 2, price: 119.90, saleId: 0 },
      { productId: 2, quantity: 1, price: 89.90, saleId: 0 }
    ]);
    
    // Sale 2 - João
    await this.createSale({
      customerId: 2,
      date: now,
      total: 149.90,
      status: "completed",
    }, [
      { productId: 2, quantity: 1, price: 149.90, saleId: 0 }
    ]);
    
    // Sale 3 - Carla
    await this.createSale({
      customerId: 3,
      date: now,
      total: 580.50,
      status: "pending",
    }, [
      { productId: 1, quantity: 2, price: 119.90, saleId: 0 },
      { productId: 4, quantity: 3, price: 79.90, saleId: 0 },
      { productId: 2, quantity: 1, price: 89.90, saleId: 0 }
    ]);
    
    // Sale 4 - Pedro
    await this.createSale({
      customerId: 4,
      date: now,
      total: 189.80,
      status: "completed",
    }, [
      { productId: 4, quantity: 2, price: 94.90, saleId: 0 }
    ]);
  }
}

// Sempre usar o DatabaseStorage com PostgreSQL, não depender de variáveis de ambiente
// Isso facilita a execução em ambiente local
console.log('Inicializando armazenamento com PostgreSQL...');
export const storage = new DatabaseStorage();
