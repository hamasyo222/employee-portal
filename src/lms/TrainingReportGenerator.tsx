import React from 'react';
import { jsPDF } from 'jspdf';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LearningProgress } from '../../types';

interface TrainingReportGeneratorProps {
  userName: string;
  companyName?: string;
  completedCourses: {
    id: string;
    title: string;
    startDate?: string;
    completionDate?: string;
    trainingHours: number;
    score?: number;
  }[];
  onGenerated?: (url: string) => void;
}

export const TrainingReportGenerator: React.FC<TrainingReportGeneratorProps> = ({
  userName,
  companyName = 'DX Seed株式会社',
  completedCourses,
  onGenerated
}) => {
  const { t } = useTranslation();

  const generateReport = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set font for Japanese support
      doc.setFont('helvetica');
      doc.setLanguage('ja');
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('研修実施報告書', 105, 20, { align: 'center' });
      
      // Add company info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`会社名: ${companyName}`, 20, 40);
      doc.text(`報告日: ${new Date().toLocaleDateString('ja-JP')}`, 20, 50);
      
      // Add table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('受講者名', 20, 70);
      doc.text('コース名', 70, 70);
      doc.text('開始日', 130, 70);
      doc.text('修了日', 155, 70);
      doc.text('学習時間', 180, 70);
      
      // Draw header line
      doc.setLineWidth(0.5);
      doc.line(20, 72, 190, 72);
      
      // Add table content
      doc.setFont('helvetica', 'normal');
      let yPos = 80;
      
      completedCourses.forEach((course, index) => {
        // Add new page if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          
          // Add table header on new page
          doc.setFont('helvetica', 'bold');
          doc.text('受講者名', 20, yPos);
          doc.text('コース名', 70, yPos);
          doc.text('開始日', 130, yPos);
          doc.text('修了日', 155, yPos);
          doc.text('学習時間', 180, yPos);
          
          // Draw header line
          doc.line(20, yPos + 2, 190, yPos + 2);
          yPos += 10;
          doc.setFont('helvetica', 'normal');
        }
        
        // Format dates
        const startDate = course.startDate ? new Date(course.startDate).toLocaleDateString('ja-JP') : '-';
        const completionDate = course.completionDate ? new Date(course.completionDate).toLocaleDateString('ja-JP') : '-';
        
        doc.text(userName, 20, yPos);
        doc.text(course.title.substring(0, 30), 70, yPos);
        doc.text(startDate, 130, yPos);
        doc.text(completionDate, 155, yPos);
        doc.text(`${course.trainingHours}時間`, 180, yPos);
        
        // Draw row separator
        if (index < completedCourses.length - 1) {
          doc.setLineWidth(0.1);
          doc.line(20, yPos + 2, 190, yPos + 2);
        }
        
        yPos += 10;
      });
      
      // Draw bottom line
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      
      // Add summary
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('研修サマリー', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`総修了コース数: ${completedCourses.length}`, 20, yPos);
      yPos += 8;
      
      const totalHours = completedCourses.reduce((sum, course) => sum + course.trainingHours, 0);
      doc.text(`総学習時間: ${totalHours}時間`, 20, yPos);
      yPos += 8;
      
      // Add certification
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('証明', 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text('上記の通り、研修が実施されたことを証明します。', 105, yPos, { align: 'center' });
      yPos += 20;
      
      // Add signature line
      doc.line(70, yPos, 140, yPos);
      yPos += 10;
      doc.text('研修責任者署名', 105, yPos, { align: 'center' });
      
      // Save the PDF
      const pdfOutput = doc.output('datauristring');
      
      // Call the onGenerated callback with the PDF URL
      if (onGenerated) {
        onGenerated(pdfOutput);
      }
      
      // Save the PDF to the user's device
      doc.save('研修実施報告書.pdf');
      toast.success('研修実施報告書をダウンロードしました');
      
      return pdfOutput;
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(t('common.error'));
      return null;
    }
  };

  return (
    <Button
      onClick={generateReport}
      leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
    >
      報告書をダウンロード
    </Button>
  );
};