import { useMutation, useQueryClient } from '@tanstack/react-query';
import { relationService } from '@/services/relationService';

export function useUnfollow(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => relationService.unfollow(userId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['relation', 'status', userId] });
      const prev = qc.getQueryData(['relation', 'status', userId]);
      qc.setQueryData(['relation', 'status', userId], { following: false, followedBy: false, mutual: false });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(['relation', 'status', userId], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['relation', 'status', userId] });
      qc.invalidateQueries({ queryKey: ['relation', 'followers'] });
      qc.invalidateQueries({ queryKey: ['relation', 'counters'] });
    },
  });
}
