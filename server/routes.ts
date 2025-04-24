import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertProductSchema, insertCustomerSchema, insertSaleSchema, insertSaleItemSchema } from "@shared/schema";
import { z } from "zod";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    // Only allow images
    const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
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

  app.post("/api/products", upload.single("image"), async (req, res) => {
    try {
      const productData = req.body;
      
      // Convert string values to numbers
      if (productData.price) productData.price = parseFloat(productData.price);
      if (productData.stock) productData.stock = parseInt(productData.stock);
      if (productData.minStock) productData.minStock = parseInt(productData.minStock);
      
      const result = insertProductSchema.safeParse(productData);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid product data", errors: result.error.format() });
      }

      // Handle image if uploaded
      if (req.file) {
        const fileName = `product_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join("uploads", fileName);
        
        // Ensure uploads directory exists
        if (!fs.existsSync("uploads")) {
          fs.mkdirSync("uploads", { recursive: true });
        }
        
        fs.writeFileSync(filePath, req.file.buffer);
        productData.image = filePath;
      }

      const product = await storage.createProduct(result.data);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/products/:id", upload.single("image"), async (req, res) => {
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
      
      // Convert string values to numbers
      if (productData.price) productData.price = parseFloat(productData.price);
      if (productData.stock) productData.stock = parseInt(productData.stock);
      if (productData.minStock) productData.minStock = parseInt(productData.minStock);
      
      // Handle image if uploaded
      if (req.file) {
        const fileName = `product_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join("uploads", fileName);
        
        // Ensure uploads directory exists
        if (!fs.existsSync("uploads")) {
          fs.mkdirSync("uploads", { recursive: true });
        }
        
        fs.writeFileSync(filePath, req.file.buffer);
        productData.image = filePath;
      }

      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
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

  app.get("/api/products-low-stock", async (_req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
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

  app.post("/api/customers", async (req, res) => {
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

  app.put("/api/customers/:id", async (req, res) => {
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

  app.delete("/api/customers/:id", async (req, res) => {
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

  // Sale routes
  app.get("/api/sales", async (_req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
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

  app.post("/api/sales", async (req: Request, res: Response) => {
    try {
      console.log("Recebendo dados de venda:", JSON.stringify(req.body, null, 2));
      const { sale, items } = req.body;
      
      // Verificações de segurança
      if (!sale) {
        return res.status(400).json({ message: "Dados da venda não fornecidos" });
      }
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Itens da venda não fornecidos ou inválidos" });
      }
      
      // Convert string values to numbers and convert date string to Date object
      // Processar todos os itens primeiro para calcular o total correto
      const processedItems = items.map((item: any) => ({
        saleId: 0, // Will be set by storage
        productId: parseInt(item.productId.toString()),
        quantity: parseInt(item.quantity.toString()),
        price: parseFloat(item.price.toString())
      }));
      
      // Calcular o total correto baseado nos itens
      const calculatedTotal = processedItems.reduce((total: number, item: any) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      // Formatar para 2 casas decimais para evitar problemas com números flutuantes
      const formattedTotal = parseFloat(calculatedTotal.toFixed(2));
      
      console.log("Total calculado pelo servidor:", formattedTotal);
      
      const processedSale = {
        ...sale,
        customerId: parseInt(sale.customerId.toString()),
        total: formattedTotal, // Usar o total calculado pelo servidor
        date: new Date(sale.date || new Date()),
        status: sale.status || 'pending'
      };
      
      console.log("Dados da venda processados:", processedSale);
      
      // Criamos um objeto Sale válido usando os dados processados
      // Isso pula a validação do Zod que estava dando problemas com o formato da data
      try {
        // Validamos manualmente
        if (!processedSale.customerId || isNaN(processedSale.customerId)) {
          throw new Error("ID do cliente inválido");
        }
        if (isNaN(processedSale.total)) {
          throw new Error("Total inválido");
        }
        if (!(processedSale.date instanceof Date) || isNaN(processedSale.date.getTime())) {
          throw new Error("Data inválida");
        }
        if (!["pending", "completed", "cancelled"].includes(processedSale.status)) {
          throw new Error("Status inválido");
        }
      } catch (error: any) {
        return res.status(400).json({ 
          message: "Dados da venda inválidos", 
          errors: error.message 
        });
      }
      
      console.log("Itens processados:", processedItems);
      
      // Verificar estoque disponível para todos os produtos
      for (const item of processedItems) {
        const product = await storage.getProduct(item.productId);
        
        if (!product) {
          return res.status(400).json({ 
            message: `Produto com ID ${item.productId} não encontrado` 
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}` 
          });
        }
      }
      
      // Validar itens manualmente sem usar Zod
      for (const item of processedItems) {
        if (!item.productId || isNaN(item.productId)) {
          return res.status(400).json({ 
            message: "Dados dos itens inválidos", 
            errors: "ID do produto inválido" 
          });
        }
        if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
          return res.status(400).json({ 
            message: "Dados dos itens inválidos", 
            errors: "Quantidade inválida" 
          });
        }
        if (!item.price || isNaN(item.price) || item.price <= 0) {
          return res.status(400).json({ 
            message: "Dados dos itens inválidos", 
            errors: "Preço inválido" 
          });
        }
      }

      const newSale = await storage.createSale(processedSale, processedItems);
      console.log("Venda criada com sucesso:", newSale);
      res.status(201).json(newSale);
    } catch (error: any) {
      console.error("Erro ao criar venda:", error);
      res.status(500).json({ 
        message: "Erro ao criar venda", 
        error: error.message 
      });
    }
  });

  app.put("/api/sales/:id", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      if (isNaN(saleId)) {
        return res.status(400).json({ message: "Invalid sale ID" });
      }

      const sale = await storage.getSale(saleId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }

      // Only allow updating status
      const updatedSale = await storage.updateSale(saleId, { 
        status: req.body.status 
      });
      
      res.json(updatedSale);
    } catch (error) {
      res.status(500).json({ message: "Error updating sale" });
    }
  });

  app.delete("/api/sales/:id", async (req, res) => {
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

  app.get("/api/sales/by-date-range", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      // Reset hours for start date and set to end of day for end date
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const sales = await storage.getSalesByDateRange(startDate, endDate);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error fetching sales by date range" });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/stats", async (_req, res) => {
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

  app.get("/api/dashboard/low-stock", async (_req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching low stock products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
