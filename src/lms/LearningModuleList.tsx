import React from 'react';
import { 
  CheckCircleIcon,
  PlayIcon,
  ClockIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

interface Module {
  id: string;
  title: string;
  description?: string;
  duration: number;
  sortOrder: number;
  isRequired: boolean;
  contentType: 'video' | 'text' | 'quiz' | 'interactive';
}

interface LearningModuleListProps {
  modules: Module[];
  currentModule: number;
  isWatching: boolean;
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progressPercentage: number;
  };
  onModuleSelect?: (moduleIndex: number) => void;
}

export const LearningModuleList: React.FC<LearningModuleListProps> = ({
  modules,
  currentModule,
  isWatching,
  progress,
  onModuleSelect
}) => {
  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon className="h-5 w-5" />;
      case 'text':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'quiz':
        return <QuestionMarkCircleIcon className="h-5 w-5" />;
      case 'interactive':
        return <CursorArrowRaysIcon className="h-5 w-5" />;
      default:
        return <PlayIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-3">
      {modules.map((module, index) => (
        <div 
          key={module.id || index}
          className={`flex justify-between items-center p-3 rounded-lg cursor-pointer ${
            currentModule === index && isWatching 
              ? 'bg-blue-100 border border-blue-300' 
              : index < currentModule || (progress?.status === 'completed')
              ? 'bg-green-50 border border-green-200'
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
          onClick={() => onModuleSelect && onModuleSelect(index)}
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
                getModuleIcon(module.contentType)
              )}
            </span>
            <div>
              <span className="font-medium">{module.title}</span>
              {module.description && (
                <p className="text-xs text-gray-500 mt-1">{module.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {module.duration}分
            </span>
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
  );
};