import React from 'react';
import { jsPDF } from 'jspdf';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface CertificateGeneratorProps {
  userName: string;
  courseName: string;
  completionDate: Date;
  trainingHours: number;
  onGenerated?: (url: string) => void;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  userName,
  courseName,
  completionDate,
  trainingHours,
  onGenerated
}) => {
  const { t } = useTranslation();

  const generateCertificate = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add font for Japanese support
      // In a production environment, you would need to include the font file
      // and use doc.addFont() to add it properly
      doc.setFont('helvetica');
      doc.setLanguage('ja');
      
      // Set background color
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, 297, 210, 'F');
      
      // Add decorative border
      doc.setDrawColor(0, 48, 135);
      doc.setLineWidth(3);
      doc.rect(10, 10, 277, 190);
      
      // Add inner decorative border
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(1);
      doc.rect(15, 15, 267, 180);
      
      // Add certificate title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(30);
      doc.setTextColor(0, 48, 135);
      doc.text(t('certificate.title'), 148.5, 40, { align: 'center' });
      
      // Add decorative line under title
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(1);
      doc.line(74, 45, 223, 45);
      
      // Add certificate text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text(t('certificate.text1'), 148.5, 70, { align: 'center' });
      
      // Add user name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(userName, 148.5, 85, { align: 'center' });
      
      // Add more certificate text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text(t('certificate.text2'), 148.5, 100, { align: 'center' });
      
      // Add course title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(`${courseName}`, 148.5, 115, { align: 'center' });
      
      // Add completion date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      const formattedDate = completionDate.toLocaleDateString('ja-JP');
      doc.text(`${t('certificate.completionDate')}: ${formattedDate}`, 148.5, 135, { align: 'center' });
      
      // Add training hours
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`研修時間: ${trainingHours}時間`, 148.5, 145, { align: 'center' });
      
      // Add organization info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 48, 135);
      doc.text(t('certificate.organization'), 148.5, 160, { align: 'center' });
      
      // Add signature line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(118.5, 170, 178.5, 170);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(t('certificate.representative'), 148.5, 178, { align: 'center' });
      
      // Add certificate ID and date at bottom
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
      doc.text(`${t('certificate.certificateId')}: ${certId}`, 20, 195);
      doc.text(`${t('certificate.completionDate')}: ${formattedDate}`, 277, 195, { align: 'right' });
      
      // Save the PDF
      const pdfOutput = doc.output('datauristring');
      
      // Call the onGenerated callback with the PDF URL
      if (onGenerated) {
        onGenerated(pdfOutput);
      }
      
      // Save the PDF to the user's device
      doc.save(`${courseName}_${t('certificate.title')}.pdf`);
      toast.success(t('common.success'));
      
      return pdfOutput;
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.error(t('common.error'));
      return null;
    }
  };

  return (
    <Button
      onClick={generateCertificate}
      leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
    >
      {t('lms.downloadCertificate')}
    </Button>
  );
};