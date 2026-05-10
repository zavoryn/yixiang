import s from './TrendingTags.module.css';
import { useNavigate } from 'react-router-dom';

const tags = [
  'Java', '八股文', 'JVM', 'Spring', 'MySQL', 'Redis',
  'AI', 'LLM', 'Transformer', 'RAG', 'Prompt Engineering',
  'Agent', 'MCP', 'LangChain', 'Multi-Agent',
];

export default function TrendingTags() {
  const navigate = useNavigate();

  return (
    <div className={s.wrap}>
      <span className={s.title}>热门标签</span>
      <div className={s.list}>
        {tags.map(tag => (
          <button
            key={tag}
            className={s.tag}
            onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
