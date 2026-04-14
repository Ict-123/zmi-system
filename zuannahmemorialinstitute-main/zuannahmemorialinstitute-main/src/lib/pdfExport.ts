import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Student, GradeComponent, GradeBand, calcRowPercentage, calcRowTotal, calcStudentAverage, getLetterGrade, calcMaxTotal } from "./store";
import { LOGO_BASE64 } from "./logoData";

const GOLD = [201, 168, 76] as const;
const BROWN = [77, 57, 38] as const;
const WHITE = [255, 255, 255] as const;
const DARK_BLUE = [30, 40, 80] as const;

function getMidtermScore(g: { scores: Record<string, number> }, components: GradeComponent[]): number {
  const mid = Math.ceil(components.length / 2);
  return components.slice(0, mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
}

function getFinalExamScore(g: { scores: Record<string, number> }, components: GradeComponent[]): number {
  const mid = Math.ceil(components.length / 2);
  return components.slice(mid).reduce((sum, c) => sum + (g.scores[c.id] || 0), 0);
}

function drawReportCardHeader(doc: jsPDF, pageWidth: number): number {
  // Outer border
  doc.setDrawColor(...BROWN);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, pageWidth - 10, 287);
  
  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(8, 8, pageWidth - 16, 281);

  // Logo
  doc.addImage(LOGO_BASE64, "JPEG", 14, 12, 22, 22);

  // School name
  doc.setFontSize(16);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.text("Zuannah Memorial Institute", 40, 22);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Monrovia, Liberia", 40, 28);

  // Line under header
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(12, 36, pageWidth - 12, 36);

  return 42;
}

export function exportStudentPDF(student: Student, components: GradeComponent[], bands: GradeBand[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;

  let y = drawReportCardHeader(doc, pageWidth);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.text("STUDENT REPORT CARD", pageWidth / 2, y, { align: "center" });
  
  // Underline title
  const titleWidth = doc.getTextWidth("STUDENT REPORT CARD");
  doc.setDrawColor(...BROWN);
  doc.setLineWidth(0.5);
  doc.line((pageWidth - titleWidth) / 2, y + 1, (pageWidth + titleWidth) / 2, y + 1);
  
  y += 10;

  // Student info
  doc.setFontSize(10);
  doc.setTextColor(0);

  const drawInfoLine = (label: string, value: string, x: number, yPos: number, lineWidth: number) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, x, yPos);
    const labelW = doc.getTextWidth(label);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + labelW + 2, yPos);
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(x + labelW + 1, yPos + 1, x + lineWidth, yPos + 1);
  };

  drawInfoLine("Name: ", student.name, 14, y, 190);
  y += 7;
  drawInfoLine("Student ID: ", student.studentId, 14, y, 95);
  drawInfoLine("Grade/Class: ", student.classLevel || "—", 105, y, 190);
  y += 7;
  drawInfoLine("Academic Year: ", student.semester, 14, y, 95);
  drawInfoLine("Section: ", student.section, 105, y, 190);
  y += 10;

  // SUBJECTS heading
  doc.setFontSize(11);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.text("SUBJECTS", pageWidth / 2, y, { align: "center" });
  y += 4;

  // Subjects table
  const maxTotal = calcMaxTotal(components);
  const tableData = student.grades.map((g) => {
    const midterm = getMidtermScore(g, components);
    const finalExam = getFinalExamScore(g, components);
    const total = calcRowTotal(g, components);
    const avg = calcRowPercentage(g, components);
    const grade = getLetterGrade(avg, bands);
    return [g.subject, `${midterm}`, `${finalExam}`, `${total}`, `${avg.toFixed(1)}%`, grade];
  });

  // Add empty rows to fill at least 10
  while (tableData.length < 10) {
    tableData.push(["", "", "", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [["SUBJECTS", "MIDTERM", "FINAL EXAM", "TOTAL", "AVERAGE", "GRADE"]],
    body: tableData,
    headStyles: { fillColor: [...GOLD], textColor: [...WHITE], fontStyle: "bold", fontSize: 7, halign: "center" },
    bodyStyles: { fontSize: 8, halign: "center", minCellHeight: 7 },
    columnStyles: { 0: { halign: "left", cellWidth: 45 } },
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { lineColor: [...BROWN], lineWidth: 0.3 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Grade scale
  doc.setFontSize(8);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  const gradeScale = "GRADE SCALE:  " + bands.map(b => `${b.letter} = ${b.min} – ${b.max}%`).join(",   ");
  doc.text(gradeScale, 14, y);
  y += 6;

  // Overall summary box
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, "F");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, "S");

  const overallAvg = calcStudentAverage(student.grades, components);
  const letter = getLetterGrade(overallAvg, bands);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Overall Average:", 30, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.text(`${overallAvg.toFixed(1)}%`, 70, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Final Grade:", 110, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD);
  doc.setFontSize(14);
  doc.text(letter, 145, y + 8);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Max Points:", 158, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(`${maxTotal}`, 185, y + 8);

  y += 24;

  // Remarks
  doc.setFontSize(8);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.text("CLASS TEACHER'S REMARKS:", 14, y);
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  doc.line(14, y + 6, pageWidth - 14, y + 6);
  doc.line(14, y + 12, pageWidth - 14, y + 12);
  y += 18;

  doc.text("PRINCIPAL'S REMARKS:", 14, y);
  doc.line(14, y + 6, pageWidth - 14, y + 6);
  doc.line(14, y + 12, pageWidth - 14, y + 12);
  y += 20;

  // Signatures
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Class Teacher: ________________", 14, y);
  doc.text("Principal: ________________", 120, y);
  y += 8;
  doc.text("Date: ________________", 14, y);
  doc.text("Date: ________________", 120, y);

  doc.save(`ReportCard_${student.studentId}_${student.name.replace(/\s+/g, "_")}.pdf`);
}

