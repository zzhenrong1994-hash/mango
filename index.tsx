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

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- Main App Component ---
const App = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budget' | 'analysis'>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Data State
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem('mac_ledger_transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [assets, setAssets] = useState<Asset[]>(() => {
        const saved = localStorage.getItem('mac_ledger_assets');
        return saved ? JSON.parse(saved) : [
            { id: '1', bankName: '招商银行', balance: 50000, currency: 'CNY', type: 'savings' },
            { id: '2', bankName: 'PayPal (USD)', balance: 1200, currency: 'USD', type: 'savings' }
        ];
    });

    const [config, setConfig] = useState<FinancialConfig>(() => {
        const saved = localStorage.getItem('mac_ledger_config');
        const defaults: FinancialConfig = {
            salaryIncome: { amount: 20000, currency: 'CNY' },
            rentalIncome: { amount: 0, currency: 'CNY' },
            monthlySocialSecurity: 3000,
            monthlyLoan: 5000,
            lastMonthTotalAssets: 0,
            lastSnapshotMonth: new Date().toISOString().slice(0, 7),
            exchangeRate: 7.2
        };
        
        if (saved) {
            const parsed = JSON.parse(saved);
            // Compatibility migration
            if (typeof parsed.monthlyIncome === 'number') {
                return {
                    ...defaults,
                    ...parsed,
                    salaryIncome: { amount: parsed.monthlyIncome, currency: 'CNY' },
                };
            }
            return { ...defaults, ...parsed };
        }
        return defaults;
    });

    // Persistence
    useEffect(() => { localStorage.setItem('mac_ledger_transactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('mac_ledger_assets', JSON.stringify(assets)); }, [assets]);
    useEffect(() => { localStorage.setItem('mac_ledger_config', JSON.stringify(config)); }, [config]);

    // Auto Rollover Logic
    useEffect(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (currentMonth > config.lastSnapshotMonth) {
            const currentTotalInCNY = assets.reduce((acc, asset) => {
                return acc + (asset.currency === 'USD' ? asset.balance * config.exchangeRate : asset.balance);
            }, 0);

            setConfig(prev => ({
                ...prev,
                lastMonthTotalAssets: currentTotalInCNY,
                lastSnapshotMonth: currentMonth
            }));
        }
    }, [assets, config.lastSnapshotMonth, config.exchangeRate]);

    // Actions
    const addTransaction = (t: Transaction) => setTransactions([t, ...transactions]);
    const deleteTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));
    const addAsset = (asset: Asset) => setAssets([...assets, asset]);
    const updateAsset = (updatedAsset: Asset) => setAssets(assets.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    const deleteAsset = (id: string) => setAssets(assets.filter(a => a.id !== id));
    
    const handleExportData = () => {
        const data = { transactions, assets, config, exportDate: new Date().toISOString(), version: '1.0' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MacLedger_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.transactions && data.assets && data.config) {
                    if(confirm("导入将覆盖当前数据，确定吗？")) {
                        setTransactions(data.transactions);
                        setAssets(data.assets);
                        setConfig(data.config);
                        alert("数据恢复成功");
                    }
                }
            } catch (err) { alert("文件格式错误"); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="flex h-screen w-screen text-slate-800 font-sans selection:bg-blue-100">
            {/* Desktop Sidebar */}
            <nav className="w-64 glass-sidebar flex flex-col justify-between pt-8 pb-6 px-4 z-20 hidden md:flex">
                <div>
                    <div className="flex items-center gap-3 px-4 mb-10">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                            <Wallet size={18} />
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-slate-900">MacLedger</span>
                    </div>
                    <div className="space-y-1">
                        <SidebarItem icon={<LayoutDashboard size={18} />} label="概览" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
                        <SidebarItem icon={<Landmark size={18} />} label="资产与预算" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')}/>
                        <SidebarItem icon={<PieChart size={18} />} label="账单明细" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}/>
                        <SidebarItem icon={<Sparkles size={18} />} label="AI 分析" active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}/>
                    </div>
                </div>
                <div className="px-2">
                    <button onClick={() => setShowAddModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 font-medium transition-all mac-btn">
                        <Plus size={18} /> 记一笔
                    </button>
                </div>
            </nav>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-30 flex justify-around p-3 pb-safe">
                <MobileNavItem icon={<LayoutDashboard size={20} />} label="概览" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <MobileNavItem icon={<Landmark size={20} />} label="资产" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg -mt-4"><Plus size={20} /></button>
                <MobileNavItem icon={<PieChart size={20} />} label="明细" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                <MobileNavItem icon={<Sparkles size={20} />} label="分析" active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-white/50 relative scroll-smooth">
                <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
                    {activeTab === 'dashboard' && <DashboardView transactions={transactions} config={config} assets={assets} />}
                    {activeTab === 'budget' && <BudgetView config={config} onUpdateConfig={setConfig} assets={assets} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} onExport={handleExportData} onImport={handleImportData} />}
                    {activeTab === 'transactions' && <TransactionsView transactions={transactions} onDelete={deleteTransaction} />}
                    {activeTab === 'analysis' && <AIAnalysisView transactions={transactions} assets={assets} config={config} />}
                </div>
            </main>

            {showAddModal && <AddTransactionModal config={config} onClose={() => setShowAddModal(false)} onSave={addTransaction} />}
        </div>
    );
};

