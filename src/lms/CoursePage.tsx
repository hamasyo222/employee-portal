import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  AcademicCapIcon,
  XMarkIcon,
  PauseIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useLMSStore } from '../../stores/lmsStore';
import { useAuthStore } from '../../stores/authStore';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { usePaymentStore } from '../../stores/paymentStore';

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const { contents, categories, userProgress, updateProgress } = useLMSStore();
  const { products } = usePaymentStore();
  const { t } = useTranslation();
  const [isWatching, setIsWatching] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [showNotes, setShowNotes] = useState(false);
  const [currentModule, setCurrentModule] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [learningLog, setLearningLog] = useState<{startTime: Date, logs: {action: string, timestamp: Date}[]}>({
    startTime: new Date(),
    logs: []
  });
  const [showLearningLog, setShowLearningLog] = useState(false);
  const [watchTimer, setWatchTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const content = contents.find(c => c.id === courseId);
  const category = content ? categories.find(c => c.id === content.categoryId) : null;
  const progress = userProgress.find(p => p.contentId === courseId);
  const relatedProduct = products.find(p => p.contentId === courseId);

  useEffect(() => {
    // Load notes from localStorage
    if (courseId && user?.id) {
      const savedNotes = localStorage.getItem(`notes_${user.id}_${courseId}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    }
  }, [courseId, user?.id]);

  useEffect(() => {
    // Check if user has access to this course
    if (user && content) {
      // Check if user has direct access to this content
      const hasDirectAccess = user.accessibleContents?.includes(content.id);
      
      // Check if user's company has access to this content
      const hasCompanyAccess = user.companyId && content.accessibleTo?.includes(user.companyId);
      
      // Check if user has purchased this course
      const hasPurchased = progress !== undefined;
      
      setHasAccess(hasDirectAccess || hasCompanyAccess || hasPurchased);
    }
  }, [user, content, progress]);

  // Timer for tracking watch time
  useEffect(() => {
    let interval: number | null = null;
    
    if (timerActive) {
      interval = window.setInterval(() => {
        setWatchTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  const handleStartLearning = async () => {
    if (!courseId) return;
    
    if (!hasAccess) {
      setShowPurchaseModal(true);
      return;
    }
    
    setIsWatching(true);
    setTimerActive(true);
    
    // Add to learning log
    addToLearningLog('開始');
    
    // Start progress tracking
    if (!progress) {
      await updateProgress(courseId, {
        status: 'in_progress',
        progressPercentage: 0,
        startedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
      });
    } else {
      await updateProgress(courseId, {
        lastAccessedAt: new Date().toISOString(),
      });
    }
  };

  const handlePauseResumeVideo = () => {
    setTimerActive(prev => !prev);
    addToLearningLog(timerActive ? '一時停止' : '再開');
  };

  const handleModuleCompletion = async (moduleIndex: number) => {
    if (!courseId) return;
    
    // Calculate new progress percentage
    const totalModules = 5; // Assuming 5 modules including final quiz
    const newPercentage = Math.min(100, Math.round(((moduleIndex + 1) / totalModules) * 100));
    
    // Add to learning log
    addToLearningLog(`モジュール${moduleIndex + 1}完了`);
    
    // Update progress
    await updateProgress(courseId, {
      progressPercentage: newPercentage,
      status: newPercentage === 100 ? 'completed' : 'in_progress',
      timeSpent: (progress?.timeSpent || 0) + watchTimer,
      lastAccessedAt: new Date().toISOString(),
    });
    
    // Move to next module
    if (moduleIndex < 4) {
      setCurrentModule(moduleIndex + 1);
    } else {
      // Show final quiz
      setShowQuiz(true);
      setTimerActive(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (!courseId) return;
    
    // Calculate score
    const correctAnswers = {
      'q1': 'b',
      'q2': 'c',
      'q3': 'a',
      'q4': 'd',
      'q5': 'b'
    };
    
    let correct = 0;
    Object.keys(correctAnswers).forEach(q => {
      if (quizAnswers[q] === correctAnswers[q as keyof typeof correctAnswers]) {
        correct++;
      }
    });
    
    const score = Math.round((correct / 5) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Add to learning log
    addToLearningLog(`修了テスト完了: ${score}点`);
    
    // Update progress
    await updateProgress(courseId, {
      progressPercentage: 100,
      status: 'completed',
      timeSpent: (progress?.timeSpent || 0) + watchTimer,
      completedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      bestScore: score,
    });
  };

  const addToLearningLog = (action: string) => {
    setLearningLog(prev => ({
      ...prev,
      logs: [...prev.logs, {action, timestamp: new Date()}]
    }));
  };

  const handleSaveNotes = () => {
    if (courseId && user?.id) {
      localStorage.setItem(`notes_${user.id}_${courseId}`, notes);
      toast.success(t('common.success'));
      setShowNotes(false);
      
      // Add to learning log
      addToLearningLog('ノート保存');
    }
  };

  const handleDownloadCertificate = () => {
    if (!content || !user) return;
    
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
      const completionDate = progress?.completedAt 
        ? new Date(progress.completedAt).toLocaleDateString('ja-JP')
        : new Date().toLocaleDateString('ja-JP');
      doc.text(`${t('certificate.completionDate')}: ${completionDate}`, 148.5, 135, { align: 'center' });
      
      // Add training hours
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      const trainingHours = progress ? Math.ceil(progress.timeSpent / 3600) : Math.ceil(content.estimatedDuration / 60);
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

  const handleDownloadLearningLog = () => {
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
      doc.text(`コース: ${content?.title || ''}`, 20, 40);
      doc.text(`受講者: ${user?.lastName || ''} ${user?.firstName || ''}`, 20, 50);
      doc.text(`開始日時: ${learningLog.startTime.toLocaleString('ja-JP')}`, 20, 60);
      
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
      
      learningLog.logs.forEach((log, index) => {
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
        if (index < learningLog.logs.length - 1) {
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
      const totalMinutes = Math.floor(watchTimer / 60);
      doc.text(`総学習時間: ${Math.floor(totalMinutes / 60)}時間${totalMinutes % 60}分`, 20, yPos);
      yPos += 8;
      
      if (progress?.status === 'completed') {
        doc.text(`修了状況: 修了済み (${progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('ja-JP') : '日付不明'})`, 20, yPos);
        yPos += 8;
        doc.text(`最終スコア: ${progress.bestScore || 0}点`, 20, yPos);
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
      doc.save(`${content?.title || 'コース'}_学習ログ.pdf`);
      toast.success('学習ログをダウンロードしました');
    } catch (error) {
      console.error('Learning log generation error:', error);
      toast.error(t('common.error'));
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePurchaseCourse = () => {
    if (relatedProduct) {
      window.location.href = `/payment/checkout/${relatedProduct.id}`;
    } else {
      toast.error('このコースの購入情報が見つかりません');
    }
  };

  if (!content) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">{t('common.error')}</h3>
        <Link to="/lms" className="mt-4 btn-primary">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get related courses
  const relatedCourses = contents
    .filter(c => c.id !== content.id && c.categoryId === content.categoryId)
    .slice(0, 3);

  // Quiz questions
  const quizQuestions = [
    {
      id: 'q1',
      question: '質問1: このコースの主要な目的は何ですか？',
      options: [
        { id: 'a', text: '一般教養を高める' },
        { id: 'b', text: '職務に必要な専門知識・技能の習得' },
        { id: 'c', text: '趣味を広げる' },
        { id: 'd', text: '資格取得のみ' }
      ]
    },
    {
      id: 'q2',
      question: '質問2: 効果的な学習方法として最も適切なのはどれですか？',
      options: [
        { id: 'a', text: '一度に長時間学習する' },
        { id: 'b', text: '内容を理解せず先に進む' },
        { id: 'c', text: '定期的に短時間の学習を繰り返す' },
        { id: 'd', text: 'テストだけ受ける' }
      ]
    },
    {
      id: 'q3',
      question: '質問3: 学習内容を実務に活かすために最も重要なのは？',
      options: [
        { id: 'a', text: '学んだ内容を実際の業務で実践してみる' },
        { id: 'b', text: '資格を取得する' },
        { id: 'c', text: '他の人に教える' },
        { id: 'd', text: '関連書籍を読む' }
      ]
    },
    {
      id: 'q4',
      question: '質問4: eラーニングの利点として最も適切なのはどれですか？',
      options: [
        { id: 'a', text: '常に講師に質問できる' },
        { id: 'b', text: 'グループワークができる' },
        { id: 'c', text: '対面でのコミュニケーションスキルが向上する' },
        { id: 'd', text: '自分のペースで学習を進められる' }
      ]
    },
    {
      id: 'q5',
      question: '質問5: 学習効果を高めるために推奨される方法は？',
      options: [
        { id: 'a', text: '一度に全ての内容を学習する' },
        { id: 'b', text: 'ノートを取りながら学習する' },
        { id: 'c', text: '音声をオフにして学習する' },
        { id: 'd', text: '集中せずに複数のタスクを同時に行う' }
      ]
    }
  ];

  // Course modules
  const courseModules = [
    { title: '第1章: 基礎知識', duration: 30 },
    { title: '第2章: 主要概念', duration: 45 },
    { title: '第3章: 実践演習', duration: 60 },
    { title: '第4章: 応用技術', duration: 45 },
    { title: '修了テスト', duration: 20 }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/lms" className="hover:text-gray-700">
          {t('lms.title')}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{content.title}</span>
      </div>

      {/* Back Button */}
      <Link to="/lms" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player Area */}
          <div className="card">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {!isWatching ? (
                <div className="relative">
                  <img
                    src={content.thumbnailUrl || 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg'}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <button
                      onClick={handleStartLearning}
                      className="bg-white bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition-all"
                    >
                      <PlayIcon className="h-8 w-8 text-gray-900" />
                    </button>
                  </div>
                </div>
              ) : showQuiz ? (
                <div className="bg-white p-6 h-full overflow-y-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">修了テスト</h3>
                  
                  {!quizSubmitted ? (
                    <div className="space-y-6">
                      {quizQuestions.map(question => (
                        <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                          <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                          <div className="space-y-2">
                            {question.options.map(option => (
                              <label key={option.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option.id}
                                  checked={quizAnswers[question.id] === option.id}
                                  onChange={() => setQuizAnswers({...quizAnswers, [question.id]: option.id})}
                                  className="h-4 w-4 text-blue-600"
                                />
                                <span>{option.text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < 5}
                        className="btn-primary w-full"
                      >
                        テストを提出
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
                        <span className="text-3xl font-bold text-blue-600">{quizScore}%</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {quizScore >= 80 ? 'おめでとうございます！' : 'もう少し頑張りましょう'}
                      </h4>
                      <p className="text-gray-600 mb-6">
                        {quizScore >= 80 
                          ? 'テストに合格し、コースを修了しました。修了証をダウンロードできます。' 
                          : 'テストの合格基準は80%以上です。もう一度学習内容を復習してから再挑戦してください。'}
                      </p>
                      
                      {quizScore >= 80 ? (
                        <button
                          onClick={handleDownloadCertificate}
                          className="btn-primary flex items-center mx-auto"
                        >
                          <AcademicCapIcon className="h-5 w-5 mr-2" />
                          修了証をダウンロード
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                          }}
                          className="btn-primary flex items-center mx-auto"
                        >
                          <ArrowPathIcon className="h-5 w-5 mr-2" />
                          再挑戦する
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-4">
                        {courseModules[currentModule].title}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        現在学習中のモジュールです。集中して取り組みましょう。
                      </p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={handlePauseResumeVideo}
                          className="bg-white rounded-full p-3"
                        >
                          {timerActive ? (
                            <PauseIcon className="h-6 w-6 text-gray-900" />
                          ) : (
                            <PlayIcon className="h-6 w-6 text-gray-900" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                      <span>{formatTime(watchTimer)}</span>
                    </div>
                    
                    <button
                      onClick={() => handleModuleCompletion(currentModule)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      次へ進む
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {progress && !showQuiz && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('lms.progress')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {progress.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Course Description */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('lms.courseOverview')}</h2>
            <p className="text-gray-700 leading-relaxed">{content.description}</p>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">助成金対応コース</h3>
              <p className="text-sm text-blue-700">
                このコースは人材開発支援助成金の要件を満たすよう設計されています。
                標準学習時間は{Math.ceil(content.estimatedDuration / 60)}時間で、インタラクティブな要素と確認テストを含みます。
                コース修了後は修了証明書と学習ログを出力できます。
              </p>
            </div>
          </div>

          {/* Course Modules */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">コース構成</h2>
            <div className="space-y-3">
              {courseModules.map((module, index) => (
                <div 
                  key={index}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    currentModule === index && isWatching 
                      ? 'bg-blue-100 border border-blue-300' 
                      : index < currentModule || (progress?.status === 'completed')
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                      currentModule === index && isWatching 
                        ? 'bg-blue-200 text-blue-800' 
                        : index < currentModule || (progress?.status === 'completed')
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {index < currentModule || (progress?.status === 'completed') ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="font-medium">{module.title}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-4">{module.duration}分</span>
                    {(index < currentModule || (progress?.status === 'completed')) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        完了
                      </span>
                    )}
                    {currentModule === index && isWatching && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        学習中
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('lms.learningObjectives')}</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>基本的な概念を理解する</li>
              <li>実践的なスキルを習得する</li>
              <li>応用問題を解決する能力を身につける</li>
              <li>実際のプロジェクトに活用できるようになる</li>
            </ul>
          </div>

          {/* Notes Modal */}
          {showNotes && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t('notes.title')}</h3>
                  <button 
                    onClick={() => setShowNotes(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <textarea
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notes.placeholder')}
                />
                <div className="flex justify-end mt-4 space-x-2">
                  <button 
                    onClick={() => setShowNotes(false)}
                    className="btn-outline"
                  >
                    {t('notes.cancel')}
                  </button>
                  <button 
                    onClick={handleSaveNotes}
                    className="btn-primary"
                  >
                    {t('notes.save')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Learning Log Modal */}
          {showLearningLog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">学習ログ</h3>
                  <button 
                    onClick={() => setShowLearningLog(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">学習サマリー</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600">開始日時</p>
                      <p className="font-medium">{learningLog.startTime.toLocaleString('ja-JP')}</p>
                    </div>
                    <div>
                      <p className="text-blue-600">総学習時間</p>
                      <p className="font-medium">{formatTime(watchTimer)}</p>
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
                      {learningLog.logs.map((log, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.timestamp.toLocaleString('ja-JP')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button 
                    onClick={() => setShowLearningLog(false)}
                    className="btn-outline"
                  >
                    閉じる
                  </button>
                  <button 
                    onClick={handleDownloadLearningLog}
                    className="btn-primary flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    ログをダウンロード
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Modal */}
          {showPurchaseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">コースの購入</h3>
                  <button 
                    onClick={() => setShowPurchaseModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    このコースを利用するには購入が必要です。
                  </p>
                  
                  {relatedProduct ? (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">価格:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {relatedProduct.price.toLocaleString()} {relatedProduct.currency === 'jpy' ? '円' : relatedProduct.currency}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <p className="text-yellow-800">
                        このコースの価格情報が見つかりません。管理者にお問い合わせください。
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => setShowPurchaseModal(false)}
                    className="btn-outline"
                  >
                    キャンセル
                  </button>
                  <button 
                    onClick={handlePurchaseCourse}
                    className="btn-primary"
                    disabled={!relatedProduct}
                  >
                    購入する
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">{t('lms.courseInfo')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('lms.difficulty.beginner')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficultyLevel)}`}>
                  {t(`lms.difficulty.${content.difficultyLevel}`)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('matching.category')}</span>
                <span className="text-sm font-medium text-gray-900">{category?.name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('lms.estimatedTime')}</span>
                <span className="text-sm font-medium text-gray-900 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {content.estimatedDuration}{t('lms.minutes')}
                </span>
              </div>
              
              {progress && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">実際の学習時間</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.floor(progress.timeSpent / 60)}{t('lms.minutes')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('lms.lastAccessed')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {progress.lastAccessedAt && new Date(progress.lastAccessedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </>
              )}
              
              {/* Price information */}
              {relatedProduct && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="text-sm text-gray-600">価格</span>
                  <span className="text-sm font-medium text-gray-900">
                    {relatedProduct.price.toLocaleString()} {relatedProduct.currency === 'jpy' ? '円' : relatedProduct.currency}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="space-y-3">
              {!hasAccess ? (
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="btn-primary w-full"
                >
                  コースを購入する
                </button>
              ) : !progress || progress.status === 'not_started' ? (
                <button
                  onClick={handleStartLearning}
                  className="btn-primary w-full"
                  disabled={isWatching}
                >
                  {t('lms.startLearning')}
                </button>
              ) : progress.status === 'completed' ? (
                <div className="text-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600 mb-3">{t('lms.completed')}</p>
                  <button 
                    className="btn-primary w-full"
                    onClick={handleDownloadCertificate}
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    {t('lms.downloadCertificate')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartLearning}
                  className="btn-primary w-full"
                  disabled={isWatching}
                >
                  {t('lms.continueLearning')}
                </button>
              )}
              
              <button 
                className="btn-outline w-full"
                onClick={() => setShowNotes(true)}
              >
                {t('lms.viewNotes')}
              </button>
              
              <button 
                className="btn-outline w-full flex items-center justify-center"
                onClick={() => setShowLearningLog(true)}
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                学習ログを表示
              </button>
              
              {progress?.status === 'completed' && (
                <button 
                  className="btn-outline w-full flex items-center justify-center"
                  onClick={() => handleDownloadLearningLog()}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  学習ログをダウンロード
                </button>
              )}
            </div>
          </div>

          {/* Related Courses */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">{t('lms.relatedCourses')}</h3>
            <div className="space-y-3">
              {relatedCourses.length > 0 ? (
                relatedCourses.map(relatedContent => (
                  <Link
                    key={relatedContent.id}
                    to={`/lms/course/${relatedContent.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {relatedContent.title}
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {relatedContent.estimatedDuration}{t('lms.minutes')}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t('lms.noRelatedCourses')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;