export function exportClassReportPDF(students: Student[], components: GradeComponent[], bands: GradeBand[]) {
  const doc = new jsPDF();
  const pageWidth = 210;
  
  let y = drawReportCardHeader(doc, pageWidth);

  doc.setFontSize(12);
  doc.setTextColor(...BROWN);
  doc.setFont("helvetica", "bold");
  doc.text("Class Report — All Students Ranked by Average", pageWidth / 2, y, { align: "center" });
  y += 6;

  const ranked = students
    .map((s) => {
      const avg = calcStudentAverage(s.grades, components);
      return { ...s, avg, letter: getLetterGrade(avg, bands) };
    })
    .sort((a, b) => b.avg - a.avg);

  autoTable(doc, {
    startY: y,
    head: [["Rank", "Student ID", "Name", "Section", "Semester", "Average (%)", "Grade"]],
    body: ranked.map((s, i) => [`#${i + 1}`, s.studentId, s.name, s.section, s.semester, `${s.avg.toFixed(1)}%`, s.letter]),
    headStyles: { fillColor: [...GOLD], textColor: [...WHITE], fontStyle: "bold", fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8, halign: "center" },
    columnStyles: { 2: { halign: "left" } },
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { lineColor: [...BROWN], lineWidth: 0.3 },
  });

  let fy = (doc as any).lastAutoTable.finalY + 10;

  const totalAvg = ranked.length ? ranked.reduce((s, r) => s + r.avg, 0) / ranked.length : 0;
  const passing = ranked.filter((r) => r.avg >= 85).length;

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Students: ${ranked.length}`, 14, fy);
  doc.text(`Class Average: ${totalAvg.toFixed(1)}%`, 70, fy);
  doc.text(`Passing (≥85%): ${passing}`, 130, fy);
  doc.text(`Below 85%: ${ranked.length - passing}`, 175, fy);

  doc.save("ClassReport.pdf");
}