// --- Sub Components ---

const SidebarItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-black/5'}`}>
        {icon} {label}
    </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center p-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
        {icon} <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
);

// --- Dashboard View ---
const DashboardView = ({ transactions, config, assets }: { transactions: Transaction[], config: FinancialConfig, assets: Asset[] }) => {
    const toCNY = (amount: number, currency: string) => currency === 'USD' ? amount * config.exchangeRate : amount;
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const variableExpense = transactions
        .filter(t => t.date.startsWith(currentMonth) && t.type === 'expense')
        .reduce((acc, t) => acc + toCNY(t.amount, t.currency), 0);

    const currentTotalAssets = assets.reduce((acc, a) => acc + toCNY(a.balance, a.currency), 0);
    const assetGrowth = currentTotalAssets - config.lastMonthTotalAssets;

    const salaryCNY = toCNY(config.salaryIncome.amount, config.salaryIncome.currency);
    const rentalCNY = toCNY(config.rentalIncome.amount, config.rentalIncome.currency);
    const derivedConsumption = (salaryCNY + rentalCNY - config.monthlySocialSecurity - config.monthlyLoan) - assetGrowth;

    return (
        <div className="space-y-8 animate-slide-in">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">财务概览</h1>
                    <p className="text-slate-500 mt-1 text-sm">本月 (1 USD ≈ {config.exchangeRate} CNY)</p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-sm text-slate-400 mb-1">上月结转资产</div>
                    <div className="font-mono font-medium text-slate-600">¥{config.lastMonthTotalAssets.toLocaleString()}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <SummaryCard label="当前总资产" amount={currentTotalAssets} type="balance" subtext="实时余额汇总" />
                <SummaryCard label="本月净资产增长 (攒钱)" amount={assetGrowth} type={assetGrowth >= 0 ? 'income' : 'expense'} subtext="与上月快照相比" highlight />
                <SummaryCard label="推算日常消费 (不含贷款)" amount={derivedConsumption} type="expense" subtext={`记账统计: ¥${variableExpense.toLocaleString()}`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-medium text-slate-700 mb-6 flex items-center gap-2"><TrendingDown size={18} className="text-red-500"/> 支出参考</h3>
                    <div className="space-y-4">
                        <ProgressBar label="房贷/车贷 (固定)" amount={config.monthlyLoan} total={config.monthlyLoan + variableExpense} color="bg-orange-400" />
                        <ProgressBar label="日常消费 (记账值)" amount={variableExpense} total={config.monthlyLoan + variableExpense} color="bg-blue-500" />
                    </div>
                </div>
                <div className="glass rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-medium text-slate-700 mb-6 flex items-center gap-2"><PieChart size={18} className="text-blue-500"/> 资产分布</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {assets.map(asset => (
                            <div key={asset.id}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-700">{asset.bankName} ({asset.currency})</span>
                                    <span className="font-medium">{asset.currency === 'USD'?'$':'¥'}{asset.balance.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full"><div className="h-full bg-slate-800 rounded-full opacity-80" style={{ width: `${currentTotalAssets>0 ? (toCNY(asset.balance,asset.currency)/currentTotalAssets)*100 : 0}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Budget View ---
const BudgetView = ({ config, onUpdateConfig, assets, onAddAsset, onUpdateAsset, onDeleteAsset, onExport, onImport }: any) => {
    const [newAsset, setNewAsset] = useState({ name: '', balance: '', currency: 'CNY' as Currency });
    
    const handleAdd = () => {
        if(!newAsset.name || !newAsset.balance) return;
        onAddAsset({ id: Date.now().toString(), bankName: newAsset.name, balance: parseFloat(newAsset.balance), currency: newAsset.currency, type: 'savings' });
        setNewAsset({ name: '', balance: '', currency: 'CNY' });
    };

    return (
        <div className="space-y-8 animate-slide-in">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-slate-900">资产与预算</h1>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    <ArrowLeftRight size={14} className="text-slate-400"/>
                    <span className="text-sm text-slate-500">汇率:</span>
                    <input type="number" value={config.exchangeRate} onChange={e=>onUpdateConfig({...config, exchangeRate: Number(e.target.value)})} className="w-12 text-center bg-transparent font-medium outline-none"/>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold mb-4 flex items-center gap-2"><Settings size={18}/> 固定收支模型</h2>
                        <div className="space-y-4">
                            <InputGroup label="固定工资" value={config.salaryIncome.amount} currency={config.salaryIncome.currency} 
                                onChangeV={v=>onUpdateConfig({...config, salaryIncome:{...config.salaryIncome, amount:v}})}
                                onChangeC={c=>onUpdateConfig({...config, salaryIncome:{...config.salaryIncome, currency:c}})} />
                            <InputGroup label="固定房租" value={config.rentalIncome.amount} currency={config.rentalIncome.currency}
                                onChangeV={v=>onUpdateConfig({...config, rentalIncome:{...config.rentalIncome, amount:v}})}
                                onChangeC={c=>onUpdateConfig({...config, rentalIncome:{...config.rentalIncome, currency:c}})} />
                            <SimpleInput label="社保/公积金" value={config.monthlySocialSecurity} onChange={v=>onUpdateConfig({...config, monthlySocialSecurity:v})} />
                            <SimpleInput label="房贷/车贷" value={config.monthlyLoan} onChange={v=>onUpdateConfig({...config, monthlyLoan:v})} />
                            <SimpleInput label="上月总资产(基准)" value={config.lastMonthTotalAssets} onChange={v=>onUpdateConfig({...config, lastMonthTotalAssets:v})} note="每月1号自动更新" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold mb-4 flex items-center gap-2"><HardDrive size={18}/> 数据备份</h2>
                        <div className="flex gap-3">
                            <button onClick={onExport} className="flex-1 flex justify-center items-center gap-2 bg-slate-100 py-2 rounded-lg text-sm font-medium hover:bg-slate-200"><Download size={16}/> 导出</button>
                            <label className="flex-1 flex justify-center items-center gap-2 bg-slate-100 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 cursor-pointer">
                                <Upload size={16}/> 导入 <input type="file" accept=".json" onChange={onImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="font-semibold mb-4 flex items-center gap-2"><Building size={18}/> 资产列表</h2>
                        <div className="flex gap-2 mb-4">
                            <input placeholder="账户名称" value={newAsset.name} onChange={e=>setNewAsset({...newAsset, name:e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none"/>
                            <input type="number" placeholder="余额" value={newAsset.balance} onChange={e=>setNewAsset({...newAsset, balance:e.target.value})} className="w-24 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none"/>
                            <select value={newAsset.currency} onChange={e=>setNewAsset({...newAsset, currency:e.target.value as Currency})} className="bg-slate-50 border border-slate-200 rounded text-sm outline-none"><option value="CNY">¥</option><option value="USD">$</option></select>
                            <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={18}/></button>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {assets.map((a: Asset) => <AssetItem key={a.id} asset={a} onUpdate={onUpdateAsset} onDelete={onDeleteAsset} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Transactions View ---
const TransactionsView = ({ transactions, onDelete }: { transactions: Transaction[], onDelete: (id: string) => void }) => {
    const [filter, setFilter] = useState('');
    const filtered = transactions.filter(t => t.description.includes(filter) || t.category.includes(filter));

    return (
        <div className="space-y-6 animate-slide-in">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">账单明细</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        placeholder="搜索..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
            </header>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">暂无记录</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(t => (
                            <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type==='expense'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>
                                        {t.type==='expense' ? <TrendingDown size={18}/> : <Wallet size={18}/>}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{t.description}</div>
                                        <div className="text-xs text-slate-500">{t.date} · {t.category}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-semibold ${t.type==='expense'?'text-slate-900':'text-green-600'}`}>
                                        {t.type==='expense'?'-':'+'} {t.currency==='USD'?'$':'¥'}{t.amount}
                                    </span>
                                    <button onClick={() => onDelete(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- AI Analysis View ---
const AIAnalysisView = ({ transactions, assets, config }: any) => {
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const prompt = `
                我是你的理财助手。以下是我的财务数据：
                1. 资产: ${JSON.stringify(assets.map(a => ({ name: a.bankName, balance: a.balance, currency: a.currency })))}
                2. 固定月支出: 房贷 ${config.monthlyLoan}, 社保 ${config.monthlySocialSecurity}
                3. 本月交易: ${JSON.stringify(transactions.slice(0, 20))}
                4. 汇率: 1 USD = ${config.exchangeRate} CNY
                
                请分析我的消费习惯，指出我是否存下了足够的钱，并给出简短的建议。请用 Markdown 格式。
            `;
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });
            setAnalysis(res.text || "无法生成分析结果。");
        } catch (e) {
            setAnalysis("AI 服务暂时不可用，请检查网络或 API Key。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-slide-in">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">AI 财务分析</h1>
                <button 
                    onClick={runAnalysis} 
                    disabled={loading}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex items-center gap-2"
                >
                    <Sparkles size={18} /> {loading ? '分析中...' : '开始分析'}
                </button>
            </header>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[300px] prose prose-slate max-w-none">
                {analysis ? (
                    <div dangerouslySetInnerHTML={{ 
                        // Simple markdown render for demo, in prod use a lib
                        __html: analysis.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') 
                    }} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                        <Sparkles size={48} className="opacity-20" />
                        <p>点击右上角按钮，让 Gemini AI 分析您的财务状况。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helpers & Modals ---

const AssetItem = ({ asset, onUpdate, onDelete }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState({ ...asset, balance: asset.balance.toString() });

    const save = () => {
        onUpdate({ ...editState, balance: parseFloat(editState.balance) || 0 });
        setIsEditing(false);
    };

    if(isEditing) return (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <input value={editState.bankName} onChange={e=>setEditState({...editState, bankName:e.target.value})} className="flex-1 bg-white border px-2 py-1 rounded text-sm"/>
            <input value={editState.balance} onChange={e=>setEditState({...editState, balance:e.target.value})} className="w-20 bg-white border px-2 py-1 rounded text-sm" type="number"/>
            <select value={editState.currency} onChange={e=>setEditState({...editState, currency:e.target.value})} className="bg-white border px-1 py-1 rounded text-xs"><option value="CNY">¥</option><option value="USD">$</option></select>
            <button onClick={save} className="text-green-600"><Check size={16}/></button>
            <button onClick={()=>setIsEditing(false)} className="text-slate-400"><X size={16}/></button>
        </div>
    );

    return (
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
            <div>
                <div className="font-medium text-slate-700">{asset.bankName}</div>
                <div className="text-xs text-slate-400">{asset.currency}</div>
            </div>
            <div className="flex items-center gap-3">
                <span className="font-semibold">{asset.currency==='USD'?'$':'¥'}{asset.balance.toLocaleString()}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setIsEditing(true)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded"><Pencil size={14}/></button>
                    <button onClick={()=>onDelete(asset.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded"><Trash2 size={14}/></button>
                </div>
            </div>
        </div>
    );
};

const AddTransactionModal = ({ config, onClose, onSave }: any) => {
    const [input, setInput] = useState('');
    const [currency, setCurrency] = useState<Currency>('CNY');
    const [loading, setLoading] = useState(false);

    const handleSmartEntry = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Parse finance log: "${input}". Default currency ${currency}. Return JSON: { description: string, amount: number, category: string, type: 'expense'|'income', currency: 'CNY'|'USD' }`
            });
            const text = res.text?.replace(/```json|```/g, '').trim();
            const data = JSON.parse(text || '{}');
            
            onSave({
                id: Date.now().toString(),
                description: data.description || input,
                amount: data.amount || 0,
                currency: data.currency || currency,
                category: data.category || '其他',
                type: data.type || 'expense',
                date: new Date().toISOString().slice(0, 10)
            });
            onClose();
        } catch (e) {
            alert("AI 识别失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">记一笔 (AI 智能)</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrency(c => c === 'CNY' ? 'USD' : 'CNY')} className="text-xs font-bold bg-slate-100 px-2 py-1 rounded uppercase tracking-wide text-slate-600">
                            {currency} 模式
                        </button>
                        <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
                    </div>
                </div>
                <textarea 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`例如：\n"打车花了 30"\n"收到工资 20000"\n"Bought coffee for 5 USD"`}
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                    autoFocus
                />
                <button 
                    onClick={handleSmartEntry}
                    disabled={loading || !input}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Sparkles className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                    {loading ? '分析中...' : '确认'}
                </button>
            </div>
        </div>
    );
};

// UI Components
const SummaryCard = ({ label, amount, type, subtext, highlight }: any) => (
    <div className={`p-6 rounded-2xl border ${highlight ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'} shadow-sm`}>
        <div className="text-sm text-slate-500 mb-2">{label}</div>
        <div className={`text-2xl font-semibold ${type==='expense'?'text-slate-900':type==='income'?'text-green-600':'text-slate-900'}`}>
            ¥{amount.toLocaleString(undefined, {maximumFractionDigits:0})}
        </div>
        {subtext && <div className="text-xs text-slate-400 mt-1">{subtext}</div>}
    </div>
);

const ProgressBar = ({ label, amount, total, color }: any) => (
    <div>
        <div className="flex justify-between text-sm mb-1 text-slate-600"><span>{label}</span><span>¥{amount.toLocaleString()}</span></div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{width:`${total>0?(amount/total)*100:0}%`}}></div></div>
    </div>
);

const InputGroup = ({ label, value, currency, onChangeV, onChangeC }: any) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <div className="flex gap-2">
            <input type="number" value={value} onChange={e=>onChangeV(Number(e.target.value))} className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none"/>
            <select value={currency} onChange={e=>onChangeC(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 text-sm"><option value="CNY">CNY</option><option value="USD">USD</option></select>
        </div>
    </div>
);

const SimpleInput = ({ label, value, onChange, note }: any) => (
    <div>
        <label className="flex justify-between text-xs font-medium text-slate-500 mb-1"><span>{label}</span>{note && <span className="text-slate-400 font-normal">{note}</span>}</label>
        <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 text-sm">¥</span>
            <input type="number" value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full pl-7 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none"/>
        </div>
    </div>
);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);