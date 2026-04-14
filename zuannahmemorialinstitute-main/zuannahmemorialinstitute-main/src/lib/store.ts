// --- Dynamic Grade Components ---
export interface GradeComponent {
  id: string;
  label: string;
  maxPoints: number;
}

export interface GradeBand {
  letter: string;
  min: number;
  max: number;
  color: string;
}

export interface SubjectGrade {
  id: string;
  date: string;
  subject: string;
  scores: Record<string, number>; // component id -> score
}

export const CLASS_LEVELS = [
  "Nursery",
  "Kindergarten (KG)",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
];

export interface Student {
  id: string;
  studentId: string;
  name: string;
  classLevel: string;
  section: string;
  semester: string;
  parentContact: string;
  photo?: string;
  grades: SubjectGrade[];
  locked: boolean;
}

const DEFAULT_COMPONENTS: GradeComponent[] = [
  { id: "attendance", label: "Attendance", maxPoints: 10 },
  { id: "classParticipation", label: "Class Participation", maxPoints: 5 },
  { id: "tidiness", label: "Tidiness", maxPoints: 5 },
  { id: "classWork", label: "Eval 1: Class Work", maxPoints: 10 },
  { id: "homeWork", label: "Eval 2: Home Work", maxPoints: 10 },
  { id: "project", label: "Eval 3: Project", maxPoints: 20 },
  { id: "oralPresentation", label: "Eval 4: Oral Presentation", maxPoints: 20 },
  { id: "quiz", label: "Eval 5: Quiz", maxPoints: 20 },
];

const DEFAULT_BANDS: GradeBand[] = [
  { letter: "A+", min: 95, max: 100, color: "green" },
  { letter: "A", min: 90, max: 94.99, color: "blue" },
  { letter: "A-", min: 85, max: 89.99, color: "yellow" },
  { letter: "B+", min: 0, max: 84.99, color: "red" },
];

const SAMPLE_STUDENTS: Student[] = [
  {
    id: "1", studentId: "00-0001", name: "Christian Smith", classLevel: "10th Grade", section: "C", semester: "Spring 2024", parentContact: "+1 555-0101",
    grades: [
      { id: "g1", date: "2024-02-09", subject: "Mathematics", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 9, homeWork: 10, project: 18, oralPresentation: 19, quiz: 20 } },
      { id: "g2", date: "2024-02-10", subject: "English", scores: { attendance: 9, classParticipation: 4, tidiness: 5, classWork: 10, homeWork: 9, project: 19, oralPresentation: 18, quiz: 19 } },
      { id: "g3", date: "2024-02-11", subject: "Science", scores: { attendance: 10, classParticipation: 5, tidiness: 4, classWork: 8, homeWork: 10, project: 17, oralPresentation: 20, quiz: 18 } },
      { id: "g4", date: "2024-02-12", subject: "Social Studies", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 9, homeWork: 10, project: 18, oralPresentation: 19, quiz: 19 } },
      { id: "g5", date: "2024-02-13", subject: "General Knowledge", scores: { attendance: 8, classParticipation: 4, tidiness: 5, classWork: 10, homeWork: 9, project: 20, oralPresentation: 18, quiz: 18 } },
      { id: "g6", date: "2024-02-14", subject: "Latin", scores: { attendance: 9, classParticipation: 5, tidiness: 5, classWork: 9, homeWork: 10, project: 19, oralPresentation: 19, quiz: 20 } },
    ],
    locked: false,
  },
  {
    id: "2", studentId: "00-0002", name: "Maria Johnson", classLevel: "9th Grade", section: "A", semester: "Spring 2024", parentContact: "+1 555-0102",
    grades: [
      { id: "g7", date: "2024-02-09", subject: "Mathematics", scores: { attendance: 9, classParticipation: 4, tidiness: 4, classWork: 8, homeWork: 9, project: 17, oralPresentation: 16, quiz: 18 } },
      { id: "g8", date: "2024-02-10", subject: "English", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 9, homeWork: 10, project: 18, oralPresentation: 19, quiz: 20 } },
      { id: "g9", date: "2024-02-11", subject: "Science", scores: { attendance: 8, classParticipation: 4, tidiness: 3, classWork: 7, homeWork: 8, project: 15, oralPresentation: 16, quiz: 17 } },
    ],
    locked: false,
  },
  {
    id: "3", studentId: "00-0003", name: "James Williams", classLevel: "11th Grade", section: "B", semester: "Spring 2024", parentContact: "+1 555-0103",
    grades: [
      { id: "g10", date: "2024-02-09", subject: "Mathematics", scores: { attendance: 7, classParticipation: 3, tidiness: 3, classWork: 6, homeWork: 7, project: 14, oralPresentation: 15, quiz: 15 } },
      { id: "g11", date: "2024-02-10", subject: "English", scores: { attendance: 8, classParticipation: 4, tidiness: 4, classWork: 7, homeWork: 8, project: 15, oralPresentation: 16, quiz: 16 } },
    ],
    locked: true,
  },
  {
    id: "4", studentId: "00-0004", name: "Sarah Davis", classLevel: "12th Grade", section: "A", semester: "Spring 2024", parentContact: "+1 555-0104",
    grades: [
      { id: "g12", date: "2024-02-09", subject: "Mathematics", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 10, homeWork: 10, project: 20, oralPresentation: 20, quiz: 20 } },
      { id: "g13", date: "2024-02-10", subject: "English", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 9, homeWork: 10, project: 19, oralPresentation: 19, quiz: 19 } },
      { id: "g14", date: "2024-02-11", subject: "Science", scores: { attendance: 10, classParticipation: 5, tidiness: 5, classWork: 10, homeWork: 10, project: 18, oralPresentation: 20, quiz: 20 } },
    ],
    locked: false,
  },
  {
    id: "5", studentId: "00-0005", name: "Robert Brown", classLevel: "Kindergarten (KG)", section: "C", semester: "Spring 2024", parentContact: "+1 555-0105",
    grades: [
      { id: "g15", date: "2024-02-09", subject: "Mathematics", scores: { attendance: 7, classParticipation: 3, tidiness: 3, classWork: 6, homeWork: 6, project: 12, oralPresentation: 14, quiz: 14 } },
      { id: "g16", date: "2024-02-10", subject: "English", scores: { attendance: 6, classParticipation: 3, tidiness: 2, classWork: 5, homeWork: 5, project: 10, oralPresentation: 12, quiz: 13 } },
    ],
    locked: false,
  },
];

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

