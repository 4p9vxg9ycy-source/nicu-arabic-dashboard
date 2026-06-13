export type PatientStatus = 'active' | 'discharged' | 'critical';

export interface Patient {
  id: string;
  name: string;
  weight: number;
  gestational_age: number;
  admission_date: string;
  incubator_date: string | null;
  status: PatientStatus;
  nurse_primary: string | null;
  nurse_secondary: string | null;
  tpn_status: string;
  fluids_status: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  times: string[];
  is_active: boolean;
}

export type LogType = 'feeding' | 'output' | 'urination';

export interface DailyLog {
  id: string;
  patient_id: string;
  log_date: string;
  log_type: LogType;
  value: string | null;
  amount_ml: number | null;
  completed_at: string | null;
  notes: string | null;
}

export interface LabResult {
  id: string;
  patient_id: string;
  image_url: string;
  thumbnail_url: string | null;
  analysis_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface SyncLog {
  id: string;
  sync_url: string;
  sync_date: string;
  records_updated: number;
  status: string;
}

export interface PatientWithDetails extends Patient {
  medications: Medication[];
  dailyLogs: DailyLog[];
  labResults: LabResult[];
}

export const FEEDING_OPTIONS = [
  { value: 'NPO', label: 'NPO (بدون تغذية)' },
  { value: '2ml', label: '2 مل' },
  { value: '3ml', label: '3 مل' },
  { value: '5ml', label: '5 مل' },
  { value: '10ml', label: '10 مل' },
  { value: '15ml', label: '15 مل' },
  { value: '20ml', label: '20 مل' },
  { value: '25ml', label: '25 مل' },
  { value: '30ml', label: '30 مل' },
];

export const MEDICATION_EXAMPLES = [
  { name: 'أموكسيسيلين', dosage: '50 مغ/كغ', frequency: 'كل 8 ساعات' },
  { name: 'جنتاميسين', dosage: '4 مغ/كغ', frequency: 'كل 24 ساعة' },
  { name: 'كافيبينيم', dosage: '20 مغ/كغ', frequency: 'كل 12 ساعة' },
  { name: 'فانكوميسين', dosage: '15 مغ/كغ', frequency: 'كل 8 ساعات' },
  { name: 'كافوتازيديم', dosage: '50 مغ/كغ', frequency: 'كل 8 ساعات' },
];
