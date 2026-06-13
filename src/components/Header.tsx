import { useState, useEffect } from 'react';
import { RefreshCw, Link, AlertCircle, CheckCircle, Clipboard, FileJson, X } from 'lucide-react';
import { localStorageService } from '../lib/storage';
import { Patient, Medication, MEDICATION_EXAMPLES } from '../types';

interface HeaderProps {
  onSync: () => void;
  syncing: boolean;
}

const DEFAULT_URL = 'https://hasanain-coder.github.io/Documentation2/data.json';
const STORAGE_KEY_URL = 'nicu_sync_url';

const generateDemoPatients = (): void => {
  const existing = localStorageService.getPatients();
  if (existing.length > 0) return;

  const demoPatients: Partial<Patient>[] = [
    {
      name: 'أحمد محمد الخديج',
      weight: 1.8,
      gestational_age: 32,
      admission_date: '2024-01-15',
      incubator_date: '2024-01-15',
      status: 'active',
      nurse_primary: 'الممرضة فاطمة',
      nurse_secondary: 'الممرضة سارة',
      tpn_status: 'نشت',
      fluids_status: 'نشت',
    },
    {
      name: 'ليلى عبدالله الخديجة',
      weight: 2.1,
      gestational_age: 34,
      admission_date: '2024-01-18',
      incubator_date: '2024-01-18',
      status: 'active',
      nurse_primary: 'الممرضة نورة',
      nurse_secondary: 'الممرضة هدى',
      tpn_status: 'متوقف',
      fluids_status: 'نشت',
    },
    {
      name: 'عمر سعيد الخديج',
      weight: 1.5,
      gestational_age: 30,
      admission_date: '2024-01-20',
      incubator_date: '2024-01-21',
      status: 'critical',
      nurse_primary: 'الممرضة فاطمة',
      nurse_secondary: 'الممرضة أسماء',
      tpn_status: 'نشت',
      fluids_status: 'نشت',
    },
  ];

  demoPatients.forEach(p => {
    const patient = localStorageService.addPatient(p as Omit<Patient, 'id' | 'created_at' | 'updated_at'>);

    MEDICATION_EXAMPLES.slice(0, 2).forEach(med => {
      localStorageService.addMedication({
        patient_id: patient.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
        times: ['08:00', '16:00', '00:00'],
      });
    });
  });
};

interface SyncData {
  patients?: Array<{
    name: string;
    weight: number;
    gestational_age: number;
    admission_date: string;
    incubator_date?: string;
    status?: 'active' | 'critical' | 'discharged';
    nurse_primary?: string;
    nurse_secondary?: string;
    tpn_status?: string;
    fluids_status?: string;
  }>;
  medications?: Array<{
    patient_name?: string;
    patient_id?: string;
    name: string;
    dosage?: string;
    frequency?: string;
    is_active?: boolean;
    times?: string[];
  }>;
}

