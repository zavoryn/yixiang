import { useNavigate } from 'react-router-dom';

const TOPICS = [
  { title: '宁德时代Q3财报解读', views: '3.2w' },
  { title: 'A股保卫战', views: '2.8w' },
  { title: '半导体主线还能走多远?', views: '1.5w' },
  { title: '美股降息预期升温', views: '1.1w' },
];

export default function HotTopics() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-[16px] text-gray-900">热门话题</h3>
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600">查看全部 &gt;</a>
      </div>
      <div className="flex flex-col gap-4">
        {TOPICS.map((topic, index) => (
          <div
            key={topic.title}
            className="flex items-center justify-between group cursor-pointer"
            onClick={() => navigate(`/search?q=${encodeURIComponent(topic.title)}`)}
          >
            <div className="flex items-center gap-3">
              <span className={`text-[15px] font-bold w-4 text-center ${index < 3 ? 'text-red-500' : 'text-gray-400'}`}>
                {index + 1}
              </span>
              <span className="text-[14px] text-gray-800 group-hover:text-blue-600 transition-colors">
                {topic.title}
              </span>
            </div>
            <span className="text-xs text-gray-400">{topic.views}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
