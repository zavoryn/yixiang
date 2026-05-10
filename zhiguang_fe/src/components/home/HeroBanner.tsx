import s from './HeroBanner.module.css';
import { Link } from 'react-router-dom';

export default function HeroBanner() {
  return (
    <div className={s.wrap}>
      <div className={s.left}>
        <h1 className={s.headline}>颐享</h1>
        <p className={s.slogan}>让知识连接你我</p>
        <p className={s.desc}>
          专注于 Java、AI、Agent 技术的知识社区
        </p>
      </div>
      <div className={s.right}>
        <Link to="/create" className={s.writeBtn}>写知文</Link>
        <Link to="/search" className={s.exploreBtn}>探索</Link>
      </div>
    </div>
  );
}
