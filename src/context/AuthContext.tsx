import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  useUser,
  useClerk,
  useSignIn,
  useSignUp,
} from '@clerk/clerk-react';
import type { UserResource } from '@clerk/types';
import { supabase } from '@/lib/supabase';

type AuthUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  initials: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  phone: string | null;
};

type SocialConnection = {
  id: string;
  provider: string;
  providerTitle: string;
  identifier: string;
  imageUrl: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  isConfigured: boolean;
  socialConnections: SocialConnection[];
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string }) => Promise<{ error: string | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  uploadAvatar: (file: File) => Promise<{ error: string | null; url: string | null }>;
  linkSocial: (provider: 'oauth_google') => Promise<{ error: string | null }>;
  unlinkSocial: (accountId: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const isConfigured = Boolean(clerkKey);

function mapUser(user: UserResource | null | undefined, isAdmin: boolean, avatarUrl: string | null, phone: string | null): AuthUser | null {
  if (!user) return null;
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? null;
  const fullName = user.fullName ?? user.firstName ?? null;
  const initials = (fullName || primaryEmail || '?').charAt(0).toUpperCase();
  return { id: user.id, email: primaryEmail, fullName, initials, isAdmin, avatarUrl, phone };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut, setActive: clerkSetActive } = useClerk();
  const { isLoaded: signInLoaded, signIn: clerkSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp: clerkSignUp } = useSignUp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function syncProfile() {
      if (!isSignedIn || !user) {
        setIsAdmin(false);
        setAvatarUrl(null);
        setPhone(null);
        return;
      }
      const primaryEmail = user.primaryEmailAddress?.emailAddress ?? '';
      const fullName = user.fullName ?? user.firstName ?? null;
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('is_admin, avatar_url, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (existing) {
          if (!cancelled) {
            setIsAdmin(Boolean(existing.is_admin));
            setAvatarUrl(existing.avatar_url ?? null);
            setPhone(existing.phone ?? null);
          }
        } else {
          await supabase.from('profiles').insert({
            id: user.id,
            email: primaryEmail,
            full_name: fullName,
            is_admin: false,
          });
          if (!cancelled) {
            setIsAdmin(false);
            setAvatarUrl(null);
            setPhone(null);
          }
        }

        if (!cancelled) {
          const conns: SocialConnection[] = (user.externalAccounts ?? []).map((acc) => ({
            id: acc.id,
            provider: acc.provider,
            providerTitle: acc.providerTitle(),
            identifier: acc.accountIdentifier(),
            imageUrl: acc.imageUrl,
          }));
          setSocialConnections(conns);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setAvatarUrl(null);
          setPhone(null);
          setSocialConnections([]);
        }
      }
    }
    syncProfile();
    return () => { cancelled = true; };
  }, [isSignedIn, user]);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    if (!isConfigured) return { error: 'Clerk not configured' };
    if (!signInLoaded) return { error: 'Auth not ready' };
    try {
      const result = await clerkSignIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await clerkSetActive({ session: result.createdSessionId });
        return { error: null };
      }
      return { error: 'Sign in requires additional verification' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, name) => {
    if (!isConfigured) return { error: 'Clerk not configured' };
    if (!signUpLoaded) return { error: 'Auth not ready' };
    try {
      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
        firstName: name,
      });
      if (result.status === 'complete') {
        await clerkSetActive({ session: result.createdSessionId });
        return { error: null };
      }
      return { error: 'Sign up requires additional verification' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () => {
    if (!isConfigured) return { error: 'Clerk not configured' };
    if (!signInLoaded) return { error: 'Auth not ready' };
    try {
      await clerkSignIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin + '/',
        redirectUrlComplete: window.location.origin + '/',
      });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const signOut = async () => {
    if (!isConfigured) return;
    await clerkSignOut();
  };

  const updateProfile: AuthContextValue['updateProfile'] = async (data) => {
    if (!user) return { error: 'Not signed in' };
    try {
      const updateData: Record<string, string> = {};
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) return { error: error.message };

      if (data.fullName !== undefined) {
        await user.update({ firstName: data.fullName });
      }
      if (data.phone !== undefined) setPhone(data.phone);

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Update failed' };
    }
  };

  const updatePassword: AuthContextValue['updatePassword'] = async (currentPassword, newPassword) => {
    if (!isConfigured) return { error: 'Clerk not configured' };
    if (!user) return { error: 'Not signed in' };
    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Password change failed';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const uploadAvatar: AuthContextValue['uploadAvatar'] = async (file) => {
    if (!user) return { error: 'Not signed in', url: null };
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) return { error: uploadError.message, url: null };

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) return { error: updateError.message, url: null };

      setAvatarUrl(publicUrl);
      return { error: null, url: publicUrl };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Upload failed', url: null };
    }
  };

  const linkSocial: AuthContextValue['linkSocial'] = async (provider) => {
    if (!isConfigured) return { error: 'Clerk not configured' };
    if (!user) return { error: 'Not signed in' };
    try {
      await user.createExternalAccount({
        strategy: provider,
        redirectUrl: window.location.origin + '/',
        actionCompleteRedirectUrl: window.location.origin + '/',
      });
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to link account';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const unlinkSocial: AuthContextValue['unlinkSocial'] = async (accountId) => {
    if (!user) return { error: 'Not signed in' };
    try {
      const account = user.externalAccounts.find((a) => a.id === accountId);
      if (!account) return { error: 'Account not found' };
      await account.destroy();
      setSocialConnections((prev) => prev.filter((c) => c.id !== accountId));
      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unlink account';
      const clerkErr = err as { errors?: Array<{ message?: string }> };
      return { error: clerkErr.errors?.[0]?.message || msg };
    }
  };

  const value: AuthContextValue = {
    user: isSignedIn ? mapUser(user, isAdmin, avatarUrl, phone) : null,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    isConfigured,
    socialConnections,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    updatePassword,
    uploadAvatar,
    linkSocial,
    unlinkSocial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
