import { useState, useEffect } from 'react';
import { Baby, Activity, Droplets, Pill, User, UserPlus, Calendar, Scale, Thermometer, Camera, X, ZoomIn, Trash } from 'lucide-react';
import { Patient, Medication, DailyLog, LabResult, FEEDING_OPTIONS } from '../types';
import { useMedications, useDailyLogs, useLabResults } from '../hooks/usePatients';

interface PatientCardProps {
  patient: Patient;
  onUpdate: (id: string, updates: Partial<Patient>) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'critical': return 'card-status-red';
    case 'active': return 'card-status-green';
    case 'discharged': return 'card-status-blue';
    default: return 'card-status-blue';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'critical': return 'حرج';
    case 'active': return 'نشط';
    case 'discharged': return 'خرج';
    default: return status;
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    case 'active': return 'bg-green-100 text-green-700 border-green-300';
    case 'discharged': return 'bg-blue-100 text-blue-700 border-blue-300';
    default: return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

export function PatientCard({ patient, onUpdate }: PatientCardProps) {
  const { medications, addMedication, updateMedication } = useMedications(patient.id);
  const { logs, addLog, updateLog, getTodayLogs } = useDailyLogs(patient.id);
  const { results: labResults, addResult, deleteResult } = useLabResults(patient.id);

  const [showFeedingMenu, setShowFeedingMenu] = useState(false);
  const [outputStatus, setOutputStatus] = useState<'done' | 'pending'>('pending');
  const [urinationStatus, setUrinationStatus] = useState<'done' | 'pending'>('pending');
  const [showLabUpload, setShowLabUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState<LabResult | null>(null);
  const [newNursePrimary, setNewNursePrimary] = useState(patient.nurse_primary || '');
  const [newNurseSecondary, setNewNurseSecondary] = useState(patient.nurse_secondary || '');
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');

  const todayLogs = getTodayLogs();

  useEffect(() => {
    const lastOutput = todayLogs.find(l => l.log_type === 'output');
    const lastUrination = todayLogs.find(l => l.log_type === 'urination');
    setOutputStatus(lastOutput && lastOutput.completed_at ? 'done' : 'pending');
    setUrinationStatus(lastUrination && lastUrination.completed_at ? 'done' : 'pending');
  }, [todayLogs]);

  useEffect(() => {
    const lastOutputLog = todayLogs.find(l => l.log_type === 'output');
    if (lastOutputLog?.completed_at) {
      const completedTime = new Date(lastOutputLog.completed_at).getTime();
      const hoursPassed = (Date.now() - completedTime) / (1000 * 60 * 60);
      if (hoursPassed >= 24) setOutputStatus('pending');
    }
  }, [todayLogs]);

  const handleFeeding = (option: typeof FEEDING_OPTIONS[0]) => {
    addLog({
      patient_id: patient.id, log_date: new Date().toISOString().split('T')[0], log_type: 'feeding',
      value: option.value, amount_ml: option.value === 'NPO' ? 0 : parseInt(option.value),
      completed_at: new Date().toISOString(),
    });
    setShowFeedingMenu(false);
  };

  const handleOutput = () => {
    const newStatus = outputStatus === 'done' ? 'pending' : 'done';
    setOutputStatus(newStatus);
    const existingLog = todayLogs.find(l => l.log_type === 'output');
    if (existingLog) {
      updateLog(existingLog.id, { completed_at: newStatus === 'done' ? new Date().toISOString() : null });
    } else {
      addLog({ patient_id: patient.id, log_date: new Date().toISOString().split('T')[0], log_type: 'output', value: newStatus === 'done' ? 'تم الخروج' : 'لم يتم', completed_at: newStatus === 'done' ? new Date().toISOString() : null });
    }
  };

  const handleUrination = () => {
    const newStatus = urinationStatus === 'done' ? 'pending' : 'done';
    setUrinationStatus(newStatus);
    const existingLog = todayLogs.find(l => l.log_type === 'urination');
    if (existingLog) {
      updateLog(existingLog.id, { completed_at: newStatus === 'done' ? new Date().toISOString() : null });
    } else {
      addLog({ patient_id: patient.id, log_date: new Date().toISOString().split('T')[0], log_type: 'urination', value: newStatus === 'done' ? 'تم الإدرار' : 'لم يتم', completed_at: newStatus === 'done' ? new Date().toISOString() : null });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      addResult({ patient_id: patient.id, image_url: dataUrl, thumbnail_url: dataUrl, analysis_type: null, uploaded_by: null });
    };
    reader.readAsDataURL(file);
    setShowLabUpload(false);
  };

  const handleAddMedication = () => {
    if (!medName.trim()) return;
    addMedication({ patient_id: patient.id, name: medName, dosage: medDosage, frequency: medFrequency, start_date: new Date().toISOString().split('T')[0], is_active: true, times: [] });
    setMedName(''); setMedDosage(''); setMedFrequency('');
    setShowAddMedication(false);
  };

  return (
    <div className={'rounded-2xl shadow-lg p-5 transition-all hover:shadow-xl ${getStatusColor(patient.status)}'}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-medical-primary to-medical-secondary rounded-full flex items-center justify-center shadow-md">
            <Baby className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{patient.name}</h3>
            <span className={'inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBgColor(patient.status)}'}>{getStatusLabel(patient.status)}</span>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/60 rounded-lg p-3 flex items-center gap-2">
          <Scale className="w-5 h-5 text-medical-primary" />
          <div><div className="text-xs text-slate-500">الوزن الحالي</div><div className="font-bold text-slate-800">{patient.weight} كغ</div></div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-medical-secondary" />
          <div><div className="text-xs text-slate-500">عمر الحمل GA</div><div className="font-bold text-slate-800">{patient.gestational_age} أسبوع</div></div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-medical-warning" />
          <div><div className="text-xs text-slate-500">تاريخ الدخول</div><div className="font-bold text-slate-800 text-sm">{new Date(patient.admission_date).toLocaleDateString('ar-SA')}</div></div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-medical-success" />
          <div><div className="text-xs text-slate-500">تاريخ الحاضنة</div><div className="font-bold text-slate-800 text-sm">{patient.incubator_date ? new Date(patient.incubator_date).toLocaleDateString('ar-SA') : '-'}</div></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-4">
        <h4 className="section-title"><Activity className="w-4 h-4" />الإجراءات السریعة</h4>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button onClick={() => setShowFeedingMenu(!showFeedingMenu)} className="btn-action bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg">
              <span className="text-2xl">🍼</span><span className="text-xs font-medium">الرضاعة</span>
            </button>
            {showFeedingMenu && (<div className="dropdown-menu"><div className="px-3 py-2 bg-slate-50 font-medium text-slate-700 border-b">اختر الكمية</div>{FEEDING_OPTIONS.map((option) => (<div key={option.value} className="dropdown-item" onClick={() => handleFeeding(option)}>{option.label}</div>))}</div>)}
          </div>
          <button onClick={handleOutput} className={'btn-action shadow-md hover:shadow-lg transition-all ${outputStatus === 'done' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-gradient-to-br from-red-500 to-red-600 text-white'}'}>
            <span className="text-2xl">💩</span><span className="text-xs font-medium">الخروج</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 bg-white/30">{outputStatus === 'done' ? 'تم' : 'لم يتم'}</span>
          </button>
          <button onClick={handleUrination} className={'btn-action shadow-md hover:shadow-lg transition-all ${urinationStatus === 'done' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'}'}>
            <span className="text-2xl">💧</span><span className="text-xs font-medium">الإدرار</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 bg-white/30">{urinationStatus === 'done' ? 'تم' : 'لم يتم'}</span>
          </button>
          <button onClick={() => setShowLabUpload(true)} className="btn-action bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg">
            <Camera className="w-5 h-5" /><span className="text-xs font-medium">رفع صورة التحليل</span>
          </button>
        </div>
      </div>

      {/* Medications Section */}
      <div className="mb-4">
        <h4 className="section-title"><Pill className="w-4 h-4" />جدول العلاجات النشطة</h4>
        <div className="bg-white/60 rounded-lg overflow-hidden">
          {medications.filter(m => m.is_active).length === 0 ? (<div className="p-4 text-center text-slate-500 text-sm">لا توجد علاجات نشطة</div>) : (<div className="divide-y divide-slate-200">{medications.filter(m => m.is_active).map((med) => (<MedicationRow key={med.id} medication={med} onToggleTime={(time) => { const currentTimes = med.times || []; if (currentTimes.includes(time)) { updateMedication(med.id, { times: currentTimes.filter(t => t !== time) }); } else { updateMedication(med.id, { times: [...currentTimes, time] }); } }} />))}</div>)}
        </div>
        <button onClick={() => setShowAddMedication(true)} className="mt-2 w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-medical-primary hover:text-medical-primary transition-colors text-sm">+ إضافة علاج جديد</button>
      </div>

      {/* TPN & Fluids */}
      <div className="mb-4">
        <h4 className="section-title"><Droplets className="w-4 h-4" />حالة السوائل والـ TPN</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">TPN</div><select value={patient.tpn_status} onChange={(e) => onUpdate(patient.id, { tpn_status: e.target.value })} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm"><option value="نشط">نشط</option><option value="متوقف">متوقف</option><option value="معلق">معلق</option></select></div>
          <div className="bg-white/60 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">السوائل</div><select value={patient.fluids_status} onChange={(e) => onUpdate(patient.id, { fluids_status: e.target.value })} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm"><option value="نشط">نشط</option><option value="متوقف">متوقف</option><option value="معلق">معلق</option></select></div>
        </div>
      </div>

      {/* Nursing Staff */}
      <div className="mb-4">
        <h4 className="section-title"><User className="w-4 h-4" />الكادر المسؤول</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/60 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> الممرضة المسؤولة</div><div className="flex gap-2"><input type="text" value={newNursePrimary} onChange={(e) => setNewNursePrimary(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-sm" placeholder="اسم الممرضة" /><button onClick={() => onUpdate(patient.id, { nurse_primary: newNursePrimary })} className="px-3 py-1.5 bg-medical-primary text-white rounded text-sm">حفظ</button></div></div>
          <div className="bg-white/60 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><UserPlus className="w-3 h-3" /> الممرضة الخفر</div><div className="flex gap-2"><input type="text" value={newNurseSecondary} onChange={(e) => setNewNurseSecondary(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-sm" placeholder="اسم الممرضة" /><button onClick={() => onUpdate(patient.id, { nurse_secondary: newNurseSecondary })} className="px-3 py-1.5 bg-medical-secondary text-white rounded text-sm">حفظ</button></div></div>
        </div>
      </div>

      {/* Lab Results Thumbnails */}
      {labResults.length > 0 && (<div className="mb-4"><h4 className="section-title"><Camera className="w-4 h-4" />صور التحاليل ({labResults.length})</h4><div className="flex flex-wrap gap-2">{labResults.map((result) => (<div key={result.id} className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-medical-primary transition-colors cursor-pointer" onClick={() => setSelectedImage(result)}><img src={result.thumbnail_url || result.image_url} alt="تحليل" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="w-4 h-4 text-white" /></div></div>))}</div></div>)}

      {/* Image Modal */}
      {selectedImage && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}><div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}><button onClick={() => setSelectedImage(null)} className="absolute top-2 left-2 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"><X className="w-5 h-5" /></button><button onClick={() => { deleteResult(selectedImage.id); setSelectedImage(null); }} className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"><Trash className="w-4 h-4" /></button><img src={selectedImage.image_url} alt="تحليل مكبر" className="max-w-full max-h-[80vh] object-contain" /><div className="p-3 bg-slate-100 text-center text-sm text-slate-600">تم الرفع: {new Date(selectedImage.uploaded_at).toLocaleString('ar-SA')}</div></div></div>)}

      {/* Lab Upload Modal */}
      {showLabUpload && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLabUpload(false)}><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-800">رفع صورة التحليل</h3><button onClick={() => setShowLabUpload(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div><div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-medical-primary transition-colors"><Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" /><p className="text-slate-600 mb-3">اضغط لالتقاط صورة أو رفع ملف</p><button className="relative px-6 py-2 bg-medical-primary text-white rounded-lg"><input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />التقط صورة أو اختر ملف</button></div></div></div>)}

      {/* Add Medication Modal */}
      {showAddMedication && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddMedication(false)}><div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-slate-800">إضافة علاج جديد</h3><button onClick={() => setShowAddMedication(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div><div className="space-y-4"><div><label className="text-sm text-slate-600 mb-1 block">اسم العلاج</label><input type="text" value={medName} onChange={(e) => setMedName(e.target.value)} className="input-field" placeholder="مثال: أموكسيسيلين" /></div><div><label className="text-sm text-slate-600 mb-1 block">الجرعة</label><input type="text" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="input-field" placeholder="مثال: 50 مغ/كغ" /></div><div><label className="text-sm text-slate-600 mb-1 block">التكرار</label><input type="text" value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} className="input-field" placeholder="مثال: كل 8 ساعات" /></div><button onClick={handleAddMedication} disabled={!medName.trim()} className="w-full py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-secondary transition-colors disabled:opacity-50">إضافة</button></div></div></div>)}
    </div>
  );
}

interface MedicationRowProps { medication: Medication; onToggleTime: (time: string) => void; }
function MedicationRow({ medication, onToggleTime }: MedicationRowProps) {
  const standardTimes = ['08:00', '16:00', '00:00'];
  return (<div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2"><div className="flex-1"><div className="font-medium text-slate-800">{medication.name}</div><div className="text-xs text-slate-500">{medication.dosage} | {medication.frequency}</div></div><div className="flex items-center gap-2 flex-wrap">{standardTimes.map((time) => (<button key={time} onClick={() => onToggleTime(time)} className={'px-3 py-1 rounded-lg text-xs font-medium transition-all ${medication.times?.includes(time) ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}'}>{time}{medication.times?.includes(time) && ' ✓'}</button>))}</div></div>);
}
