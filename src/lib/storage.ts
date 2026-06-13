import { Patient, Medication, DailyLog, LabResult, PatientWithDetails } from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'nicu_patients',
  MEDICATIONS: 'nicu_medications',
  DAILY_LOGS: 'nicu_daily_logs',
  LAB_RESULTS: 'nicu_lab_results',
  SYNC_HISTORY: 'nicu_sync_history',
};

const generateId = () => crypto.randomUUID();

export const localStorageService = {
  // Patients
  getPatients: (): Patient[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return data ? JSON.parse(data) : [];
  },

  savePatients: (patients: Patient[]): void => {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  },

  addPatient: (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Patient => {
    const patients = localStorageService.getPatients();
    const newPatient: Patient = {
      ...patient,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    patients.push(newPatient);
    localStorageService.savePatients(patients);
    return newPatient;
  },

  updatePatient: (id: string, updates: Partial<Patient>): Patient | null => {
    const patients = localStorageService.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return null;
    patients[index] = { ...patients[index], ...updates, updated_at: new Date().toISOString() };
    localStorageService.savePatients(patients);
    return patients[index];
  },

  deletePatient: (id: string): boolean => {
    const patients = localStorageService.getPatients();
    const filtered = patients.filter(p => p.id !== id);
    if (filtered.length === patients.length) return false;
    localStorageService.savePatients(filtered);
    return true;
  },

  // Medications
  getMedications: (patientId?: string): Medication[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    const meds: Medication[] = data ? JSON.parse(data) : [];
    return patientId ? meds.filter(m => m.patient_id === patientId) : meds;
  },

  saveMedications: (medications: Medication[]): void => {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
  },

  addMedication: (medication: Omit<Medication, 'id'>): Medication => {
    const medications = localStorageService.getMedications();
    const newMedication: Medication = {
      ...medication,
      id: generateId(),
    };
    medications.push(newMedication);
    localStorageService.saveMedications(medications);
    return newMedication;
  },

  updateMedication: (id: string, updates: Partial<Medication>): Medication | null => {
    const medications = localStorageService.getMedications();
    const index = medications.findIndex(m => m.id === id);
    if (index === -1) return null;
    medications[index] = { ...medications[index], ...updates };
    localStorageService.saveMedications(medications);
    return medications[index];
  },

  // Daily Logs
  getDailyLogs: (patientId?: string, date?: string): DailyLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    let logs: DailyLog[] = data ? JSON.parse(data) : [];
    if (patientId) logs = logs.filter(l => l.patient_id === patientId);
    if (date) logs = logs.filter(l => l.log_date === date);
    return logs;
  },

  addDailyLog: (log: Omit<DailyLog, 'id'>): DailyLog => {
    const logs = localStorageService.getDailyLogs();
    const newLog: DailyLog = { ...log, id: generateId() };
    logs.push(newLog);
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    return newLog;
  },

  updateDailyLog: (id: string, updates: Partial<DailyLog>): DailyLog | null => {
    const logs = localStorageService.getDailyLogs();
    const index = logs.findIndex(l => l.id === id);
    if (index === -1) return null;
    logs[index] = { ...logs[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    return logs[index];
  },

  // Lab Results
  getLabResults: (patientId?: string): LabResult[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LAB_RESULTS);
    const results: LabResult[] = data ? JSON.parse(data) : [];
    return patientId ? results.filter(r => r.patient_id === patientId) : results;
  },

  addLabResult: (result: Omit<LabResult, 'id' | 'uploaded_at'>): LabResult => {
    const results = localStorageService.getLabResults();
    const newResult: LabResult = {
      ...result,
      id: generateId(),
      uploaded_at: new Date().toISOString(),
    };
    results.push(newResult);
    localStorage.setItem(STORAGE_KEYS.LAB_RESULTS, JSON.stringify(results));
) );
    return newResult;
  },

  deleteLabResult: (id: string): boolean => {
    const results = localStorageService.getLabResults();
    const filtered = results.filter(r => r.id !== id);
    if (filtered.length === results.length) return false;
    localStorage.setItem(STORAGE_KEYS.LAB_RESULTS, JSON.stringify(filtered));
    return true;
  },

  // Combined data
  getPatientWithDetails: (patientId: string): PatientWithDetails | null => {
    const patients = localStorageService.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return null;

    return {
      ...patient,
      medications: localStorageService.getMedications(patientId),
      dailyLogs: localStorageService.getDailyLogs(patientId),
      labResults: localStorageService.getLabResults(patientId),
    };
  },

  // Clear all data
  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};
