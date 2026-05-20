import { useAuth } from '@/context/AuthContext';

export default function RecommendFollow() {
  const { user } = useAuth();
  if (!user) return null;

  // TODO: wire up when relationService.getSuggested is available
  return null;
}
