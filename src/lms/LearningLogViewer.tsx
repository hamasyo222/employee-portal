import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  ArrowDownTrayIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface LearningLog {
  action: string;
  timestamp: Date;
}

interface LearningLogViewerProps {
  logs: LearningLog[];
  startTime: Date;
  userName: string;
  courseName: string;
  totalTime: number; // in seconds
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercentage: number;
    score?: number;
  };
  onClose?: () => void;
}

export const LearningLogViewer: React.FC<LearningLogViewerProps> = ({
  logs,
  startTime,
  userName,
  courseName,
  totalTime,
  progress,
  onClose
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadLog = () => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set font for Japanese support
      doc.setFont('helvetica');
      doc.setLanguage('ja');
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('学習ログ記録', 105, 20, { align: 'center' });
      
      // Add course info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`コース: ${courseName || ''}`, 20, 40);
      doc.text(`受講者: ${userName || ''}`, 20, 50);
      doc.text(`開始日時: ${startTime.toLocaleString('ja-JP')}`, 20, 60);
      
      // Add table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('アクション', 20, 80);
      doc.text('日時', 120, 80);
      
      // Draw header line
      doc.setLineWidth(0.5);
      doc.line(20, 82, 190, 82);
      
      // Add table content
      doc.setFont('helvetica', 'normal');
      let yPos = 90;
      
      logs.forEach((log, index) => {
        // Add new page if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
          
          // Add table header on new page
          doc.setFont('helvetica', 'bold');
          doc.text('アクション', 20, yPos);
          doc.text('日時', 120, yPos);
          
          // Draw header line
          doc.line(20, yPos + 2, 190, yPos + 2);
          yPos += 10;
          doc.setFont('helvetica', 'normal');
        }
        
        doc.text(log.action, 20, yPos);
        doc.text(log.timestamp.toLocaleString('ja-JP'), 120, yPos);
        
        // Draw row separator
        if (index < logs.length - 1) {
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
      doc.text('学習サマリー', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const totalMinutes = Math.floor(totalTime / 60);
      doc.text(`総学習時間: ${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`, 20, yPos);
      yPos += 8;
      
      if (progress?.status === 'completed') {
        doc.text(`修了状況: 修了済み (進捗率: ${progress.progressPercentage}%)`, 20, yPos);
        yPos += 8;
        if (progress.score !== undefined) {
          doc.text(`最終スコア: ${progress.score}点`, 20, yPos);
        }
      } else {
        doc.text(`修了状況: 未修了 (進捗率: ${progress?.progressPercentage || 0}%)`, 20, yPos);
      }
      
      // Add certification
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('証明', 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text('上記の通り、学習が実施されたことを証明します。', 105, yPos, { align: 'center' });
      
      // Save the PDF
      doc.save(`${courseName || 'コース'}_学習ログ.pdf`);
      toast.success('学習ログをダウンロードしました');
    } catch (error) {
      console.error('Learning log generation error:', error);
      toast.error('学習ログの生成中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">学習ログ</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">学習サマリー</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-600">開始日時</p>
            <p className="font-medium">{startTime.toLocaleString('ja-JP')}</p>
          </div>
          <div>
            <p className="text-blue-600">総学習時間</p>
            <p className="font-medium">{formatTime(totalTime)}</p>
          </div>
          <div>
            <p className="text-blue-600">ステータス</p>
            <p className="font-medium">
              {progress?.status === 'completed' ? '修了' : 
               progress?.status === 'in_progress' ? '学習中' : '未開始'}
            </p>
          </div>
          <div>
            <p className="text-blue-600">進捗率</p>
            <p className="font-medium">{progress?.progressPercentage || 0}%</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日時
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.timestamp.toLocaleString('ja-JP')}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                  学習ログがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleDownloadLog}
          leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
        >
          ログをダウンロード
        </Button>
      </div>
    </div>
  );
};