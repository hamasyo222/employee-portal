import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  onSubmit: (answers: Record<string, string>, score: number) => void;
  onCancel?: () => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  questions,
  timeLimit,
  onSubmit,
  onCancel
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : 0);
  const [isTimerActive, setIsTimerActive] = useState(!!timeLimit);

  // Timer effect
  useEffect(() => {
    if (!isTimerActive || !timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLimit]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = () => {
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
      if (answers[q] === correctAnswers[q as keyof typeof correctAnswers]) {
        correct++;
      }
    });
    
    const calculatedScore = Math.round((correct / questions.length) * 100);
    setScore(calculatedScore);
    setSubmitted(true);
    
    // Call the onSubmit callback
    onSubmit(answers, calculatedScore);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setTimeRemaining(timeLimit ? timeLimit * 60 : 0);
    setIsTimerActive(!!timeLimit);
  };

  if (submitted) {
    return (
      <div className="bg-white p-6 h-full overflow-y-auto">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
            <span className="text-3xl font-bold text-blue-600">{score}%</span>
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">
            {score >= 80 ? 'おめでとうございます！' : 'もう少し頑張りましょう'}
          </h4>
          <p className="text-gray-600 mb-6">
            {score >= 80 
              ? 'テストに合格しました。次のステップに進むことができます。' 
              : 'テストの合格基準は80%以上です。もう一度学習内容を復習してから再挑戦してください。'}
          </p>
          
          <div className="flex justify-center space-x-4">
            {score < 80 && (
              <Button
                onClick={handleRetry}
                leftIcon={<ArrowPathIcon className="h-5 w-5" />}
              >
                再挑戦する
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                戻る
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">修了テスト</h3>
        {timeLimit && (
          <div className={`flex items-center ${timeRemaining < 60 ? 'text-red-600' : 'text-gray-700'}`}>
            <ClockIcon className="h-5 w-5 mr-1" />
            <span className="font-medium">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
            <p className="font-medium text-gray-900 mb-3">{question.question}</p>
            <div className="space-y-2">
              {question.options.map(option => (
                <label 
                  key={option.id} 
                  className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-50 ${
                    answers[question.id] === option.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => handleAnswerChange(question.id, option.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-6">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
          >
            キャンセル
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
        >
          テストを提出
        </Button>
      </div>
    </div>
  );
};