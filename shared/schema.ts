import { pgTable, text, serial, integer, real, timestamp, boolean, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
});

export const productCategoryEnum = pgEnum("product_category", [
  "leggings",
  "tops",
  "shorts",
  "pants",
  "accessories",
  "shoes",
  "other"
]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: productCategoryEnum("category").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  image: text("image"),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  category: true,
  size: true,
  color: true,
  price: true,
  stock: true,
  minStock: true,
  image: true,
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  email: true,
  phone: true,
  address: true,
});

export const saleStatusEnum = pgEnum("sale_status", [
  "pending",
  "completed",
  "cancelled"
]);

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  total: real("total").notNull(),
  status: saleStatusEnum("status").notNull().default("completed"),
});

export const insertSaleSchema = createInsertSchema(sales)
  .pick({
    customerId: true,
    date: true,
    total: true,
    status: true,
  })
  .transform((data) => {
    // Converter string para Date se necessário
    return {
      ...data,
      date: typeof data.date === 'string' ? new Date(data.date) : data.date
    };
  });

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).pick({
  saleId: true,
  productId: true,
  quantity: true,
  price: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

export type SaleWithItems = Sale & {
  items: (SaleItem & { product: Product })[];
  customer: Customer;
};
