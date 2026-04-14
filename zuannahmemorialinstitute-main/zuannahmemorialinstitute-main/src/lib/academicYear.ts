import { Student, getStudents, saveStudents } from "./store";

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024-2025"
  startDate: string;
  endDate: string;
  status: "active" | "archived";
  createdAt: string;
  archivedAt?: string;
}

export interface AcademicYearArchive {
  yearId: string;
  yearName: string;
  archivedAt: string;
  students: Student[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  yearName?: string;
}

const YEARS_KEY = "academicYears";
const ARCHIVES_KEY = "academicYearArchives";
const AUDIT_KEY = "academicYearAuditLog";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Academic Years ---
export function getAcademicYears(): AcademicYear[] {
  return loadFromStorage(YEARS_KEY, []);
}

export function saveAcademicYears(years: AcademicYear[]) {
  saveToStorage(YEARS_KEY, years);
}

export function getActiveYear(): AcademicYear | null {
  return getAcademicYears().find((y) => y.status === "active") || null;
}

export function yearExists(name: string): boolean {
  return getAcademicYears().some((y) => y.name === name);
}

// --- Archives ---
export function getArchives(): AcademicYearArchive[] {
  return loadFromStorage(ARCHIVES_KEY, []);
}

export function saveArchives(archives: AcademicYearArchive[]) {
  saveToStorage(ARCHIVES_KEY, archives);
}

export function getArchiveByYearId(yearId: string): AcademicYearArchive | null {
  return getArchives().find((a) => a.yearId === yearId) || null;
}

// --- Audit Log ---
export function getAuditLog(): AuditLogEntry[] {
  return loadFromStorage(AUDIT_KEY, []);
}

function addAuditEntry(action: string, details: string, yearName?: string) {
  const log = getAuditLog();
  log.unshift({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    details,
    yearName,
  });
  saveToStorage(AUDIT_KEY, log);
}

// --- Transition Logic ---
export function createAcademicYear(name: string, startDate: string, endDate: string): { success: boolean; error?: string } {
  if (yearExists(name)) {
    return { success: false, error: `Academic year "${name}" already exists.` };
  }

  const years = getAcademicYears();
  const activeYear = years.find((y) => y.status === "active");

  // Archive current active year first
  if (activeYear) {
    const archiveResult = archiveYear(activeYear.id);
    if (!archiveResult.success) {
      return { success: false, error: archiveResult.error };
    }
  }

  // Create new year
  const newYear: AcademicYear = {
    id: crypto.randomUUID(),
    name,
    startDate,
    endDate,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const updatedYears = getAcademicYears(); // re-read after archive
  updatedYears.push(newYear);
  saveAcademicYears(updatedYears);

  // Clear all current student grades for fresh session
  const students = getStudents();
  const clearedStudents = students.map((s) => ({ ...s, grades: [], locked: false }));
  saveStudents(clearedStudents);

  addAuditEntry("CREATE_YEAR", `Created and activated academic year "${name}".`, name);

  return { success: true };
}

export function archiveYear(yearId: string): { success: boolean; error?: string } {
  const years = getAcademicYears();
  const year = years.find((y) => y.id === yearId);
  if (!year) return { success: false, error: "Year not found." };
  if (year.status === "archived") return { success: false, error: "Year is already archived." };

  // Backup current students data
  const currentStudents = getStudents();
  const archives = getArchives();
  archives.push({
    yearId: year.id,
    yearName: year.name,
    archivedAt: new Date().toISOString(),
    students: JSON.parse(JSON.stringify(currentStudents)), // deep clone
  });
  saveArchives(archives);

  // Mark year as archived
  year.status = "archived";
  year.archivedAt = new Date().toISOString();
  saveAcademicYears(years);

  addAuditEntry("ARCHIVE_YEAR", `Archived academic year "${year.name}" with ${currentStudents.length} students and ${currentStudents.reduce((sum, s) => sum + s.grades.length, 0)} grade records.`, year.name);

  return { success: true };
}

export function formatYearName(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}
