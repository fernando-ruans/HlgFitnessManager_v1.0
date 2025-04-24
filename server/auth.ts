import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes(".")) {
    return false; // Formato inválido da senha armazenada
  }
  
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false; // Partes da senha faltando
  }
  
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configuração do Multer para upload de avatar
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    // Permitir apenas imagens
    const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Apenas JPEG, PNG e GIF são permitidos."));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  }
});

export function setupAuth(app: Express) {
  // Chave de sessão fixa para facilitar o desenvolvimento
  const sessionSecret = "hlg-fitness-app-secret-key";
  
  // Log para debug
  console.log("Configurando autenticação com armazenamento de sessão...");
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Sempre false para desenvolvimento local
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Adicionar logs para debug de autenticação
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} | Auth: ${req.isAuthenticated()}`);
    if (req.path === '/api/login' || req.path === '/api/register') {
      console.log('Tentativa de autenticação: ', req.body.username || '(usuário não informado)');
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Check if username is an email
        let user;
        if (username.includes('@')) {
          user = await storage.getUserByEmail(username);
        } else {
          user = await storage.getUserByUsername(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration schema with validations
  const registerSchema = insertUserSchema.extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: result.error.format() 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user without confirmPassword field
      const { confirmPassword, ...userData } = result.data;
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      res.status(500).json({ message: "Error registering user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  app.put("/api/user", avatarUpload.single("avatar"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const userId = (req.user as SelectUser).id;
      const updates = req.body;
      
      // Don't allow updating certain fields
      delete updates.id;
      delete updates.role;
      
      // If updating password, hash it
      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }
      
      // Process avatar file if uploaded
      if (req.file) {
        // Ensure uploads directory exists
        if (!fs.existsSync("uploads")) {
          fs.mkdirSync("uploads", { recursive: true });
        }
        
        // Create filename with user ID to avoid collisions
        const fileName = `avatar_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join("uploads", fileName);
        
        // Write file to disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Update the user avatar path
        updates.avatar = filePath;
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
}
