import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------
// In-Memory Database for Yawa Budget
// -------------------------------------------------------------
interface User {
  id: string;
  email: string;
  password: string; // Plaintext for demo in-memory storage
  name: string;
  createdAt: string;
}

interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  updatedAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  category: string;
  createdAt: string;
}

// Mono Open Banking Sandbox Account
interface MonoAccount {
  id: string;
  userId: string;
  institutionName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  balance: number;
  lastSyncedAt: string;
  status: "connected" | "syncing" | "error";
}

interface MonoTransactionItem {
  id: string;
  amount: number;
  type: "debit" | "credit";
  narration: string;
  date: string;
  category?: string;
}

// Paystack Transfer Sandbox Record
interface PaystackTransferRecord {
  id: string;
  userId: string;
  reference: string;
  status: "success" | "pending" | "failed";
  amount: number;
  fee: number;
  totalDebited: number;
  recipientName: string;
  recipientBank: string;
  accountNumber: string;
  narration: string;
  date: string;
  category?: string;
  ledgerTransactionId?: string;
}

// Global in-memory storage
const users = new Map<string, User>();
const budgets = new Map<string, Budget[]>(); // userId -> budgets
const transactions = new Map<string, Transaction[]>(); // userId -> transactions
const monoAccounts = new Map<string, MonoAccount[]>(); // userId -> MonoAccount[]
const monoPendingTransactions = new Map<string, MonoTransactionItem[]>(); // accountId -> unimported transactions
const paystackTransfers = new Map<string, PaystackTransferRecord[]>(); // userId -> PaystackTransferRecord[]

// Standard preset categories
export const DEFAULT_CATEGORIES = [
  "Groceries",
  "Dining Out",
  "Housing & Rent",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Personal Care",
  "Other",
];

// Helper to get current YYYY-MM
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Seed initial Demo User with realistic initial data
const DEMO_USER_ID = "usr_demo_123";
const demoUser: User = {
  id: DEMO_USER_ID,
  email: "demo@yawabudget.app",
  password: "password123",
  name: "Alex Johnson",
  createdAt: new Date().toISOString(),
};
users.set(demoUser.email, demoUser);
// Backward compatibility alias for existing test runners or login sessions
users.set("demo@smartbudget.app", demoUser);

