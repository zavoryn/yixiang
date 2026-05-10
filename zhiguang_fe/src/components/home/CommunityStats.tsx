import s from './CommunityStats.module.css';

const stats = [
  { value: '10,000+', label: '篇知文' },
  { value: '5,000+', label: '位用户' },
  { value: '50,000+', label: '次点赞' },
];

export default function CommunityStats() {
  return (
    <div className={s.wrap}>
      {stats.map((stat, i) => (
        <div key={i} className={s.item}>
          <span className={s.value}>{stat.value}</span>
          <span className={s.label}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
