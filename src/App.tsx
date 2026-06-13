import { useState } from 'react';
import { Baby, Plus, AlertCircle, Loader2, Filter, LayoutGrid, List, X } from 'lucide-react';
import { Header } from './components/Header';
import { PatientCard } from './components/PatientCard';
import { usePatients } from './hooks/usePatients';
import { Patient } from './types';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'critical' | 'discharged';

function App() {
  const { patients, loading, addPatient, updatePatient, deletePatient, refresh } = usePatients();
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [newPatient, setNewPatient] = useState({
    name: '', weight: 1.5, gestational_age: 32, admission_date: new Date().toISOString().split('T')[0],
    incubator_date: '', status: 'active' as Patient['status'], nurse_primary: '', nurse_secondary: '',
  });

  const handleSync = () => { setSyncing(true); setTimeout(() => { refresh(); setSyncing(false); }, 1000); };

  const handleAddPatient = () => {
    if (!newPatient.name.trim()) return;
    addPatient({ ...newPatient, incubator_date: newPatient.incubator_date || null, tpn_status: 'pending', fluids_status: 'pending' });
    setNewPatient({ name: '', weight: 1.5, gestational_age: 32, admission_date: new Date().toISOString().split('T')[0], incubator_date: '', status: 'active', nurse_primary: '', nurse_secondary: '' });
    setShowAddModal(false);
  };

  const filteredPatients = patients.filter(p => filterStatus === 'all' || p.status === filterStatus).filter(p => searchTerm.trim() === '' || p.name.includes(searchTerm) || p.nurse_primary?.includes(searchTerm) || p.nurse_secondary?.includes(searchTerm)).sort((a, b) => { const statusOrder: Record<string, number> = { critical: 0, active: 1, discharged: 2 }; return a.status !== b.status ? statusOrder[a.status] - statusOrder[b.status] : new Date(b.admission_date).getTime() - new Date(a.admission_date).getTime(); });

  const stats = { total: patients.length, active: patients.filter(p => p.status === 'active').length, critical: patients.filter(p => p.status === 'critical').length, discharged: patients.filter(p => p.status === 'discharged').length };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50" dir="rtl">
      <Header onSync={handleSync} syncing={syncing} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3"><div className="w-12 h-12 bg-medical-primary/10 rounded-full flex items-center justify-center"><Baby className="w-6 h-6 text-medical-primary" /></div><div><div className="text-2xl font-bold text-slate-800">{stats.total}</div><div className="text-sm text-slate-500">إجمالي المرضى</div></div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><Baby className="w-6 h-6 text-green-600" /></div><div><div className="text-2xl font-bold text-green-600">{stats.active}</div><div className="text-sm text-slate-500">نشط</div></div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-600" /></div><div><div className="text-2xl font-bold text-red-600">{stats.critical}</div><div className="text-sm text-slate-500">حالة حرجة</div></div></div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Baby className="w-6 h-6 text-blue-600" /></div><div><div className="text-2xl font-bold text-blue-600">{stats.discharged}</div><div className="text-sm text-slate-500">خرج</div></div></div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث عن مريض..." className="input-field max-w-[200px]" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FilterStatus)} className="input-field w-auto min-w-[120px]"><option value="all">جميع الحالات</option><option value="critical">حالات حرجة</option><option value="active">نشط</option><option value="discharged">خرج</option></select>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden"><button onClick={() => setViewMode('grid')} className={'p-2 ${viewMode === 'grid' ? 'bg-medical-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}'}><LayoutGrid className="w-5 h-5" /></button><button onClick={() => setViewMode('list')} className={'p-2 ${viewMode === 'list' ? 'bg-medical-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}'}><List className="w-5 h-5" /></button></div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-medical-primary text-white px-4 py-2 rounded-lg hover:bg-medical-secondary transition-colors shadow-md"><Plus className="w-5 h-5" /><span>إضافة مريض جديد</span></button>
        </div>

        {/* Patient Cards */}
        {loading ? (<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-medical-primary animate-spin" /></div>) : filteredPatients.length === 0 ? (<div className="text-center py-20"><Baby className="w-16 h-16 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 text-lg mb-2">لا يوجد مرضى حالياً</p><p className="text-slate-400 text-sm">{patients.length === 0 ? 'اضغط على "تحميل بيانات تجريبية" لعرض بيانات تجريبية' : 'لا توجد نتائج مطابقة للبحث'}</p></div>) : (<div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>{filteredPatients.map((patient) => (<PatientCard key={patient.id} patient={patient} onUpdate={(id, updates) => updatePatient(id, updates)} />))}</div>)}
      </main>

      {/* Add Patient Modal */}
      {showAddModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}><div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl my-8" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-slate-800">إضافة مريض جديد</h3><button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-6 h-6" /></button></div><div className="space-y-4"><div><label className="text-sm font-medium text-slate-700 mb-1 block">اسم المريض *</label><input type="text" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} className="input-field" placeholder="الاسم الكامل للطفل" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-slate-700 mb-1 block">الوزن (كغ) *</label><input type="number" step="0.01" min="0.5" max="5" value={newPatient.weight} onChange={(e) => setNewPatient({ ...newPatient, weight: parseFloat(e.target.value) || 0 })} className="input-field" required /></div><div><label className="text-sm font-medium text-slate-700 mb-1 block">عمر الحمل (GA) *</label><input type="number" min="24" max="42" value={newPatient.gestational_age} onChange={(e) => setNewPatient({ ...newPatient, gestational_age: parseInt(e.target.value) || 0 })} className="input-field" required /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-slate-700 mb-1 block">تاريخ الدخول *</label><input type="date" value={newPatient.admission_date} onChange={(e) => setNewPatient({ ...newPatient, admission_date: e.target.value })} className="input-field" required /></div><div><label className="text-sm font-medium text-slate-700 mb-1 block">تاريخ الحاضنة</label><input type="date" value={newPatient.incubator_date} onChange={(e) => setNewPatient({ ...newPatient, incubator_date: e.target.value })} className="input-field" /></div></div><div><label className="text-sm font-medium text-slate-700 mb-1 block">الحالة</label><select value={newPatient.status} onChange={(e) => setNewPatient({ ...newPatient, status: e.target.value as Patient['status'] })} className="input-field"><option value="active">نشط</option><option value="critical">حالة حرجة</option><option value="discharged">خرج</option></select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-slate-700 mb-1 block">الممرضة المسؤولة</label><input type="text" value={newPatient.nurse_primary} onChange={(e) => setNewPatient({ ...newPatient, nurse_primary: e.target.value })} className="input-field" placeholder="اسم الممرضة" /></div><div><label className="text-sm font-medium text-slate-700 mb-1 block">الممرضة الخفر</label><input type="text" value={newPatient.nurse_secondary} onChange={(e) => setNewPatient({ ...newPatient, nurse_secondary: e.target.value })} className="input-field" placeholder="اسم الممرضة" /></div></div><div className="flex gap-3 pt-4"><button onClick={handleAddPatient} disabled={!newPatient.name.trim()} className="flex-1 py-3 bg-medical-primary text-white rounded-lg hover:bg-medical-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">إضافة المريض</button><button onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">إلغاء</button></div></div></div></div>)}
    </div>
  );
}

export default App;