const currentMonth = getCurrentMonth();
budgets.set(DEMO_USER_ID, [
  { id: "b1", userId: DEMO_USER_ID, category: "Groceries", monthlyLimit: 500, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b2", userId: DEMO_USER_ID, category: "Dining Out", monthlyLimit: 250, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b3", userId: DEMO_USER_ID, category: "Housing & Rent", monthlyLimit: 1400, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b4", userId: DEMO_USER_ID, category: "Transportation", monthlyLimit: 180, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b5", userId: DEMO_USER_ID, category: "Entertainment", monthlyLimit: 150, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b6", userId: DEMO_USER_ID, category: "Utilities", monthlyLimit: 200, month: currentMonth, updatedAt: new Date().toISOString() },
  { id: "b7", userId: DEMO_USER_ID, category: "Shopping", monthlyLimit: 200, month: currentMonth, updatedAt: new Date().toISOString() },
]);

const today = new Date().toISOString().split("T")[0];
transactions.set(DEMO_USER_ID, [
  { id: "t1", userId: DEMO_USER_ID, amount: 1400, description: "Monthly Apartment Rent", date: `${currentMonth}-01`, category: "Housing & Rent", createdAt: new Date().toISOString() },
  { id: "t2", userId: DEMO_USER_ID, amount: 84.50, description: "Whole Foods Weekly Market", date: `${currentMonth}-03`, category: "Groceries", createdAt: new Date().toISOString() },
  { id: "t3", userId: DEMO_USER_ID, amount: 132.20, description: "Trader Joe's Pantry Run", date: `${currentMonth}-07`, category: "Groceries", createdAt: new Date().toISOString() },
  { id: "t4", userId: DEMO_USER_ID, amount: 215.00, description: "Costco Bulk Groceries & Supplies", date: `${currentMonth}-10`, category: "Groceries", createdAt: new Date().toISOString() }, // 431.70 / 500 = 86% (Warning!)
  { id: "t5", userId: DEMO_USER_ID, amount: 62.50, description: "Sushi Dinner with Friends", date: `${currentMonth}-05`, category: "Dining Out", createdAt: new Date().toISOString() },
  { id: "t6", userId: DEMO_USER_ID, amount: 48.00, description: "Italian Bistro", date: `${currentMonth}-09`, category: "Dining Out", createdAt: new Date().toISOString() },
  { id: "t7", userId: DEMO_USER_ID, amount: 110.00, description: "Steakhouse Celebration", date: `${currentMonth}-11`, category: "Dining Out", createdAt: new Date().toISOString() }, // 220.50 / 250 = 88% (Warning!)
  { id: "t8", userId: DEMO_USER_ID, amount: 45.00, description: "Subway Metro Card Refill", date: `${currentMonth}-02`, category: "Transportation", createdAt: new Date().toISOString() },
  { id: "t9", userId: DEMO_USER_ID, amount: 38.50, description: "Uber ride home from downtown", date: `${currentMonth}-08`, category: "Transportation", createdAt: new Date().toISOString() },
  { id: "t10", userId: DEMO_USER_ID, amount: 19.99, description: "Netflix Streaming Subscription", date: `${currentMonth}-04`, category: "Entertainment", createdAt: new Date().toISOString() },
  { id: "t11", userId: DEMO_USER_ID, amount: 42.00, description: "Movie Theatre Tickets", date: `${currentMonth}-06`, category: "Entertainment", createdAt: new Date().toISOString() },
  { id: "t12", userId: DEMO_USER_ID, amount: 95.00, description: "Electric & Gas Utility Bill", date: `${currentMonth}-05`, category: "Utilities", createdAt: new Date().toISOString() },
  { id: "t13", userId: DEMO_USER_ID, amount: 65.00, description: "Fiber Internet Service", date: `${currentMonth}-08`, category: "Utilities", createdAt: new Date().toISOString() },
]);

// Seed Demo Mono Bank Account (Stretch Feature 1)
const DEMO_MONO_ACCOUNT_ID = "mono_acc_gtb_demo";
monoAccounts.set(DEMO_USER_ID, [
  {
    id: DEMO_MONO_ACCOUNT_ID,
    userId: DEMO_USER_ID,
    institutionName: "GTBank (Sandbox)",
    accountNumber: "0123456789",
    accountName: "Alex Johnson",
    accountType: "SAVINGS",
    currency: "NGN",
    balance: 482500,
    lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
    status: "connected",
  },
]);

// Seed queue of pending real-shaped bank statement transactions ready to sync
monoPendingTransactions.set(DEMO_MONO_ACCOUNT_ID, [
  { id: "mono_tx_101", amount: 32.50, type: "debit", narration: "POS / SHOPRITE MALL / IKEJA", date: `${currentMonth}-12`, category: "Groceries" },
  { id: "mono_tx_102", amount: 14.00, type: "debit", narration: "NIP TRF / CHOWDECK FOOD DELIVERY", date: `${currentMonth}-13`, category: "Dining Out" },
  { id: "mono_tx_103", amount: 15.00, type: "debit", narration: "EKEDC PREPAID ELECTRICITY / TOKEN 9281", date: `${currentMonth}-14`, category: "Utilities" },
  { id: "mono_tx_104", amount: 4.80, type: "debit", narration: "UBER TRIP NG / LAGOS METRO", date: `${currentMonth}-14`, category: "Transportation" },
  { id: "mono_tx_105", amount: 28.00, type: "debit", narration: "PAYSTACK / JUMIA ONLINE SHOPPING", date: `${currentMonth}-15`, category: "Shopping" },
  { id: "mono_tx_106", amount: 8.50, type: "debit", narration: "MEDPLUS PHARMACY / ADMIRALTY LEKKI", date: `${currentMonth}-16`, category: "Healthcare" },
]);

// Seed Demo Paystack Transfer History (Stretch Feature 2)
paystackTransfers.set(DEMO_USER_ID, [
  {
    id: "trf_demo_1",
    userId: DEMO_USER_ID,
    reference: "TRF_snbx_78a9c2f10b",
    status: "success",
    amount: 15000,
    fee: 25,
    totalDebited: 15025,
    recipientName: "BABAJIDE TUNDE ADEKUNLE",
    recipientBank: "GTBank",
    accountNumber: "0123456789",
    narration: "Freelance design milestone 1",
    date: `${currentMonth}-09`,
    category: "Other",
  },
]);

// -------------------------------------------------------------
// Authentication Helpers & Middleware
// -------------------------------------------------------------
// Simple JWT simulation for frontend testing
function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token: string): { userId: string; email: string; name: string } | null {
  try {
    const jsonStr = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string; name: string };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized: Token has expired or is invalid" });
    return;
  }

  // Confirm user still exists in memory
  const user = Array.from(users.values()).find((u) => u.id === payload.userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized: User account no longer exists" });
    return;
  }

  req.user = payload;
  next();
}

