import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MagnifyingGlassIcon,
  UsersIcon,
  MapPinIcon,
  BriefcaseIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface Talent {
  id: string;
  type: 'dx' | 'foreign';
  profile: {
    firstName: string;
    lastName: string;
    age?: number;
    gender?: string;
    nationality?: string;
    location: string;
    skills: string[];
    experience?: number;
    availability: 'immediate' | 'within_month' | 'flexible';
    rating: number;
    specificSkillField?: string;
  };
  summary: string;
}

const MatchingPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [searchFilters, setSearchFilters] = useState({
    talentType: 'dx',
    skills: '',
    location: '',
    experience: ''
  });
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewMessage, setInterviewMessage] = useState('');

  useEffect(() => {
    loadTalents();
  }, []);

  useEffect(() => {
    filterTalents();
  }, [talents, searchFilters]);

  const loadTalents = async () => {
    // In a real application, this would be an API call
    // For now, we'll use mock data
    const mockTalents: Talent[] = [
      {
        id: '1',
        type: 'dx',
        profile: {
          firstName: '美咲',
          lastName: '田中',
          age: 28,
          gender: 'female',
          location: '静岡県浜松市',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          experience: 3,
          availability: 'immediate',
          rating: 4.8
        },
        summary: 'フロントエンド開発を得意とするDX人材。React、Vue.jsでの開発経験豊富。'
      },
      {
        id: '2',
        type: 'dx',
        profile: {
          firstName: '健太',
          lastName: '佐藤',
          age: 32,
          gender: 'male',
          location: '静岡県静岡市',
          skills: ['Python', 'データ分析', 'AI/ML', 'SQL'],
          experience: 5,
          availability: 'within_month',
          rating: 4.9
        },
        summary: 'データサイエンティスト。機械学習を活用した業務効率化が専門。'
      },
      {
        id: '3',
        type: 'foreign',
        profile: {
          firstName: 'ヴァン・アン',
          lastName: 'グエン',
          age: 26,
          gender: 'male',
          nationality: 'ベトナム',
          location: '静岡県富士市',
          skills: ['介護技術', '日本語N3', 'コミュニケーション'],
          experience: 2,
          availability: 'immediate',
          rating: 4.6,
          specificSkillField: '介護'
        },
        summary: '介護分野での就労を希望。日本での介護技術研修経験あり。'
      }
    ];
    setTalents(mockTalents);
  };

  const filterTalents = () => {
    let filtered = talents;

    if (searchFilters.talentType === 'dx' && filtered.some(t => t.type === 'dx')) {
      filtered = filtered.filter(talent => talent.type === 'dx');
    }
    if (searchFilters.talentType === 'foreign' && filtered.some(t => t.type === 'foreign')) {
      filtered = filtered.filter(talent => talent.type === 'foreign');
    }
    if (searchFilters.location && filtered.length > 0) {
      filtered = filtered.filter(talent => 
        talent.profile.location.includes(searchFilters.location)
      );
    }
    if (searchFilters.skills && filtered.length > 0) {
      filtered = filtered.filter(talent => 
        talent.profile.skills.some(skill => 
          skill.toLowerCase().includes(searchFilters.skills.toLowerCase())
        )
      );
    }
    if (searchFilters.experience && filtered.length > 0) {
      const minExperience = parseInt(searchFilters.experience);
      filtered = filtered.filter(talent => 
        talent.profile.experience && talent.profile.experience >= minExperience
      );
    }

    setFilteredTalents(filtered);
  };

  const handleRequestInterview = (talent: Talent) => {
    setSelectedTalent(talent);
    setShowInterviewModal(true);
  };

  const handleSubmitInterviewRequest = () => {
    if (!interviewDate || !interviewTime) {
      toast.error('面接日時を選択してください');
      return;
    }

    // In a real application, this would be an API call
    toast.success(`${selectedTalent?.profile.lastName} ${selectedTalent?.profile.firstName}さんへの面接依頼を送信しました`);
    setShowInterviewModal(false);
    
    // Reset form
    setInterviewDate('');
    setInterviewTime('');
    setInterviewMessage('');
    setSelectedTalent(null);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-green-100 text-green-800';
      case 'within_month': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('matching.title')}</h1>
        <p className="text-gray-600">優秀な人材を見つけて面接を依頼しましょう</p>
      </div>

      {/* Search Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">検索条件</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">人材種別</label>
            <select
              className="input-field"
              value={searchFilters.talentType}
              onChange={(e) => setSearchFilters({...searchFilters, talentType: e.target.value})}
            >
              <option value="dx">DX人材</option>
              <option value="foreign">海外人材</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">スキル</label>
            <div className="relative">
              <input
                type="text"
                placeholder="例：JavaScript, Python"
                className="input-field pl-10"
                value={searchFilters.skills}
                onChange={(e) => setSearchFilters({...searchFilters, skills: e.target.value})}
              />
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          <div>
            <label className="form-label">勤務地</label>
            <div className="relative">
              <input
                type="text"
                placeholder="例：静岡県"
                className="input-field pl-10"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
              <MapPinIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          <div>
            <label className="form-label">経験年数</label>
            <select
              className="input-field"
              value={searchFilters.experience}
              onChange={(e) => setSearchFilters({...searchFilters, experience: e.target.value})}
            >
              <option value="">指定なし</option>
              <option value="1">1年以上</option>
              <option value="3">3年以上</option>
              <option value="5">5年以上</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            検索結果 ({filteredTalents.length}件)
          </h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">並び順:</label>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>評価順</option>
              <option>経験年数順</option>
              <option>最終ログイン順</option>
            </select>
          </div>
        </div>

        {filteredTalents.map(talent => (
          <div key={talent.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {talent.profile.lastName} {talent.profile.firstName}
                      </span>
                      {talent.profile.nationality && (
                        <span className="text-sm text-gray-500">({talent.profile.nationality})</span>
                      )}
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{talent.profile.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{talent.summary}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">基本情報</p>
                    <p className="text-sm text-gray-900">
                      {talent.profile.age}歳 / {talent.profile.gender === 'male' ? '男性' : '女性'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {talent.profile.location}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">スキル・経験</p>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {talent.profile.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                      {talent.profile.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{talent.profile.skills.length - 3}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <BriefcaseIcon className="h-3 w-3 mr-1" />
                      経験{talent.profile.experience}年
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 mb-1">就業可能時期</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      getUrgencyColor(talent.profile.availability)
                    }`}>
                      {talent.profile.availability === 'immediate' ? '即時可能' : '1ヶ月以内'}
                    </span>
                    {talent.profile.specificSkillField && (
                      <p className="text-sm text-gray-600 mt-1">
                        特定技能: {talent.profile.specificSkillField}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  onClick={() => handleRequestInterview(talent)}
                  className="btn-primary text-sm px-3 py-1"
                >
                  面接依頼
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredTalents.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">人材が見つかりません</h3>
            <p className="mt-1 text-sm text-gray-500">
              検索条件を変更してお試しください
            </p>
          </div>
        )}
      </div>

      {/* Interview Request Modal */}
      {showInterviewModal && selectedTalent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">面接依頼</h3>
              <button 
                onClick={() => setShowInterviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">{selectedTalent.profile.lastName} {selectedTalent.profile.firstName}</span>さんへの面接依頼
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedTalent.summary}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  希望日
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  希望時間
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ
                </label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={interviewMessage}
                  onChange={(e) => setInterviewMessage(e.target.value)}
                  placeholder="面接の目的や内容について簡単にご説明ください"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowInterviewModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSubmitInterviewRequest}
                >
                  依頼を送信
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingPage;