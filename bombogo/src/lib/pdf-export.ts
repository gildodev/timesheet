/**
 * PDF Export functionality (Premium feature)
 * Uses html2canvas and jsPDF to generate professional PDF reports
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Report } from '@/types';
import { formatDate, formatHours } from './utils';

export class PDFExporter {
  /**
   * Generate PDF from Report data
   */
  static async generateReportPDF(report: Report, reportName: string): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(139, 92, 246); // Primary color
    pdf.text('TimeFlow', margin, yPos);
    yPos += 8;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(reportName, margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
      margin,
      yPos
    );
    yPos += 10;

    // Separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Summary section
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Resumo', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    const summaryData = [
      ['Total de Horas:', formatHours(report.totalHours)],
      ['Total de Entradas:', report.totalEntries.toString()],
      ['Média por Dia:', formatHours(report.averageHoursPerDay)],
      ['Dia Mais Produtivo:', report.mostProductiveDay || 'N/A'],
      ['Sequência Atual:', `${report.streak.current} dias`],
      ['Maior Sequência:', `${report.streak.longest} dias`],
    ];

    summaryData.forEach(([label, value]) => {
      pdf.setTextColor(100, 100, 100);
      pdf.text(label, margin, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(value, margin + 50, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Projects section
    if (report.projectBreakdown.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Distribuição por Projeto', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      report.projectBreakdown.slice(0, 10).forEach(project => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setTextColor(100, 100, 100);
        pdf.text(project.projectName, margin, yPos);
        
        pdf.setTextColor(0, 0, 0);
        const hours = formatHours(project.hours);
        pdf.text(hours, margin + 80, yPos);
        
        const percentage = `${project.percentage.toFixed(1)}%`;
        pdf.text(percentage, margin + 110, yPos);
        
        // Progress bar
        const barWidth = 40;
        const barHeight = 3;
        const barX = pageWidth - margin - barWidth;
        const barY = yPos - 3;
        
        pdf.setFillColor(240, 240, 240);
        pdf.rect(barX, barY, barWidth, barHeight, 'F');
        
        pdf.setFillColor(139, 92, 246);
        pdf.rect(barX, barY, (barWidth * project.percentage) / 100, barHeight, 'F');
        
        yPos += 7;
      });

      yPos += 5;
    }

    // Tags section
    if (report.tagBreakdown.length > 0) {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Distribuição por Tag', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      report.tagBreakdown.slice(0, 10).forEach(tag => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setTextColor(100, 100, 100);
        pdf.text(tag.tag, margin, yPos);
        
        pdf.setTextColor(0, 0, 0);
        const hours = formatHours(tag.hours);
        pdf.text(hours, margin + 60, yPos);
        
        const percentage = `${tag.percentage.toFixed(1)}%`;
        pdf.text(percentage, margin + 90, yPos);
        
        yPos += 7;
      });
    }

    // Footer
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Gerado por TimeFlow em ${formatDate(new Date().toISOString())}`,
      margin,
      footerY
    );
    pdf.text(
      `Página ${pdf.getNumberOfPages()}`,
      pageWidth - margin - 15,
      footerY
    );

    // Save PDF
    const fileName = `${reportName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
    pdf.save(fileName);
  }

  /**
   * Capture DOM element and add to PDF
   */
  static async captureElementToPDF(
    elementId: string,
    fileName: string
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(fileName);
  }
}
