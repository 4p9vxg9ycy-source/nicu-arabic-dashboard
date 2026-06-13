import { useState, useEffect, useCallback } from 'react';
import { Patient, Medication, DailyLog, LabResult } from '../types';
import { localStorageService } from '../lib/storage';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedPatients = localStorageService.getPatients();
    setPatients(loadedPatients);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    const loadedPatients = localStorageService.getPatients();
    setPatients(loadedPatients);
  }, []);

  const addPatient = useCallback((patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
    const newPatient = localStorageService.addPatient(patient);
    refresh();
    return newPatient;
  }, [refresh]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    const result = localStorageService.updatePatient(id, updates);
    refresh();
    return result;
  }, [refresh]);

  const deletePatient = useCallback((id: string) => {
    localStorageService.deletePatient(id);
    refresh();
  }, [refresh]);

  return { patients, loading, addPatient, updatePatient, deletePatient, refresh };
}

export function useMedications(patientId: string) {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    if (patientId) {
      setMedications(localStorageService.getMedications(patientId));
    }
  }, [patientId]);

  const addMedication = useCallback((med: Omit<Medication, 'id'>) => {
    const newMed = localStorageService.addMedication(med);
    setMedications(localStorageService.getMedications(patientId));
    return newMed;
  }, [patientId]);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    localStorageService.updateMedication(id, updates);
    setMedications(localStorageService.getMedications(patientId));
  }, [patientId]);

  return { medications, addMedication, updateMedication };
}

export function useDailyLogs(patientId: string) {
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    if (patientId) {
      setLogs(localStorageService.getDailyLogs(patientId));
    }
  }, [patientId]);

  const addLog = useCallback((log: Omit<DailyLog, 'id'>) => {
    const newLog = localStorageService.addDailyLog(log);
    setLogs(localStorageService.getDailyLogs(patientId));
    return newLog;
  }, [patientId]);

  const updateLog = useCallback((id: string, updates: Partial<DailyLog>) => {
    localStorageService.updateDailyLog(id, updates);
    setLogs(localStorageService.getDailyLogs(patientId));
  }, [patientId]);

  const getTodayLogs = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(l => l.log_date === today);
  }, [logs]);

  return { logs, addLog, updateLog, getTodayLogs };
}

export function useLabResults(patientId: string) {
  const [results, setResults] = useState<LabResult[]>([]);

  useEffect(() => {
    if (patientId) {
      setResults(localStorageService.getLabResults(patientId));
    }
  }, [patientId]);

  const addResult = useCallback((result: Omit<LabResult, 'id' | 'uploaded_at'>) => {
    const newResult = localStorageService.addLabResult(result);
    setResults(localStorageService.getLabResults(patientId));
    return newResult;
  }, [patientId]);

  const deleteResult = useCallback((id: string) => {
    localStorageService.deleteLabResult(id);
    setResults(localStorageService.getLabResults(patientId));
  }, [patientId]);

  return { results, addResult, deleteResult };
}
