import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MyCirclesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [circles, setCircles] = useState<CircleSummary[]>([]);

  useEffect(() => {
    if (!user) return;
    circleService.joined().then(setCircles).catch(() => {});
  }, [user?.id]);

  if (!user || circles.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-[16px] text-gray-900">我的圈子</h3>
        <Link to="/circles" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</Link>
      </div>
      <div className="flex flex-col gap-5">
        {circles.slice(0, 5).map(c => (
          <div key={c.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/circles/${c.id}`)}>
              <Avatar className="w-10 h-10 shrink-0" style={{ borderRadius: '12px' }}>
                <AvatarImage src={c.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs bg-blue-50 text-blue-600 font-bold">{c.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-[14px] text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.memberCount}人加入</div>
              </div>
            </div>
            <button
              className="border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              onClick={() => navigate(`/circles/${c.id}`)}
            >
              进入圈子
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
