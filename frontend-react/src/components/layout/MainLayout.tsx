
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center Content */}
        <main className="flex-1 w-full min-w-0 pb-12">
          <Outlet />
        </main>
        
        {/* Right Sidebar (Optional placeholder for future Ads/Trending) */}
        <aside className="hidden xl:block w-80 h-[calc(100vh-4rem)] sticky top-16 py-6 px-4">
          <div className="bg-surface rounded-app p-5 border border-white/5">
            <h3 className="font-heading font-semibold text-text-primary mb-4">Trending</h3>
            <div className="space-y-4">
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-white/5 rounded w-3/4"></div>
                <div className="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-white/5 rounded w-5/6"></div>
                <div className="h-3 bg-white/5 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MainLayout;