// -------------------------------------------------------------
// Lazy Gemini AI Client Initialization
// -------------------------------------------------------------
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Routes Router (Supports both /api/* and /*)
// -------------------------------------------------------------
const apiRouter = express.Router();

// 1. Health check
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Auth: Register
apiRouter.post("/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (users.has(normalizedEmail)) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    email: normalizedEmail,
    password,
    name: name?.trim() || normalizedEmail.split("@")[0],
    createdAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, newUser);

  // Seed default budgets for new users
  const currentMonth = getCurrentMonth();
  budgets.set(newUser.id, [
    { id: `b_${Date.now()}_1`, userId: newUser.id, category: "Groceries", monthlyLimit: 400, month: currentMonth, updatedAt: new Date().toISOString() },
    { id: `b_${Date.now()}_2`, userId: newUser.id, category: "Dining Out", monthlyLimit: 200, month: currentMonth, updatedAt: new Date().toISOString() },
    { id: `b_${Date.now()}_3`, userId: newUser.id, category: "Housing & Rent", monthlyLimit: 1200, month: currentMonth, updatedAt: new Date().toISOString() },
    { id: `b_${Date.now()}_4`, userId: newUser.id, category: "Transportation", monthlyLimit: 150, month: currentMonth, updatedAt: new Date().toISOString() },
    { id: `b_${Date.now()}_5`, userId: newUser.id, category: "Utilities", monthlyLimit: 180, month: currentMonth, updatedAt: new Date().toISOString() },
    { id: `b_${Date.now()}_6`, userId: newUser.id, category: "Entertainment", monthlyLimit: 100, month: currentMonth, updatedAt: new Date().toISOString() },
  ]);
  transactions.set(newUser.id, []);

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  });
});

// 3. Auth: Login
apiRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);

  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

// 4. Auth: Delete Account
apiRouter.delete("/auth/account", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  // Purge all data associated with this user
  users.delete(userEmail);
  budgets.delete(userId);
  transactions.delete(userId);

  res.json({ message: "Account and associated budget data deleted successfully." });
});

// 5. Budgets: Summary (GET /budgets/summary)
apiRouter.get("/budgets/summary", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const currentMonth = getCurrentMonth();

  const userBudgets = budgets.get(userId) || [];
  const userTransactions = transactions.get(userId) || [];

  // Filter transactions for the current month
  const monthTransactions = userTransactions.filter((tx) => tx.date.startsWith(currentMonth));

  // Compute spending per category
  const spendingByCategory: Record<string, number> = {};
  let totalSpent = 0;

  monthTransactions.forEach((tx) => {
    spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
    totalSpent += tx.amount;
  });

  // Calculate budget limits and comparison
  let totalBudget = 0;
  const categoriesSummary: Array<{
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
    isOverLimit: boolean;
    isWarning: boolean;
  }> = [];

  // Track categories that have budgets
  const budgetedCategories = new Set<string>();

  userBudgets.forEach((b) => {
    budgetedCategories.add(b.category);
    const spent = spendingByCategory[b.category] || 0;
    const budgeted = b.monthlyLimit;
    totalBudget += budgeted;
    const remaining = budgeted - spent;
    const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : spent > 0 ? 100 : 0;

    categoriesSummary.push({
      category: b.category,
      budgeted,
      spent: Number(spent.toFixed(2)),
      remaining: Number(remaining.toFixed(2)),
      percentage,
      isOverLimit: spent > budgeted,
      isWarning: percentage >= 80,
    });
  });

  // Include categories that have spending but no explicit budget
  Object.keys(spendingByCategory).forEach((cat) => {
    if (!budgetedCategories.has(cat)) {
      const spent = spendingByCategory[cat];
      categoriesSummary.push({
        category: cat,
        budgeted: 0,
        spent: Number(spent.toFixed(2)),
        remaining: -Number(spent.toFixed(2)),
        percentage: 100,
        isOverLimit: true,
        isWarning: true,
      });
    }
  });

  // Sort: highest spent first
  categoriesSummary.sort((a, b) => b.spent - a.spent);

  res.json({
    month: currentMonth,
    totalBudget: Number(totalBudget.toFixed(2)),
    totalSpent: Number(totalSpent.toFixed(2)),
    totalRemaining: Number((totalBudget - totalSpent).toFixed(2)),
    overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    categories: categoriesSummary,
  });
});

// 6. Budgets: List (GET /budgets)
apiRouter.get("/budgets", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const userBudgets = budgets.get(userId) || [];
  res.json(userBudgets);
});

// 7. Budgets: Set / Upsert (POST /budgets)
apiRouter.post("/budgets", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { category, monthlyLimit, month } = req.body;

  if (!category || monthlyLimit === undefined || Number(monthlyLimit) < 0) {
    res.status(400).json({ error: "Category and valid positive monthly limit are required." });
    return;
  }

  const limitNumber = Number(monthlyLimit);
  const targetMonth = month || getCurrentMonth();

  const userBudgets = budgets.get(userId) || [];
  const existingIndex = userBudgets.findIndex((b) => b.category.toLowerCase() === category.trim().toLowerCase());

  let updatedBudget: Budget;
  if (existingIndex >= 0) {
    userBudgets[existingIndex].monthlyLimit = limitNumber;
    userBudgets[existingIndex].updatedAt = new Date().toISOString();
    updatedBudget = userBudgets[existingIndex];
  } else {
    updatedBudget = {
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      category: category.trim(),
      monthlyLimit: limitNumber,
      month: targetMonth,
      updatedAt: new Date().toISOString(),
    };
    userBudgets.push(updatedBudget);
  }

  budgets.set(userId, userBudgets);
  res.status(200).json(updatedBudget);
});

// 8. Transactions: List (GET /transactions)
apiRouter.get("/transactions", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const userTransactions = transactions.get(userId) || [];
  // Sort descending by date, then createdAt
  const sorted = [...userTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

// 9. Transactions: Create (POST /transactions)
apiRouter.post("/transactions", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { amount, description, date, category } = req.body;

  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Amount must be a positive number." });
    return;
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "Description is required." });
    return;
  }

  if (!date) {
    res.status(400).json({ error: "Date is required (YYYY-MM-DD)." });
    return;
  }

  if (!category || typeof category !== "string" || !category.trim()) {
    res.status(400).json({ error: "Category is required." });
    return;
  }

  const newTx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId,
    amount: Number(Number(amount).toFixed(2)),
    description: description.trim(),
    date: date.trim(),
    category: category.trim(),
    createdAt: new Date().toISOString(),
  };

  const userTransactions = transactions.get(userId) || [];
  userTransactions.unshift(newTx);
  transactions.set(userId, userTransactions);

  res.status(201).json(newTx);
});

// 10. AI: Categorize (POST /ai/categorize)
apiRouter.post("/ai/categorize", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { description, amount } = req.body;

  if (!description || typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "Description is required for categorization." });
    return;
  }

  const desc = description.trim().toLowerCase();
  const ai = getAiClient();

  // If Gemini API is configured, use it for intelligent semantic categorization
  if (ai) {
    try {
      const prompt = `You are a financial transaction categorizer.
Categories available: ${DEFAULT_CATEGORIES.join(", ")}.
Transaction description: "${description}".
Transaction amount: ${amount ? "$" + amount : "unspecified"}.

Determine the best matching category from the available list (or suggest a relevant standard category name if none fit).
Output in strict JSON format:
{
  "suggestedCategory": "<Category Name>",
  "confidence": <number between 0 and 1>,
  "explanation": "<Brief 1-sentence explanation>"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        res.json({
          suggestedCategory: parsed.suggestedCategory || "Other",
          confidence: parsed.confidence || 0.85,
          explanation: parsed.explanation || `Categorized based on "${description}"`,
        });
        return;
      }
    } catch (err) {
      console.warn("Gemini categorization fallback due to error:", err);
      // Fall through to heuristic categorizer
    }
  }

  // High-accuracy heuristic rule-based categorizer
  let suggested = "Other";
  let explanation = `Assigned default category for "${description}"`;
  let confidence = 0.8;

  if (/(whole foods|trader joe|costco|safeway|kroger|grocery|market|supermarket|aldi|walmart|food lion|target|produce)/i.test(desc)) {
    suggested = "Groceries";
    explanation = "Matched grocery store or supermarket keywords.";
    confidence = 0.95;
  } else if (/(sushi|restaurant|cafe|coffee|starbucks|mcdonald|chipotle|burger|pizza|diner|bistro|bar|pub|doordash|uber eats|grubhub|takeout|lunch|dinner|breakfast)/i.test(desc)) {
    suggested = "Dining Out";
    explanation = "Matched restaurant, takeout, or cafe keywords.";
    confidence = 0.95;
  } else if (/(rent|mortgage|apartment|lease|landlord|hoa|housing|storage)/i.test(desc)) {
    suggested = "Housing & Rent";
    explanation = "Identified recurring housing or rent expense.";
    confidence = 0.98;
  } else if (/(uber|lyft|gas|petrol|chevron|shell|metro|subway|transit|train|bus|parking|toll|airline|flight|delta|united)/i.test(desc)) {
    suggested = "Transportation";
    explanation = "Matched travel, rideshare, fuel, or transit merchant.";
    confidence = 0.92;
  } else if (/(electric|pge|edison|water|sewer|gas bill|internet|wifi|comcast|verizon|at&t|t-mobile|utilities|trash)/i.test(desc)) {
    suggested = "Utilities";
    explanation = "Identified utility or telecommunication provider.";
    confidence = 0.94;
  } else if (/(netflix|spotify|hulu|disney|cinema|movie|theatre|concert|steam|playstation|nintendo|game|hbo|apple tv)/i.test(desc)) {
    suggested = "Entertainment";
    explanation = "Identified entertainment or streaming media subscription.";
    confidence = 0.96;
  } else if (/(amazon|ebay|ikea|clothes|shoes|zara|nike|mall|electronics|best buy|apple store|target)/i.test(desc)) {
    suggested = "Shopping";
    explanation = "Matched retail or shopping merchant.";
    confidence = 0.88;
  } else if (/(pharmacy|cvs|walgreens|doctor|hospital|dental|copay|clinic|medicine|health|optometry)/i.test(desc)) {
    suggested = "Healthcare";
    explanation = "Matched medical, pharmacy, or healthcare provider.";
    confidence = 0.95;
  } else if (/(haircut|barber|salon|spa|gym|fitness|massage|skincare|cosmetics|sephora)/i.test(desc)) {
    suggested = "Personal Care";
    explanation = "Matched personal grooming or fitness expense.";
    confidence = 0.9;
  }

  res.json({
    suggestedCategory: suggested,
    confidence,
    explanation,
  });
});

// -------------------------------------------------------------
// Mono Open Banking Sandbox Endpoints (Stretch Feature 1)
// -------------------------------------------------------------
const MONO_SANDBOX_INSTITUTIONS = [
  { id: "inst_gtb", name: "GTBank (Guaranty Trust Bank)", bankCode: "058", country: "NG" },
  { id: "inst_zenith", name: "Zenith Bank", bankCode: "057", country: "NG" },
  { id: "inst_kuda", name: "Kuda Microfinance Bank", bankCode: "50211", country: "NG" },
  { id: "inst_access", name: "Access Bank", bankCode: "044", country: "NG" },
  { id: "inst_firstbank", name: "First Bank of Nigeria", bankCode: "011", country: "NG" },
  { id: "inst_sterling", name: "Sterling Bank", bankCode: "232", country: "NG" },
];

// List available sandbox institutions
apiRouter.get("/mono/institutions", (req, res) => {
  res.json(MONO_SANDBOX_INSTITUTIONS);
});

// List linked accounts for authenticated user
apiRouter.get("/mono/accounts", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const accounts = monoAccounts.get(userId) || [];
  res.json(accounts);
});

// Connect test bank account via Mono
apiRouter.post("/mono/connect", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { institutionName, accountNumber } = req.body;

  const chosenInstitution = institutionName || "GTBank (Sandbox)";
  const chosenAccountNum = accountNumber || `012${Math.floor(1000000 + Math.random() * 9000000)}`;
  const accountId = `mono_acc_${Date.now()}`;

  const newAccount: MonoAccount = {
    id: accountId,
    userId,
    institutionName: chosenInstitution,
    accountNumber: chosenAccountNum,
    accountName: req.user!.name || "Account Holder",
    accountType: "SAVINGS",
    currency: "NGN",
    balance: Math.floor(150000 + Math.random() * 750000),
    lastSyncedAt: new Date().toISOString(),
    status: "connected",
  };

  const userAccounts = monoAccounts.get(userId) || [];
  userAccounts.push(newAccount);
  monoAccounts.set(userId, userAccounts);

  // Generate a realistic set of initial bank transactions for this linked account
  const curMonth = getCurrentMonth();
  const sampleBankTxs: MonoTransactionItem[] = [
    { id: `mono_tx_${Date.now()}_1`, amount: 24.50, type: "debit", narration: `POS / SHOPRITE SUPERMARKET / ${chosenInstitution}`, date: `${curMonth}-14`, category: "Groceries" },
    { id: `mono_tx_${Date.now()}_2`, amount: 12.00, type: "debit", narration: "NIP TRF / CHOWDECK FOOD DELIVERY", date: `${curMonth}-15`, category: "Dining Out" },
    { id: `mono_tx_${Date.now()}_3`, amount: 15.00, type: "debit", narration: "EKEDC ELECTRICITY TOKEN BILL", date: `${curMonth}-15`, category: "Utilities" },
    { id: `mono_tx_${Date.now()}_4`, amount: 6.50, type: "debit", narration: "UBER TRIP LAGOS ISLAND", date: `${curMonth}-16`, category: "Transportation" },
    { id: `mono_tx_${Date.now()}_5`, amount: 35.00, type: "debit", narration: "PAYSTACK / JUMIA ONLINE SHOPPING", date: `${curMonth}-17`, category: "Shopping" },
  ];
  monoPendingTransactions.set(accountId, sampleBankTxs);

  res.status(201).json(newAccount);
});

// Sync transactions from Mono into Yawa Budget ledger
apiRouter.post("/mono/sync/:accountId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { accountId } = req.params;

  const userAccounts = monoAccounts.get(userId) || [];
  const account = userAccounts.find((a) => a.id === accountId);

  if (!account) {
    res.status(404).json({ error: "Linked bank account not found." });
    return;
  }

  // Get pending transactions for this account
  let pending = monoPendingTransactions.get(accountId) || [];

  // If no pending transactions exist, generate 2 fresh real-shaped transactions
  if (pending.length === 0) {
    const curMonth = getCurrentMonth();
    const day = String(Math.min(28, Math.max(1, new Date().getDate()))).padStart(2, "0");
    pending = [
      { id: `mono_tx_fresh_${Date.now()}_1`, amount: 18.50, type: "debit", narration: "POS / SPAR HYPERMARKET LEKKI", date: `${curMonth}-${day}`, category: "Groceries" },
      { id: `mono_tx_fresh_${Date.now()}_2`, amount: 9.00, type: "debit", narration: "UBER TRIP VI TO IKOYI", date: `${curMonth}-${day}`, category: "Transportation" },
    ];
  }

  // Convert and insert into Yawa Budget user transactions
  const userTxs = transactions.get(userId) || [];
  const newlyImported: Transaction[] = [];

  for (const bTx of pending) {
    const newTx: Transaction = {
      id: `tx_mono_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amount: bTx.amount,
      description: `${bTx.narration} [${account.institutionName}]`,
      date: bTx.date,
      category: bTx.category || "Other",
      createdAt: new Date().toISOString(),
    };
    userTxs.unshift(newTx);
    newlyImported.push(newTx);
  }

  transactions.set(userId, userTxs);
  // Clear the synced pending queue
  monoPendingTransactions.set(accountId, []);

  // Update account lastSyncedAt
  account.lastSyncedAt = new Date().toISOString();
  monoAccounts.set(userId, userAccounts);

  res.json({
    accountId,
    importedCount: newlyImported.length,
    transactions: newlyImported,
    message: `Successfully synced ${newlyImported.length} transactions from ${account.institutionName} into Yawa Budget.`,
  });
});

// Disconnect/Unlink Mono account
apiRouter.delete("/mono/accounts/:accountId", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { accountId } = req.params;

  let userAccounts = monoAccounts.get(userId) || [];
  const initialLen = userAccounts.length;
  userAccounts = userAccounts.filter((a) => a.id !== accountId);

  if (userAccounts.length === initialLen) {
    res.status(404).json({ error: "Linked account not found." });
    return;
  }

  monoAccounts.set(userId, userAccounts);
  monoPendingTransactions.delete(accountId);

  res.json({ success: true, message: "Bank account disconnected successfully." });
});

// -------------------------------------------------------------
// Paystack Transfer Sandbox Endpoints (Stretch Feature 2)
// -------------------------------------------------------------
const PAYSTACK_SANDBOX_BANKS = [
  { name: "Guaranty Trust Bank", slug: "guaranty-trust-bank", code: "058", active: true },
  { name: "Zenith Bank", slug: "zenith-bank", code: "057", active: true },
  { name: "Access Bank", slug: "access-bank", code: "044", active: true },
  { name: "Kuda Bank", slug: "kuda-bank", code: "50211", active: true },
  { name: "First Bank of Nigeria", slug: "first-bank-of-nigeria", code: "011", active: true },
  { name: "United Bank For Africa", slug: "united-bank-for-africa", code: "033", active: true },
  { name: "OPay", slug: "opay", code: "999992", active: true },
  { name: "PalmPay", slug: "palmpay", code: "999991", active: true },
  { name: "First City Monument Bank", slug: "first-city-monument-bank", code: "214", active: true },
  { name: "Wema Bank / ALAT", slug: "wema-bank", code: "035", active: true },
  { name: "Stanbic IBTC Bank", slug: "stanbic-ibtc-bank", code: "221", active: true },
  { name: "Sterling Bank", slug: "sterling-bank", code: "232", active: true },
];

// List supported banks
apiRouter.get("/paystack/banks", (req, res) => {
  res.json(PAYSTACK_SANDBOX_BANKS);
});

// Resolve Nigerian NUBAN account number (Paystack test mode)
apiRouter.get("/paystack/resolve", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { account_number, bank_code } = req.query;

  if (!account_number || typeof account_number !== "string" || account_number.length !== 10) {
    res.status(400).json({ error: "Account number must be a 10-digit NUBAN number." });
    return;
  }
  if (!bank_code || typeof bank_code !== "string") {
    res.status(400).json({ error: "Bank code is required." });
    return;
  }

  // Realistic verified test names
  const testNames: Record<string, string> = {
    "0123456789": "BABAJIDE TUNDE ADEKUNLE",
    "1122334455": "CHIDIEBERE IFEANYI OKONKWO",
    "2233445566": "FATIMA ZAHRA ABUBAKAR",
    "3344556677": "OLUWATOBILOBA DANIEL",
    "5566778899": "CHUKWUEMEKA GABRIEL NWOSU",
    "9988776655": "AISHA AMINU BELLO",
  };

  const resolvedName = testNames[account_number] || `TEST BENEFICIARY (${account_number.slice(0, 3)}...${account_number.slice(-3)})`;

  res.json({
    account_number,
    account_name: resolvedName,
    bank_code,
  });
});

// Execute send money transfer (Paystack sandbox mode)
apiRouter.post("/paystack/transfer", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const {
    recipientBankCode,
    recipientBankName,
    accountNumber,
    accountName,
    amount,
    narration,
    category,
    recordInLedger,
  } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
    res.status(400).json({ error: "A valid positive transfer amount is required." });
    return;
  }

  if (!accountNumber || accountNumber.length !== 10) {
    res.status(400).json({ error: "A valid 10-digit recipient account number is required." });
    return;
  }

  if (!accountName || !accountName.trim()) {
    res.status(400).json({ error: "Recipient account name is required." });
    return;
  }

  // Paystack sandbox fee calculation (₦10 <= 5000, ₦25 > 5000)
  const fee = numAmount <= 5000 ? 10 : 25;
  const reference = `TRF_snbx_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const dateStr = new Date().toISOString().split("T")[0];

  let ledgerTxId: string | undefined;

  // Record transfer automatically into Yawa Budget transaction ledger if requested (default true)
  if (recordInLedger !== false) {
    const userTxs = transactions.get(userId) || [];
    ledgerTxId = `tx_trf_${Date.now()}`;
    const ledgerTx: Transaction = {
      id: ledgerTxId,
      userId,
      amount: numAmount,
      description: `Transfer to ${accountName} (${recipientBankName || "Bank"})${narration ? ` - ${narration}` : ""}`,
      date: dateStr,
      category: category || "Other",
      createdAt: new Date().toISOString(),
    };
    userTxs.unshift(ledgerTx);
    transactions.set(userId, userTxs);
  }

  const result: PaystackTransferRecord = {
    id: `trf_${Date.now()}`,
    userId,
    reference,
    status: "success",
    amount: numAmount,
    fee,
    totalDebited: numAmount + fee,
    recipientName: accountName,
    recipientBank: recipientBankName || "Destination Bank",
    accountNumber,
    narration: narration || "Transfer via Yawa Budget",
    date: dateStr,
    category: category || "Other",
    ledgerTransactionId: ledgerTxId,
  };

  const userTransfers = paystackTransfers.get(userId) || [];
  userTransfers.unshift(result);
  paystackTransfers.set(userId, userTransfers);

  res.status(201).json(result);
});

// Get user's transfer history
apiRouter.get("/paystack/transfers", requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const list = paystackTransfers.get(userId) || [];
  res.json(list);
});

// 11. AI: Ask Yawa Budget (POST /ai/ask)
apiRouter.post("/ai/ask", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "A question is required for Ask Yawa Budget." });
    return;
  }

  const currentMonth = getCurrentMonth();
  const userBudgets = budgets.get(userId) || [];
  const userTransactions = (transactions.get(userId) || []).filter((tx) => tx.date.startsWith(currentMonth));
  const userMonoAccounts = monoAccounts.get(userId) || [];

  // Compute category totals
  const spendingByCategory: Record<string, number> = {};
  let totalSpent = 0;
  userTransactions.forEach((tx) => {
    spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
    totalSpent += tx.amount;
  });

  const totalBudget = userBudgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const overBudget = userBudgets.filter((b) => (spendingByCategory[b.category] || 0) > b.monthlyLimit);
  const warningBudget = userBudgets.filter((b) => {
    const spent = spendingByCategory[b.category] || 0;
    return spent <= b.monthlyLimit && b.monthlyLimit > 0 && spent / b.monthlyLimit >= 0.8;
  });

  const ai = getAiClient();
  if (ai) {
    try {
      const budgetContext = `
User Financial Summary for Current Month (${currentMonth}):
- Total Budget: $${totalBudget.toFixed(2)}
- Total Spent So Far: $${totalSpent.toFixed(2)}
- Remaining Budget: $${(totalBudget - totalSpent).toFixed(2)}
- Connected Mono Bank Accounts: ${userMonoAccounts.map((a) => `${a.institutionName} (${a.accountNumber})`).join(", ") || "None"}
- Category Budgets and Spending:
${userBudgets
  .map(
    (b) =>
      `  * ${b.category}: Spent $${(spendingByCategory[b.category] || 0).toFixed(2)} of $${b.monthlyLimit.toFixed(2)} (${
        b.monthlyLimit > 0 ? Math.round(((spendingByCategory[b.category] || 0) / b.monthlyLimit) * 100) : 0
      }%)`
  )
  .join("\n")}

- Recent transactions count: ${userTransactions.length}
- Categories currently past 80% limit: ${warningBudget.map((b) => b.category).join(", ") || "None"}
- Categories exceeding 100% budget limit: ${overBudget.map((b) => b.category).join(", ") || "None"}
`;

      const prompt = `You are Yawa Budget AI, an intelligent, practical, and supportive personal financial advisor.
Yawa Budget is named after the Nigerian Pidgin word "yawa" (meaning trouble or distress) — this app keeps personal finances disciplined and free from yawa.

${budgetContext}

User Question: "${question}"

Instructions:
- Provide a direct, concise, and helpful answer grounded in the user's real budget numbers above.
- Mention specific dollar/naira amounts and percentages where relevant.
- Offer actionable, encouraging tips on where to cut back or how to keep finances in check.
- Keep the response clean and well-structured, without robotic greetings.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text?.trim();
      if (text) {
        res.json({ answer: text });
        return;
      }
    } catch (err) {
      console.warn("Gemini ask fallback due to error:", err);
      // Fall through to heuristic response generator
    }
  }

  // Financial heuristics engine fallback
  const qLower = question.toLowerCase();
  let answer = "";

  if (qLower.includes("how much") || qLower.includes("spent") || qLower.includes("total")) {
    answer = `So far this month (${currentMonth}), you have spent $${totalSpent.toFixed(2)} out of your total monthly budget of $${totalBudget.toFixed(2)}. You have $${(totalBudget - totalSpent).toFixed(2)} remaining.`;
    if (warningBudget.length > 0) {
      answer += ` Note that ${warningBudget.map((b) => `${b.category} (${Math.round(((spendingByCategory[b.category] || 0) / b.monthlyLimit) * 100)}%)`).join(", ")} is nearing its 80% threshold.`;
    }
  } else if (qLower.includes("cut") || qLower.includes("save") || qLower.includes("reduce") || qLower.includes("yawa")) {
    const highestSpending = Object.entries(spendingByCategory).sort((a, b) => b[1] - a[1]);
    const topCat = highestSpending[0];
    answer = `To keep your finances from becoming yawa, monitor your highest discretionary spending in ${topCat ? topCat[0] + " ($" + topCat[1].toFixed(2) + ")" : "Dining Out"}. Trimming 15-20% could save you approximately $50-$100 this month.`;
  } else if (qLower.includes("over") || qLower.includes("limit") || qLower.includes("warning")) {
    if (overBudget.length > 0) {
      answer = `You have exceeded your monthly limit in: ${overBudget.map((b) => `${b.category} (Spent: $${(spendingByCategory[b.category] || 0).toFixed(2)}, Limit: $${b.monthlyLimit})`).join("; ")}.`;
    } else if (warningBudget.length > 0) {
      answer = `No category is over 100% yet, but ${warningBudget.map((b) => b.category).join(", ")} has reached over 80% of its budget limit.`;
    } else {
      answer = `No yawa! All of your categories are currently under their 80% warning limit for ${currentMonth}.`;
    }
  } else {
    answer = `For ${currentMonth}, your total budget is $${totalBudget.toFixed(2)} and you've spent $${totalSpent.toFixed(2)} across ${userTransactions.length} recorded transactions. Your remaining budget is $${(totalBudget - totalSpent).toFixed(2)}. No yawa — let me know if you would like insights on a specific category!`;
  }

  res.json({ answer });
});

// Mount routes at /api
app.use("/api", apiRouter);

// Also mirror directly at root for strict compliance with prompt paths:
// (/auth/login, /budgets/summary, /transactions, /budgets, /ai/categorize, /ai/ask)
app.use(apiRouter);

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Yawa Budget server running on port ${PORT}`);
  });
}

startServer();
