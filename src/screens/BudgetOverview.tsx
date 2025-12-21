import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface Category {
  id: number;
  name: string;
  spent: number;
  limit: number;
  icon: string;
  color: 'yellow' | 'red' | 'blue' | 'green' | 'purple';
}

interface Transaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  categoryId: number;
}

export default function BudgetOverview() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('This Paycheck');

  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Groceries', spent: 380, limit: 500, icon: 'shopping_cart', color: 'yellow' },
    { id: 2, name: 'Utilities', spent: 150, limit: 200, icon: 'lightbulb', color: 'blue' },
    { id: 3, name: 'Gas', spent: 120, limit: 100, icon: 'local_gas_station', color: 'red' },
    { id: 4, name: 'Entertainment', spent: 50, limit: 150, icon: 'movie', color: 'purple' },
  ]);

  const [transactions] = useState<Transaction[]>([
    { id: 1, name: 'Whole Foods Market', amount: 145.20, date: 'Oct 24', categoryId: 1 },
    { id: 5, name: 'City Power & Light', amount: 120.00, date: 'Oct 15', categoryId: 2 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    spent: '',
    icon: 'category',
    color: 'blue' as Category['color']
  });

  const totalBudget = categories.reduce((acc, cat) => acc + cat.limit, 0);
  const totalSpent = categories.reduce((acc, cat) => acc + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        limit: category.limit.toString(),
        spent: category.spent.toString(),
        icon: category.icon,
        color: category.color
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        limit: '',
        spent: '0',
        icon: 'category',
        color: 'blue'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.limit) return;
    const limitNum = parseFloat(formData.limit);
    const spentNum = parseFloat(formData.spent || '0');

    if (editingId) {
      setCategories(categories.map(c => c.id === editingId ? {
        ...c,
        name: formData.name,
        limit: limitNum,
        spent: spentNum,
        icon: formData.icon,
        color: formData.color
      } : c));
    } else {
      setCategories([...categories, {
        id: Date.now(),
        name: formData.name,
        limit: limitNum,
        spent: spentNum,
        icon: formData.icon,
        color: formData.color
      }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingId) {
      setCategories(categories.filter(c => c.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 90) return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light font-sans text-slate-900 transition-colors duration-200">
      <div className="sticky top-0 z-20 flex items-center bg-background-light/90 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/40 transition-colors md:p-6 md:pb-0">
        <button onClick={() => navigate(-1)} className="neo-btn flex size-9 shrink-0 items-center justify-center rounded-full text-slate-800 shadow-sm">
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-black leading-tight tracking-tight flex-1 text-center">Budget Control</h1>
        <div className="size-9"></div>
      </div>

      <div className="flex px-4 py-3 md:px-6">
        <div className="neo-inset flex h-10 w-full md:w-auto items-center justify-center p-1 rounded-xl">
          {['This Paycheck', 'This Month'].map((item) => (
            <label key={item} className={clsx(
              "flex-1 flex cursor-pointer h-full px-6 items-center justify-center overflow-hidden rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              period === item ? "bg-white shadow-sm text-primary" : "text-slate-400"
            )}>
              <span className="truncate">{item}</span>
              <input
                checked={period === item}
                className="invisible w-0 absolute"
                type="radio"
                name="period-selector"
                onChange={() => setPeriod(item)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 md:px-6">
        <div className="neo-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
            <span className="material-symbols-outlined text-7xl font-bold">savings</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Remaining Safe Spend</p>
          <p className="text-4xl font-black text-slate-900 tracking-tighter mb-2">${totalRemaining.toLocaleString()}</p>
          <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 py-2 px-4 bg-slate-50/50 rounded-full neo-inset">
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-slate-300"></span>Budget: ${totalBudget.toLocaleString()}</span>
            <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary/40"></span>Spent: ${totalSpent.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 gap-3 pb-24 md:px-6 md:grid md:grid-cols-2 lg:grid-cols-3 pt-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleOpenModal(cat)}
            className="neo-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all"
          >
            <div className="neo-inset flex items-center justify-center rounded-2xl shrink-0 size-12 text-slate-700 bg-white">
              <span className="material-symbols-outlined text-2xl font-bold">{cat.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-1.5">
                <p className="font-black text-slate-900 text-sm tracking-tight">{cat.name}</p>
                <div className="text-right">
                  <p className={clsx("text-[10px] font-black uppercase tracking-widest", cat.spent > cat.limit ? "text-red-500" : "text-primary")}>
                    {Math.round((cat.spent / cat.limit) * 100)}% Used
                  </p>
                </div>
              </div>
              <div className="neo-inset h-3 w-full rounded-full overflow-hidden p-[2px] bg-slate-100">
                <div
                  className={clsx("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", getProgressColor(cat.spent, cat.limit))}
                  style={{ width: `${Math.min((cat.spent / cat.limit) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span>${cat.spent.toLocaleString()} spent</span>
                <span>${cat.limit.toLocaleString()} budget</span>
              </div>
            </div>
          </div>
        ))}

        <div className="fixed bottom-6 right-6 md:hidden">
          <button
            onClick={() => handleOpenModal()}
            className="neo-btn-primary flex size-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm p-0 pb-20 sm:p-4 animate-fade-in">
          <div className="neo-card w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 transform transition-transform animate-slide-up sm:animate-none">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="neo-btn rounded-full p-2 text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50/50 rounded-2xl p-6 neo-inset flex flex-col items-center justify-center mb-6">
                <div className="neo-card size-16 rounded-full flex items-center justify-center text-primary mb-3 bg-white">
                  <span className="material-symbols-outlined text-3xl font-bold">{formData.icon}</span>
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{formData.name || 'Category'}</h3>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">${parseFloat(formData.limit || '0').toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="neo-inset w-full p-3.5 text-slate-900 font-black text-sm rounded-xl focus:outline-none"
                  placeholder="e.g. Dining Out"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Limit ($)</label>
                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                    className="neo-inset w-full p-3.5 text-slate-900 font-black text-sm rounded-xl focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-1">Actual Spent</label>
                  <input
                    type="number"
                    value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                    className="neo-inset w-full p-3.5 text-slate-900 font-black text-sm rounded-xl focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {editingId && (
                  <button onClick={handleDelete} className="px-5 py-3 rounded-xl border-2 border-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Delete</button>
                )}
                <div className="flex-1"></div>
                <button onClick={handleSave} className="neo-btn-primary px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}