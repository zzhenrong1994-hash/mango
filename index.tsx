import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import { 
    PieChart, 
    Wallet, 
    Plus, 
    Trash2, 
    TrendingDown, 
    LayoutDashboard, 
    Sparkles, 
    Settings,
    Landmark,
    Check,
    X,
    Building,
    Briefcase,
    Download,
    Upload,
    HardDrive,
    ArrowLeftRight,
    Pencil,
    Search
} from "lucide-react";

// --- Types ---
type TransactionType = 'expense' | 'income';
type Currency = 'CNY' | 'USD';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    currency: Currency;
    category: string;
    date: string;
    type: TransactionType;
}

interface Asset {
    id: string;
    bankName: string;
 balance: number;
    currency: Currency;
    type: 'savings' | 'credit';
}

interface IncomeSource {
    amount: number;
    currency: Currency;
}

interface FinancialConfig {
    salaryIncome: IncomeSource;   
    rentalIncome: IncomeSource;   
    monthlySocialSecurity: number; 
    monthlyLoan: number;        
    lastMonthTotalAssets: number; 
    lastSnapshotMonth: string;    
    exchangeRate: number;         
}

// --- Gemini Setup ---
const getApiKey = () => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        // @ts-ignore
        return process.env.API_KEY;
    }
    return '';
};
