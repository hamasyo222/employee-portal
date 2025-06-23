import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  UserIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { ChatInterface } from './ChatInterface';

interface ChatContact {
  id: string;
  name: string;
  type: 'admin' | 'foreign_talent' | 'company' | 'dx_talent';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export const ChatList: React.FC = () => {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ChatContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API to fetch contacts
      // For now, we'll use mock data
      const mockContacts: ChatContact[] = [
        {
          id: 'admin-1',
          name: 'システム管理者',
          type: 'admin',
          lastMessage: 'どのようなご質問でしょうか？お気軽にお聞きください。',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
          unreadCount: 0
        }
      ];
      
      // Add contacts based on user type
      if (user?.userType === 'admin') {
        mockContacts.push(
          {
            id: 'foreign-1',
            name: 'グエン・ヴァン・アン',
            type: 'foreign_talent',
            lastMessage: '在留資格の更新について質問があります。',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            unreadCount: 2
          },
          {
            id: 'company-1',
            name: '株式会社テックソリューションズ',
            type: 'company',
            lastMessage: '新しい求人を掲載したいのですが、手続きを教えてください。',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            unreadCount: 1
          },
          {
            id: 'dx-1',
            name: '佐藤花子',
            type: 'dx_talent',
            lastMessage: 'プロジェクトの応募について相談があります。',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
            unreadCount: 0
          }
        );
      } else if (user?.userType === 'company') {
        mockContacts.push(
          {
            id: 'admin-2',
            name: '採用担当',
            type: 'admin',
            lastMessage: '求人情報を確認しました。追加情報をお願いします。',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
            unreadCount: 1
          }
        );
      } else if (user?.userType === 'foreign_talent' || user?.userType === 'dx_talent') {
        // Already has admin contact
      }
      
      setContacts(mockContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }
    
    const filtered = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredContacts(filtered);
  };

  const handleContactSelect = (contact: ChatContact) => {
    setSelectedContact(contact);
    
    // Mark messages as read
    setContacts(prev => 
      prev.map(c => 
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleStartNewChat = (contactType: 'admin' | 'foreign_talent' | 'company' | 'dx_talent') => {
    // In a real implementation, this would create a new chat or find an existing one
    // For now, we'll just select the admin contact or create a new one
    const adminContact = contacts.find(c => c.type === contactType);
    
    if (adminContact) {
      setSelectedContact(adminContact);
    } else {
      const newContact: ChatContact = {
        id: `${contactType}-${Date.now()}`,
        name: contactType === 'admin' ? 'システム管理者' : 
              contactType === 'foreign_talent' ? '海外人材' : 
              contactType === 'company' ? '企業' : 'DX人材',
        type: contactType,
        unreadCount: 0
      };
      
      setContacts(prev => [...prev, newContact]);
      setSelectedContact(newContact);
    }
    
    setShowNewChatModal(false);
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'admin':
        return <Cog6ToothIcon className="h-6 w-6 text-gray-600" />;
      case 'foreign_talent':
        return <UserIcon className="h-6 w-6 text-blue-600" />;
      case 'company':
        return <BuildingOfficeIcon className="h-6 w-6 text-green-600" />;
      case 'dx_talent':
        return <ComputerDesktopIcon className="h-6 w-6 text-purple-600" />;
      default:
        return <UserIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days}日前`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) {
      return `${hours}時間前`;
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) {
      return `${minutes}分前`;
    }
    
    return '今';
  };

  return (
    <div className="flex h-full">
      {/* Contact List */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 ${selectedContact ? 'hidden md:block' : ''}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">メッセージ</h2>
            <Button
              size="sm"
              onClick={handleNewChat}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              新規
            </Button>
          </div>
          
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="検索..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>連絡先が見つかりません</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredContacts.map(contact => (
                <li 
                  key={contact.id}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="flex items-center px-4 py-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {getContactIcon(contact.type)}
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500">{formatTime(contact.lastMessageTime)}</p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{contact.lastMessage || '新しい会話'}</p>
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className={`w-full md:w-2/3 ${!selectedContact ? 'hidden md:block' : ''}`}>
        {selectedContact ? (
          <ChatInterface
            recipientId={selectedContact.id}
            recipientType={selectedContact.type}
            recipientName={selectedContact.name}
            onClose={() => setSelectedContact(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>会話を選択してください</p>
          </div>
        )}
      </div>
      
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新規メッセージ</h3>
            <p className="text-gray-600 mb-4">メッセージを送信する相手を選択してください</p>
            
            <div className="space-y-2">
              {user?.userType === 'admin' ? (
                <>
                  <button
                    onClick={() => handleStartNewChat('foreign_talent')}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <span>海外人材</span>
                  </button>
                  <button
                    onClick={() => handleStartNewChat('company')}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <BuildingOfficeIcon className="h-6 w-6 text-green-600 mr-3" />
                    <span>企業</span>
                  </button>
                  <button
                    onClick={() => handleStartNewChat('dx_talent')}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ComputerDesktopIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <span>DX人材</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleStartNewChat('admin')}
                  className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Cog6ToothIcon className="h-6 w-6 text-gray-600 mr-3" />
                  <span>システム管理者</span>
                </button>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowNewChatModal(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};