export function getGradeComponents(): GradeComponent[] {
  return loadFromStorage("gradeComponents", DEFAULT_COMPONENTS);
}

export function saveGradeComponents(c: GradeComponent[]) {
  saveToStorage("gradeComponents", c);
}

export function getBands(): GradeBand[] {
  return loadFromStorage("gradeBands", DEFAULT_BANDS);
}

export function setBands(b: GradeBand[]) {
  saveToStorage("gradeBands", b);
}

export function getStudents(): Student[] {
  return loadFromStorage("students", SAMPLE_STUDENTS);
}

export function saveStudents(s: Student[]) {
  saveToStorage("students", s);
}

// --- Subject Management ---
export interface SubjectConfig {
  id: string;
  name: string;
  classLevels: string[];
  teacher?: string;
  teacherUserId?: string;
}

const DEFAULT_SUBJECTS_CONFIG: SubjectConfig[] = [
  { id: "s1", name: "Mathematics", classLevels: [...CLASS_LEVELS] },
  { id: "s2", name: "English", classLevels: [...CLASS_LEVELS] },
  { id: "s3", name: "Science", classLevels: CLASS_LEVELS.filter((_, i) => i >= 2) },
  { id: "s4", name: "Social Studies", classLevels: CLASS_LEVELS.filter((_, i) => i >= 2) },
  { id: "s5", name: "General Knowledge", classLevels: CLASS_LEVELS.filter((_, i) => i >= 0 && i <= 7) },
  { id: "s6", name: "Latin", classLevels: CLASS_LEVELS.filter((_, i) => i >= 8) },
  { id: "s7", name: "History", classLevels: CLASS_LEVELS.filter((_, i) => i >= 4) },
  { id: "s8", name: "Geography", classLevels: CLASS_LEVELS.filter((_, i) => i >= 4) },
  { id: "s9", name: "Physical Education", classLevels: [...CLASS_LEVELS] },
  { id: "s10", name: "Art", classLevels: CLASS_LEVELS.filter((_, i) => i <= 9) },
  { id: "s11", name: "Music", classLevels: CLASS_LEVELS.filter((_, i) => i <= 9) },
  { id: "s12", name: "Computer Science", classLevels: CLASS_LEVELS.filter((_, i) => i >= 6) },
  { id: "s13", name: "French", classLevels: CLASS_LEVELS.filter((_, i) => i >= 6) },
  { id: "s14", name: "Biology", classLevels: CLASS_LEVELS.filter((_, i) => i >= 10) },
  { id: "s15", name: "Chemistry", classLevels: CLASS_LEVELS.filter((_, i) => i >= 10) },
  { id: "s16", name: "Physics", classLevels: CLASS_LEVELS.filter((_, i) => i >= 10) },
];

export function getSubjectsConfig(): SubjectConfig[] {
  return loadFromStorage("subjectsConfig", DEFAULT_SUBJECTS_CONFIG);
}

export function saveSubjectsConfig(s: SubjectConfig[]) {
  saveToStorage("subjectsConfig", s);
}

export function getSubjectsForClass(classLevel: string): string[] {
  const config = getSubjectsConfig();
  return config.filter((s) => s.classLevels.includes(classLevel)).map((s) => s.name);
}

// --- Calculation functions ---
export function calcRowTotal(g: SubjectGrade, components: GradeComponent[]): number {
  return components.reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
}

export function calcMaxTotal(components: GradeComponent[]): number {
  return components.reduce((sum, c) => sum + c.maxPoints, 0);
}

export function calcRowPercentage(g: SubjectGrade, components: GradeComponent[]): number {
  const max = calcMaxTotal(components);
  if (max === 0) return 0;
  const total = calcRowTotal(g, components);
  return (total / max) * 100;
}

export function calcStudentAverage(grades: SubjectGrade[], components: GradeComponent[]): number {
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, g) => sum + calcRowPercentage(g, components), 0);
  return total / grades.length;
}

export function getLetterGrade(avg: number, bands: GradeBand[]): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  for (const band of sorted) {
    if (avg >= band.min) return band.letter;
  }
  return sorted[sorted.length - 1]?.letter || "N/A";
}

export function getGradeColor(avg: number): string {
  if (avg >= 95) return "grade-a-plus";
  if (avg >= 90) return "grade-a";
  if (avg >= 85) return "grade-a-minus";
  return "grade-b-plus";
}

export function generateStudentId(students: Student[]): string {
  const max = students.reduce((m, s) => {
    const num = parseInt(s.studentId.replace("00-", ""), 10);
    return num > m ? num : m;
  }, 0);
  return `00-${String(max + 1).padStart(4, "0")}`;
}
