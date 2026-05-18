import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-[1240px] mx-auto px-4 pt-4 pb-12 flex gap-5 items-start">
        <div className="sticky top-[68px] shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
