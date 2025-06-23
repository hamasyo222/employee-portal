import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { BookOpen } from 'lucide-react';
import { useLMSStore } from '../../stores/lmsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const LMSPage: React.FC = () => {
  const { user } = useAuthStore();
  const { contents, categories, userProgress, fetchContents, fetchCategories, fetchUserProgress } = useLMSStore();
  const { products, fetchProducts } = usePaymentStore();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [showCompletionReportModal, setShowCompletionReportModal] = useState(false);
  const [showCourseDetailsModal, setShowCourseDetailsModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [accessibleContents, setAccessibleContents] = useState<string[]>([]);

  useEffect(() => {
    fetchContents();
    fetchCategories();
    fetchProducts();
    if (user?.id) {
      fetchUserProgress(user.id);
    }
  }, [user?.id, fetchContents, fetchCategories, fetchUserProgress, fetchProducts]);

  useEffect(() => {
    if (user) {
      // Collect all content IDs the user has access to
      const accessibleIds: string[] = [];
      
      // Direct user access
      if (user.accessibleContents) {
        accessibleIds.push(...user.accessibleContents);
      }
      
      // Company access
      if (user.companyId) {
        const companyAccessibleContents = contents.filter(content => 
          content.accessibleTo?.includes(user.companyId!)
        ).map(content => content.id);
        
        accessibleIds.push(...companyAccessibleContents);
      }
      
      // Purchased content (has progress)
      const purchasedContentIds = userProgress.map(progress => progress.contentId);
      accessibleIds.push(...purchasedContentIds);
      
      // Remove duplicates
      setAccessibleContents([...new Set(accessibleIds)]);
    }
  }, [user, contents, userProgress]);

  const getProgressForContent = (contentId: string) => {
    return userProgress.find(p => p.contentId === contentId);
  };

  const hasAccessToContent = (contentId: string) => {
    return accessibleContents.includes(contentId);
  };

  const filteredContents = contents.filter(content => {
    const matchesCategory = !selectedCategory || content.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (contentId: string) => {
    const progress = getProgressForContent(contentId);
    if (!progress || progress.status === 'not_started') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {t('lms.notStarted')}
        </span>
      );
    }
    if (progress.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          {t('lms.completed')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {t('lms.inProgress')} ({progress.progressPercentage}%)
      </span>
    );
  };

  const getAccessBadge = (contentId: string) => {
    if (hasAccessToContent(contentId)) {
      return null; // No badge needed if user has access
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        購入が必要
      </span>
    );
  };

  const getContentPrice = (contentId: string) => {
    const product = products.find(p => p.contentId === contentId);
    if (!product) return null;
    
    return {
      price: product.price,
      currency: product.currency,
      productId: product.id
    };
  };

  const completedCourses = userProgress.filter(p => p.status === 'completed');

  const handleDownloadCertificate = (contentId: string) => {
    const content = contents.find(c => c.id === contentId);
    const progress = userProgress.find(p => p.contentId === contentId);
    
    if (!content || !user || !progress) return;
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font for Japanese support
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
      doc.text(`${user.lastName} ${user.firstName}`, 148.5, 85, { align: 'center' });
      
      // Add more certificate text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(60, 60, 60);
      doc.text(t('certificate.text2'), 148.5, 100, { align: 'center' });
      
      // Add course title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text(`${content.title}`, 148.5, 115, { align: 'center' });
      
      // Add completion date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      const completionDate = progress.completedAt 
        ? new Date(progress.completedAt).toLocaleDateString('ja-JP')
        : new Date().toLocaleDateString('ja-JP');
      doc.text(`${t('certificate.completionDate')}: ${completionDate}`, 148.5, 135, { align: 'center' });
      
      // Add training hours
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      const trainingHours = Math.ceil(progress.timeSpent / 3600);
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
      doc.text(`${t('certificate.completionDate')}: ${completionDate}`, 277, 195, { align: 'right' });
      
      // Save the PDF
      doc.save(`${content.title}_${t('certificate.title')}.pdf`);
      toast.success(t('common.success'));
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDownloadCompletionReport = () => {
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
      doc.text(`会社名: ${user?.companyName || 'DX Seed株式会社'}`, 20, 40);
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
        const content = contents.find(c => c.id === course.contentId);
        if (!content) return;
        
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
        const startDate = course.startedAt ? new Date(course.startedAt).toLocaleDateString('ja-JP') : '-';
        const completionDate = course.completedAt ? new Date(course.completedAt).toLocaleDateString('ja-JP') : '-';
        const hours = Math.ceil(course.timeSpent / 3600);
        
        doc.text(`${user?.lastName} ${user?.firstName}`, 20, yPos);
        doc.text(content.title.substring(0, 30), 70, yPos);
        doc.text(startDate, 130, yPos);
        doc.text(completionDate, 155, yPos);
        doc.text(`${hours}時間`, 180, yPos);
        
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
      
      const totalHours = completedCourses.reduce((sum, course) => sum + Math.ceil(course.timeSpent / 3600), 0);
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
      doc.save('研修実施報告書.pdf');
      toast.success('研修実施報告書をダウンロードしました');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleDownloadCourseDetails = (contentId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (!content) return;
    
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Set font for Japanese support
      doc.setFont('helvetica');
      doc.setLanguage('ja');
      
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('研修カリキュラム詳細', 105, 20, { align: 'center' });
      
      // Add course info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(content.title, 105, 35, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      
      // Add course details
      let yPos = 50;
      
      doc.setFont('helvetica', 'bold');
      doc.text('コース概要', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      
      // Split description into multiple lines if needed
      const description = content.description;
      const splitDescription = doc.splitTextToSize(description, 170);
      doc.text(splitDescription, 20, yPos);
      yPos += splitDescription.length * 7 + 10;
      
      // Course metadata
      doc.setFont('helvetica', 'bold');
      doc.text('コース情報', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`カテゴリ: ${categories.find(c => c.id === content.categoryId)?.name || ''}`, 20, yPos);
      yPos += 8;
      
      doc.text(`難易度: ${t(`lms.difficulty.${content.difficultyLevel}`)}`, 20, yPos);
      yPos += 8;
      
      doc.text(`標準学習時間: ${content.estimatedDuration}分`, 20, yPos);
      yPos += 8;
      
      doc.text(`コンテンツタイプ: ${content.contentType === 'video' ? '動画' : 
                                  content.contentType === 'text' ? 'テキスト' : 
                                  content.contentType === 'quiz' ? 'クイズ' : 'インタラクティブ'}`, 20, yPos);
      yPos += 20;
      
      // Learning objectives
      doc.setFont('helvetica', 'bold');
      doc.text('学習目標', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const objectives = [
        '・このコースを通じて、基本的な概念を理解する',
        '・実践的なスキルを習得する',
        '・応用問題を解決する能力を身につける',
        '・実際のプロジェクトに活用できるようになる'
      ];
      
      objectives.forEach(objective => {
        doc.text(objective, 20, yPos);
        yPos += 8;
      });
      yPos += 10;
      
      // Course structure
      doc.setFont('helvetica', 'bold');
      doc.text('コース構成', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      const modules = [
        { title: '第1章: 基礎知識', duration: 30 },
        { title: '第2章: 主要概念', duration: 45 },
        { title: '第3章: 実践演習', duration: 60 },
        { title: '第4章: 応用技術', duration: 45 },
        { title: '修了テスト', duration: 20 }
      ];
      
      modules.forEach((module, index) => {
        doc.text(`${module.title} (${module.duration}分)`, 20, yPos);
        yPos += 8;
        
        // Add new page if needed
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      yPos += 10;
      
      // Certification criteria
      doc.setFont('helvetica', 'bold');
      doc.text('修了条件', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text('・全ての章を完了すること', 20, yPos);
      yPos += 8;
      doc.text('・修了テストで80%以上の正答率を達成すること', 20, yPos);
      yPos += 8;
      doc.text('・総学習時間が標準学習時間の80%以上であること', 20, yPos);
      
      // Save the PDF
      doc.save(`${content.title}_カリキュラム詳細.pdf`);
      toast.success('カリキュラム詳細をダウンロードしました');
    } catch (error) {
      console.error('Course details generation error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleViewCourseDetails = (contentId: string) => {
    setSelectedCourseId(contentId);
    setShowCourseDetailsModal(true);
  };

  const handlePurchaseCourse = (contentId: string) => {
    const product = products.find(p => p.contentId === contentId);
    if (product) {
      window.location.href = `/payment/checkout/${product.id}`;
    } else {
      toast.error('このコースの購入情報が見つかりません');
    }
  };

  const getTotalLearningHours = () => {
    const totalSeconds = userProgress.reduce((total, p) => total + p.timeSpent, 0);
    return Math.ceil(totalSeconds / 3600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('lms.title')}</h1>
          <p className="text-gray-600">スキルアップのための学習コンテンツ</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCompletionReportModal(true)}
            className="btn-outline flex items-center"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            研修実施報告書
          </button>
          <button
            onClick={() => setShowCertificatesModal(true)}
            className="btn-outline flex items-center"
          >
            <AcademicCapIcon className="w-4 h-4 mr-2" />
            {t('lms.certificates')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {userProgress.filter(p => p.status === 'completed').length}
          </div>
          <p className="text-sm text-gray-600">完了コース</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {userProgress.filter(p => p.status === 'in_progress').length}
          </div>
          <p className="text-sm text-gray-600">学習中コース</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {getTotalLearningHours()}
          </div>
          <p className="text-sm text-gray-600">総学習時間（時間）</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {completedCourses.length > 0 ? 
              Math.round(completedCourses.reduce((sum, p) => sum + (p.bestScore || 0), 0) / completedCourses.length) : 0}
          </div>
          <p className="text-sm text-gray-600">平均スコア</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="コースを検索..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">全カテゴリ</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContents.map(content => {
          const progress = getProgressForContent(content.id);
          const category = categories.find(c => c.id === content.categoryId);
          const priceInfo = getContentPrice(content.id);
          const hasAccess = hasAccessToContent(content.id);
          
          return (
            <div
              key={content.id}
              className="card hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {content.thumbnailUrl ? (
                  <img
                    src={content.thumbnailUrl}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlayIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficultyLevel)}`}>
                    {t(`lms.difficulty.${content.difficultyLevel}`)}
                  </span>
                  {getStatusBadge(content.id)}
                </div>
                
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {content.title}
                </h3>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {content.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {content.estimatedDuration}{t('lms.minutes')}
                  </span>
                  <span>{category?.name}</span>
                </div>
                
                {progress && progress.status === 'in_progress' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progressPercentage}%` }}
                    ></div>
                  </div>
                )}

                {/* Price information */}
                {priceInfo && !hasAccess && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                    <span className="text-sm text-gray-600">価格:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {priceInfo.price.toLocaleString()} {priceInfo.currency === 'jpy' ? '円' : priceInfo.currency}
                    </span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  {hasAccess ? (
                    <Link
                      to={`/lms/course/${content.id}`}
                      className="btn-primary text-sm flex-1 flex items-center justify-center"
                    >
                      {progress?.status === 'completed' ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          復習する
                        </>
                      ) : progress?.status === 'in_progress' ? (
                        <>
                          <PlayIcon className="w-4 h-4 mr-1" />
                          続ける
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-1" />
                          開始する
                        </>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handlePurchaseCourse(content.id)}
                      className="btn-primary text-sm flex-1 flex items-center justify-center"
                    >
                      購入する
                    </button>
                  )}
                  <button
                    onClick={() => handleViewCourseDetails(content.id)}
                    className="btn-outline text-sm px-3"
                    title="コース詳細"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredContents.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">コースが見つかりません</h3>
          <p className="mt-1 text-sm text-gray-500">
            検索条件を変更してお試しください
          </p>
        </div>
      )}

      {/* Certificates Modal */}
      {showCertificatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('lms.certificates')}</h3>
              <button 
                onClick={() => setShowCertificatesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {completedCourses.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  {t('lms.completed')} {completedCourses.length} {t('lms.title')}
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('lms.title')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('certificate.completionDate')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学習時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          スコア
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('common.action')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedCourses.map(course => {
                        const content = contents.find(c => c.id === course.contentId);
                        if (!content) return null;
                        
                        return (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{content.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {course.completedAt ? new Date(course.completedAt).toLocaleDateString('ja-JP') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {Math.ceil(course.timeSpent / 3600)}時間
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {course.bestScore || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDownloadCertificate(course.contentId)}
                                className="text-blue-600 hover:text-blue-900 flex items-center justify-end ml-auto"
                              >
                                <AcademicCapIcon className="h-4 w-4 mr-1" />
                                {t('lms.downloadCertificate')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {t('lms.certificates')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  コースを完了すると修了証が発行されます
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completion Report Modal */}
      {showCompletionReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">研修実施報告書</h3>
              <button 
                onClick={() => setShowCompletionReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {completedCourses.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">人材開発支援助成金について</h4>
                  <p className="text-sm text-blue-700">
                    この報告書は人材開発支援助成金の申請に必要な研修実施の証明として使用できます。
                    助成金申請には、研修の実施記録として受講者の学習履歴や修了状況の証明が必要です。
                  </p>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">研修実施概要</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">会社名</p>
                      <p className="font-medium">{user?.companyName || 'DX Seed株式会社'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">受講者</p>
                      <p className="font-medium">{user?.lastName} {user?.firstName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">総修了コース数</p>
                      <p className="font-medium">{completedCourses.length}コース</p>
                    </div>
                    <div>
                      <p className="text-gray-500">総学習時間</p>
                      <p className="font-medium">{getTotalLearningHours()}時間</p>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          コース名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          開始日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          修了日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          学習時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          修了状況
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedCourses.map(course => {
                        const content = contents.find(c => c.id === course.contentId);
                        if (!content) return null;
                        
                        return (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{content.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {course.startedAt ? new Date(course.startedAt).toLocaleDateString('ja-JP') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {course.completedAt ? new Date(course.completedAt).toLocaleDateString('ja-JP') : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {Math.ceil(course.timeSpent / 3600)}時間
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                修了
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleDownloadCompletionReport}
                    className="btn-primary flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    報告書をダウンロード
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  修了コースがありません
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  コースを完了すると研修実施報告書を作成できます
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showCourseDetailsModal && selectedCourseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">研修カリキュラム詳細</h3>
              <button 
                onClick={() => setShowCourseDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {(() => {
              const content = contents.find(c => c.id === selectedCourseId);
              if (!content) return null;
              
              const category = categories.find(c => c.id === content.categoryId);
              const priceInfo = getContentPrice(content.id);
              const hasAccess = hasAccessToContent(content.id);
              
              return (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {content.thumbnailUrl ? (
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlayIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{content.title}</h4>
                      <p className="text-sm text-gray-500">
                        {category?.name} • {t(`lms.difficulty.${content.difficultyLevel}`)} • 
                        {content.estimatedDuration}{t('lms.minutes')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">助成金対応コース</h4>
                    <p className="text-sm text-blue-700">
                      このコースは人材開発支援助成金の要件を満たすよう設計されています。
                      標準学習時間は{Math.ceil(content.estimatedDuration / 60)}時間で、インタラクティブな要素と確認テストを含みます。
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">コース概要</h4>
                    <p className="text-gray-700">{content.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">学習目標</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>基本的な概念を理解する</li>
                      <li>実践的なスキルを習得する</li>
                      <li>応用問題を解決する能力を身につける</li>
                      <li>実際のプロジェクトに活用できるようになる</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">コース構成</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">1</span>
                          <span>基礎知識</span>
                        </div>
                        <span className="text-sm text-gray-500">30分</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">2</span>
                          <span>主要概念</span>
                        </div>
                        <span className="text-sm text-gray-500">45分</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">3</span>
                          <span>実践演習</span>
                        </div>
                        <span className="text-sm text-gray-500">60分</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-3">4</span>
                          <span>応用技術</span>
                        </div>
                        <span className="text-sm text-gray-500">45分</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-800 rounded-full mr-3">
                            <CheckCircleIcon className="w-4 h-4" />
                          </span>
                          <span>修了テスト</span>
                        </div>
                        <span className="text-sm text-gray-500">20分</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">修了条件</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>全ての章を完了すること</li>
                      <li>修了テストで80%以上の正答率を達成すること</li>
                      <li>総学習時間が標準学習時間の80%以上であること</li>
                    </ul>
                  </div>
                  
                  {/* Price information */}
                  {priceInfo && !hasAccess && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">価格情報</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">価格:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {priceInfo.price.toLocaleString()} {priceInfo.currency === 'jpy' ? '円' : priceInfo.currency}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    {hasAccess ? (
                      <Link
                        to={`/lms/course/${content.id}`}
                        className="btn-primary"
                      >
                        コースを開始
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePurchaseCourse(content.id)}
                        className="btn-primary"
                        disabled={!priceInfo}
                      >
                        購入する
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadCourseDetails(content.id)}
                      className="btn-outline flex items-center"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      カリキュラム詳細をダウンロード
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSPage;