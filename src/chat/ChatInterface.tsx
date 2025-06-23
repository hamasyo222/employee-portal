import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PaperAirplaneIcon, 
  XMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'admin' | 'foreign_talent' | 'company' | 'dx_talent';
  senderName: string;
  recipientId: string;
  recipientType: 'admin' | 'foreign_talent' | 'company' | 'dx_talent';
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatInterfaceProps {
  recipientId?: string;
  recipientType?: 'admin' | 'foreign_talent' | 'company' | 'dx_talent';
  recipientName?: string;
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  recipientId,
  recipientType = 'admin',
  recipientName = 'システム管理者',
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (user?.id && recipientId) {
      loadChatHistory(user.id, recipientId);
    }
  }, [user?.id, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async (userId: string, recipientId: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API to fetch chat history
      // For now, we'll use mock data
      const mockChatHistory: ChatMessage[] = [
        {
          id: '1',
          senderId: recipientId,
          senderType: recipientType,
          senderName: recipientName,
          recipientId: userId,
          recipientType: user?.userType || 'foreign_talent',
          content: 'こんにちは、何かお手伝いできることはありますか？',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          isRead: true
        },
        {
          id: '2',
          senderId: userId,
          senderType: user?.userType || 'foreign_talent',
          senderName: `${user?.lastName || ''} ${user?.firstName || ''}`,
          recipientId: recipientId,
          recipientType: recipientType,
          content: 'はい、質問があります。',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
          isRead: true
        },
        {
          id: '3',
          senderId: recipientId,
          senderType: recipientType,
          senderName: recipientName,
          recipientId: userId,
          recipientType: user?.userType || 'foreign_talent',
          content: 'どのようなご質問でしょうか？お気軽にお聞きください。',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
          isRead: true
        }
      ];
      
      setMessages(mockChatHistory);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('チャット履歴の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderType: user.userType,
      senderName: `${user.lastName} ${user.firstName}`,
      recipientId: recipientId || 'admin',
      recipientType: recipientType,
      content: inputMessage,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      // In a real implementation, this would call an API to send the message
      // For now, we'll just simulate a response after a delay
      setTimeout(() => {
        const responseMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          senderId: recipientId || 'admin',
          senderType: recipientType,
          senderName: recipientName,
          recipientId: user.id,
          recipientType: user.userType,
          content: `ありがとうございます。メッセージを確認しました：「${inputMessage}」`,
          timestamp: new Date(),
          isRead: false
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('メッセージの送信に失敗しました');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {getSenderIcon(recipientType)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">{recipientName}</h3>
            <p className="text-sm text-gray-500">
              {recipientType === 'admin' ? 'システム管理者' : 
               recipientType === 'foreign_talent' ? '海外人材' : 
               recipientType === 'company' ? '企業' : 'DX人材'}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>メッセージはありません</p>
            <p className="text-sm">新しいメッセージを送信してみましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${message.senderId === user?.id ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-end">
                    {message.senderId !== user?.id && (
                      <div className="flex-shrink-0 mr-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {getSenderIcon(message.senderType)}
                        </div>
                      </div>
                    )}
                    <div 
                      className={`px-4 py-2 rounded-lg ${
                        message.senderId === user?.id 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                  <div 
                    className={`text-xs mt-1 ${
                      message.senderId === user?.id ? 'text-right mr-2' : 'text-left ml-10'
                    } text-gray-500`}
                  >
                    {formatTime(new Date(message.timestamp))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="sm"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};