import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const profileSchema = z.object({
  firstName: z.string().min(1, '名は必須です'),
  lastName: z.string().min(1, '姓は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  location: z.string().optional(),
  availability: z.string().optional(),
  experience: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profileImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      age: user?.age || '',
      gender: user?.gender || '',
      location: user?.location || '',
      availability: user?.availability || '',
      experience: user?.experience || '',
    }
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        age: user.age || '',
        gender: user.gender || '',
        location: user.location || '',
        availability: user.availability || '',
        experience: user.experience || '',
      });
      setSkills(user.skills || []);
      setProfileImage(user.profileImageUrl);
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user data
      updateUser({
        ...data,
        profileImageUrl: profileImage
      });
      
      setIsEditing(false);
      toast.success(t('common.success'));
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleCancel = () => {
    // Reset form to current values
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      age: user?.age || '',
      gender: user?.gender || '',
      location: user?.location || '',
      availability: user?.availability || '',
      experience: user?.experience || '',
    });
    setProfileImage(user?.profileImageUrl);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    // Ensure form has latest values before editing
    setValue('firstName', user?.firstName || '');
    setValue('lastName', user?.lastName || '');
    setValue('email', user?.email || '');
    setValue('phone', user?.phone || '');
    setValue('bio', user?.bio || '');
    setValue('age', user?.age || '');
    setValue('gender', user?.gender || '');
    setValue('location', user?.location || '');
    setValue('availability', user?.availability || '');
    setValue('experience', user?.experience || '');
    setIsEditing(true);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('common.error'));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('common.error'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newProfileImage = event.target.result as string;
        setProfileImage(newProfileImage);
        
        // Auto-save profile image when changed
        updateUser({
          ...user,
          profileImageUrl: newProfileImage
        });
        
        toast.success(t('common.success'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    // Check if skill already exists
    if (skills.includes(newSkill.trim())) {
      toast.error(t('common.error'));
      return;
    }
    
    // Add new skill
    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    
    // Update user data with new skills
    updateUser({
      ...user,
      skills: updatedSkills
    });
    
    // Clear input
    setNewSkill('');
    
    toast.success(t('common.success'));
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    
    // Update user data with updated skills
    updateUser({
      ...user,
      skills: updatedSkills
    });
    
    toast.success(t('common.success'));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  if (!user) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-gray-600">{t('profile.basicInfo')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="card text-center">
          <div className="mb-4 relative inline-block">
            <div 
              className="w-24 h-24 rounded-full mx-auto overflow-hidden cursor-pointer group relative"
              onClick={handleImageClick}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-24 h-24 text-gray-400 mx-auto" />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpTrayIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t(`userType.${user.userType}`)}
          </p>
          <button 
            className="btn-outline text-sm"
            onClick={handleImageClick}
          >
            {t('profile.changeProfileImage')}
          </button>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('profile.basicInfo')}
              </h3>
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="btn-outline text-sm flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  {t('common.edit')}
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit(onSubmit)}
                    className="btn-primary text-sm flex items-center"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-outline text-sm flex items-center"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('auth.lastName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input-field"
                      {...register('lastName')}
                    />
                  ) : (
                    <p className="text-gray-900">{user.lastName}</p>
                  )}
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">{t('auth.firstName')}</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input-field"
                      {...register('firstName')}
                    />
                  ) : (
                    <p className="text-gray-900">{user.firstName}</p>
                  )}
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">{t('auth.email')}</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="input-field"
                    {...register('email')}
                  />
                ) : (
                  <p className="text-gray-900">{user.email}</p>
                )}
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">{t('profile.phone')}</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="input-field"
                    {...register('phone')}
                    placeholder="e.g. 090-1234-5678"
                  />
                ) : (
                  <p className="text-gray-900">{user.phone}</p>
                )}
              </div>

              {user.userType === 'dx_talent' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">{t('profile.age')}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input-field"
                          {...register('age')}
                          min="18"
                          max="100"
                        />
                      ) : (
                        <p className="text-gray-900">{user.age}歳</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">{t('profile.gender')}</label>
                      {isEditing ? (
                        <select
                          className="input-field"
                          {...register('gender')}
                        >
                          <option value="">選択してください</option>
                          <option value="male">{t('auth.gender.male')}</option>
                          <option value="female">{t('auth.gender.female')}</option>
                          <option value="other">{t('auth.gender.other')}</option>
                          <option value="prefer_not_to_say">{t('auth.gender.prefer_not_to_say')}</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {user.gender === 'male' ? t('auth.gender.male') : 
                           user.gender === 'female' ? t('auth.gender.female') : 
                           user.gender === 'other' ? t('auth.gender.other') : 
                           user.gender === 'prefer_not_to_say' ? t('auth.gender.prefer_not_to_say') : ''}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">{t('profile.experience')}</label>
                      {isEditing ? (
                        <input
                          type="number"
                          className="input-field"
                          {...register('experience')}
                          min="0"
                          max="50"
                        />
                      ) : (
                        <p className="text-gray-900">{user.experience}年</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">{t('profile.location')}</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input-field"
                          {...register('location')}
                          placeholder="例: 静岡県浜松市"
                        />
                      ) : (
                        <p className="text-gray-900">{user.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="form-label">{t('profile.availability')}</label>
                      {isEditing ? (
                        <select
                          className="input-field"
                          {...register('availability')}
                        >
                          <option value="immediate">{t('auth.availability.immediate')}</option>
                          <option value="within_month">{t('auth.availability.within_month')}</option>
                          <option value="flexible">{t('auth.availability.flexible')}</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {user.availability === 'immediate' ? t('auth.availability.immediate') : 
                           user.availability === 'within_month' ? t('auth.availability.within_month') : 
                           user.availability === 'flexible' ? t('auth.availability.flexible') : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="form-label">{t('profile.bio')}</label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    className="input-field"
                    {...register('bio')}
                    placeholder={t('profile.bio')}
                  />
                ) : (
                  <p className="text-gray-900">
                    {user.bio}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Account Settings */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountSettings')}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t('profile.emailNotifications')}</p>
                  <p className="text-sm text-gray-500">{t('profile.emailNotifications')}</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t('profile.profileVisibility')}</p>
                  <p className="text-sm text-gray-500">{t('profile.profileVisibility')}</p>
                </div>
                <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600">
                  <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                  {t('profile.deleteAccount')}
                </button>
              </div>
            </div>
          </div>

          {/* User Type Specific Sections */}
          {(user.userType === 'dx_talent' || user.userType === 'foreign_talent') && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('profile.skills')}
                </h3>
              </div>
              
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    placeholder={t('profile.addNewSkill')}
                    className="input-field flex-1 mr-2"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    className="btn-primary flex items-center"
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {t('profile.addSkill')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('profile.skillsHint')}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                  <div key={index} className="group px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center">
                    {skill}
                    <button
                      className="ml-1 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-gray-500">{t('profile.noSkills')}</p>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t('common.hint')}:</strong> {t('profile.skillsHelpText')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;