export function Header({ onSync, syncing }: HeaderProps) {
  const [url, setUrl] = useState(() => localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useCorsProxy, setUseCorsProxy] = useState(true);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
  ];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_URL, url);
  }, [url]);

  const processSyncData = (data: SyncData) => {
    let patientsCount = 0;
    let medsCount = 0;

    if (data.patients && Array.isArray(data.patients)) {
      data.patients.forEach((p) => {
        if (p.name && p.weight && p.gestational_age) {
          localStorageService.addPatient({
            name: p.name,
            weight: p.weight,
             gestational_age: p.gestational_age,
            admission_date: p.admission_date || new Date().toISOString().split('T')[0],
            incubator_date: p.incubator_date || null,
            status: p.status || 'active',
            nurse_primary: p.nurse_primary || null,
            nurse_secondary: p.nurse_secondary || null,
            tpn_status: p.tpn_status || 'pending',
            fluids_status: p.fluids_status || 'pending',
          });
          patientsCount++;
        }
      });
    }

    if (data.medications && Array.isArray(data.medications)) {
      const patients = localStorageService.getPatients();
      data.medications.forEach((m) => {
        let patientId = m.patient_id;
        if (m.patient_name && !patientId) {
          const patient = patients.find(p => p.name === m.patient_name);
          if (patient) patientId = patient.id;
        }
        if (patientId && m.name) {
          localStorageService.addMedication({
            patient_id: patientId,
            name: m.name,
            dosage: m.dosage || '',
            frequency: m.frequency || '',
            start_date: new Date().toISOString().split('T')[0],
            is_active: m.is_active !== false,
            times: m.times || [],
          });
          medsCount++;
        }
      });
    }

    return { patientsCount, medsCount };
  };

  const handleSync = async () => {
    setError(null);
    setSuccess(null);

    if (!url.trim()) {
      handleLoadDemo();
      return;
    }

    let lastError: Error | null = null;
    const urlsToTry: string[] = [];

    if (useCorsProxy) {
      CORS_PROXIES.forEach(proxy => {
        urlsToTry.push(proxy + encodeURIComponent(url));
      });
    }
    urlsToTry.push(url);

    for (const fetchUrl of urlsToTry) {
      try {
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
          },
        });

        if (!response.ok) {
          lastError = new Error('فشل في الاتصال بالمصدر (خطأ ${response.status})');
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        let data: SyncData = {};

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            lastError = new Error('البيانات غير بتنسيق JSON الصحيح');
            continue;
          }
        }

        const { patientsCount, medsCount } = processSyncData(data);
        const totalUpdates = patientsCount + medsCount;

        if (totalUpdates > 0) {
          setSuccess('تمت المزامنة بنجاح - تم إضافة ${patientsCount} مريض و ${medsCount} علاج');
        } else {
          setSuccess('تم الاتصال بنجاح - لا توجد بيانات جديدة');
        }
        onSync();
        return;
      } catch (err) {
        console.error('Sync attempt failed:', err);
        lastError = err instanceof Error ? err : new Error('خطأ غير معروف');
      }
    }

    if (lastError) {
      if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
        setError('فشل في الاتصال - تحقق من الرابط أو جرب "لصق JSON"');
      } else {
        setError(lastError.message || 'حدث خطأ أثناء المزامنة');
      }
    }
  };

  const handlePasteJson = () => {
    setError(null);

    try {
      const data = JSON.parse(pastedJson);
      const { patientsCount, medsCount } = processSyncData(data);

      setSuccess('تم استيراد البيانات - ${patientsCount} مريض و ${medsCount} علاج');
      setShowPasteModal(false);
      setPastedJson('')
      onSync()
    } catch {
      setError('صيغة JSON غير صحيحة - تأكد من نسخ البيانات بشكل كامل')
    }
  }

  const handleLoadDemo = () => {
    generateDemoPatients();
    setSuccess('تم تحميل بيانات تجريبية بنجاح');
    onSync();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        const { patientsCount, medsCount } = processSyncData(data);

        setSuccess('تم استيراد الملف - ${patientsCount} مريض و ${medsCount} علاج');
        onSync();
      } catch {
        setError('فشل في قراءة الملف - تأكد أنه ملف JSON صالح');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <header className="bg-gradient-to-l from-medical-dark to-medical-primary shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">لوحة متابعة العناية المركزة</h1>
                  <p className="text-white/80 text-sm">وحدة حديثي الولادة - NICU</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-white/90 text-sm" dir="rtl">
                  {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 flex items-center gap-2">
                  <Link className="w-5 h-5 text-white/80 flex-shrink-0" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="أدخل رابط البيانات للمزامنة..."
                    className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-right"
                    dir="ltr"
                  />
                </div>
                <label className="flex items-center gap-2 text-white text-sm cursor-pointer select-none whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={useCorsProxy}
                    onChange={(e) => setUseCorsProxy(e.target.checked)}
                    className="w-4 h-4 rounded accent-medical-primary"
                  />
                  <span>بروكسي CORS</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2 items-center justify-end">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center justify-center gap-2 bg-white text-medical-dark font-bold px-5 py-2 rounded-lg hover:bg-white/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={'w-5 h-5 ${syncing ? 'animate-spin' : ''}'} />
                  <span>{syncing ? 'جاري المزامنة...' : 'مزامنة بيانات اليوم'}</span>
                </button>

                <label className="flex items-center gap-2 bg-white/20 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/30 transition-all border border-white/30 cursor-pointer">
                  <FileJson className="w-4 h-4" />
                  <span>رفع ملف JSON</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setShowPasteModal(true)}
                  className="flex items-center justify-center gap-2 bg-white/20 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/30 transition-all border border-white/30"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>لصق JSON</span>
                </button>

                <button
                  onClick={handleLoadDemo}
                  className="flex items-center justify-center gap-2 bg-white/20 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/30 transition-all border border-white/30"
                >
                  <span>بيانات تجريبية</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 text-white px-4 py-2 rounded-lg animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-500/20 text-white px-4 py-2 rounded-lg animate-fadeIn">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Paste JSON Modal */}
      {showPasteModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPasteModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">لصق بيانات JSON</h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>تنسيق البيانات المطلوب:</strong>
              <pre className="mt-2 text-xs bg-blue-100 p-2 rounded overflow-auto" dir="ltr">
{JSON.stringify({
  patients: [{ name: "اسم المريض", weight: 2.1, gestational_age: 34, admission_date: "2024-01-15", status: "active" }],
  medications: [{ patient_name: "اسم المريض", name: "أموكسيسيلين", dosage: "50 مغ/كغ", frequency: "كل 8 ساعات" }]
}, null, 2)}
              </pre>
            </div>

            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              placeholder="الصق بيانات JSON هنا..."
              className="w-full h-48 bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-medical-primary/30 resize-none"
              dir="ltr"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePasteJson}
                disabled={!pastedJson.trim()}
                className="flex-1 py-2 bg-medical-primary text-white rounded-lg hover:bg-medical-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                استيراد البيانات
              </button>
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      })}
    </>
  );
}
