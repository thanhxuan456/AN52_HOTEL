import { useState, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Save,
  AlertCircle,
  Link2,
  Unlink,
  Chrome,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type ProfileSettingsProps = {
  tr: Record<string, string>;
};

export default function ProfileSettings({ tr }: ProfileSettingsProps) {
  const { user, updateProfile, updatePassword, uploadAvatar, socialConnections, linkSocial, unlinkSocial } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneVal, setPhoneVal] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);
  const [socialMsg, setSocialMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setProfileMsg(null);
    if (!fullName.trim()) {
      setProfileMsg({ type: 'error', text: tr.settingsNameRequired });
      return;
    }
    setSavingProfile(true);
    const { error } = await updateProfile({ fullName: fullName.trim(), phone: phoneVal.trim() });
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ type: 'error', text: error });
    } else {
      setProfileMsg({ type: 'success', text: tr.settingsProfileSaved });
    }
  };

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'error', text: tr.settingsPwdAllFields });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: tr.settingsPwdTooShort });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: tr.settingsPwdMismatch });
      return;
    }
    setSavingPwd(true);
    const { error } = await updatePassword(currentPwd, newPwd);
    setSavingPwd(false);
    if (error) {
      setPwdMsg({ type: 'error', text: error });
    } else {
      setPwdMsg({ type: 'success', text: tr.settingsPwdChanged });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: tr.settingsAvatarTooLarge });
      return;
    }
    setUploadingAvatar(true);
    setProfileMsg(null);
    const { error } = await uploadAvatar(file);
    setUploadingAvatar(false);
    if (error) {
      setProfileMsg({ type: 'error', text: error });
    } else {
      setProfileMsg({ type: 'success', text: tr.settingsAvatarUpdated });
    }
  };

  const handleLinkGoogle = async () => {
    setSocialMsg(null);
    setLinkingProvider('oauth_google');
    const { error } = await linkSocial('oauth_google');
    setLinkingProvider(null);
    if (error) {
      setSocialMsg({ type: 'error', text: error });
    }
  };

  const handleUnlink = async (accountId: string) => {
    setSocialMsg(null);
    setUnlinkingId(accountId);
    const { error } = await unlinkSocial(accountId);
    setUnlinkingId(null);
    if (error) {
      setSocialMsg({ type: 'error', text: error });
    } else {
      setSocialMsg({ type: 'success', text: tr.settingsSocialUnlinked });
    }
  };

  const googleConnected = socialConnections.some((c) => c.provider === 'google');

  return (
    <div className="space-y-6">
      {/* Avatar & Personal Info */}
      <div className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-6 shadow-md overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600" />
        <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-5">
          {tr.settingsProfile}
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'Avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-300 dark:border-primary-700 shadow-md"
              />
            ) : (
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold shadow-md ring-2 ring-primary-200 dark:ring-primary-800">
                {user.initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors disabled:opacity-60"
              aria-label={tr.settingsChangeAvatar}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold text-secondary-900 dark:text-white truncate">
              {user.fullName || tr.userPanel}
            </div>
            <div className="text-sm text-secondary-500 dark:text-secondary-400 truncate">{user.email}</div>
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              {tr.settingsAvatarHint}
            </p>
          </div>
        </div>

        {/* Name + Phone */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
              {tr.settingsFullName}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tr.settingsFullNamePlaceholder}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
              {tr.settingsPhone}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
              <input
                type="tel"
                value={phoneVal}
                onChange={(e) => setPhoneVal(e.target.value)}
                placeholder={tr.settingsPhonePlaceholder}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
            {tr.settingsEmail}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-400 dark:text-secondary-500 dark:bg-secondary-700/50 bg-secondary-50 cursor-not-allowed"
            />
          </div>
        </div>

        {profileMsg && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 animate-fade-in ${
              profileMsg.type === 'success'
                ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300'
                : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-300'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {profileMsg.text}
          </div>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60 shadow-md"
        >
          {savingProfile ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {tr.settingsSaving}</>
          ) : (
            <><Save className="w-4 h-4" /> {tr.settingsSave}</>
          )}
        </button>
      </div>

      {/* Password + Social Connections — side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Change Password (compact) */}
        <div className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-6 shadow-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600" />
          <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-1.5">
            {tr.settingsChangePassword}
          </h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
            {tr.settingsPasswordHint}
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
                {tr.settingsCurrentPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
                {tr.settingsNewPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">
                {tr.settingsConfirmPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {pwdMsg && (
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm animate-fade-in ${
                  pwdMsg.type === 'success'
                    ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300'
                    : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-300'
                }`}
              >
                {pwdMsg.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {pwdMsg.text}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={savingPwd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-800 dark:bg-secondary-600 text-white font-semibold text-sm hover:bg-secondary-900 dark:hover:bg-secondary-500 transition-colors disabled:opacity-60 shadow-md"
            >
              {savingPwd ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {tr.settingsSaving}</>
              ) : (
                <><Lock className="w-4 h-4" /> {tr.settingsUpdatePassword}</>
              )}
            </button>
          </div>
        </div>

        {/* Social Connections */}
        <div className="relative bg-white dark:bg-secondary-800 rounded-2xl border border-secondary-200/70 dark:border-secondary-700/80 p-6 shadow-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 via-accent-400 to-accent-500" />
          <h2 className="font-display text-lg font-bold text-secondary-900 dark:text-white mb-1.5">
            {tr.settingsSocial}
          </h2>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
            {tr.settingsSocialHint}
          </p>

          {/* Connected accounts list */}
          <div className="space-y-3 mb-4">
            {socialConnections.length === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-700/40 border border-dashed border-secondary-200 dark:border-secondary-700/60">
                <Link2 className="w-5 h-5 text-secondary-400 dark:text-secondary-500 shrink-0" />
                <span className="text-sm text-secondary-400 dark:text-secondary-500">
                  {tr.settingsSocialNoConnections}
                </span>
              </div>
            )}

            {socialConnections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/70 dark:bg-secondary-700/40 border border-primary-100/60 dark:border-secondary-700/60"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-secondary-600 shadow-sm shrink-0">
                  {conn.imageUrl ? (
                    <img src={conn.imageUrl} alt={conn.providerTitle} className="w-6 h-6 rounded-lg" />
                  ) : (
                    <Chrome className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {conn.providerTitle}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                    <span className="text-xs text-success-600 dark:text-success-400 font-medium">
                      {tr.settingsSocialConnected}
                    </span>
                    <span className="text-xs text-secondary-400 dark:text-secondary-500 truncate">
                      · {conn.identifier}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnlink(conn.id)}
                  disabled={unlinkingId === conn.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 hover:bg-error-100 dark:hover:bg-error-900/30 transition-colors disabled:opacity-60 shrink-0"
                >
                  {unlinkingId === conn.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlink className="w-3.5 h-3.5" />
                  )}
                  {tr.settingsSocialDisconnect}
                </button>
              </div>
            ))}
          </div>

          {/* Available providers to connect */}
          <div className="space-y-2.5">
            {!googleConnected && (
              <button
                onClick={handleLinkGoogle}
                disabled={linkingProvider !== null}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-secondary-200 dark:border-secondary-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50/50 dark:hover:bg-secondary-700/40 transition-all disabled:opacity-60 group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-secondary-600 shadow-sm shrink-0">
                  <Chrome className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-semibold text-secondary-900 dark:text-white">
                    {tr.settingsSocialGoogle}
                  </div>
                  <div className="text-xs text-secondary-400 dark:text-secondary-500">
                    {tr.settingsSocialNotConnected}
                  </div>
                </div>
                {linkingProvider === 'oauth_google' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-500 shrink-0" />
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 shrink-0">
                    <Link2 className="w-3.5 h-3.5" />
                    {tr.settingsSocialConnect}
                  </span>
                )}
              </button>
            )}
          </div>

          {socialMsg && (
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm mt-4 animate-fade-in ${
                socialMsg.type === 'success'
                  ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-300'
                  : 'bg-error-50 text-error-700 dark:bg-error-900/20 dark:text-error-300'
              }`}
            >
              {socialMsg.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {socialMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
