import { Newspaper } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-surface text-primary rounded-app border border-gray-800">
          <Newspaper className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold">Mới Nhất (Feed)</h1>
      </div>

      <div className="space-y-6">
        {/* Placeholder Post Card */}
        <div className="bg-surface p-6 rounded-app border border-gray-800 shadow-sm hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-800" />
            <div>
              <p className="font-semibold text-text-primary">User Name</p>
              <p className="text-sm text-text-secondary">2 hours ago</p>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">My first post on Axion!</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Welcome to the new social media blog platform. This is a placeholder post.
            Soon, we will fetch real data from the Spring Boot Backend using Axios!
          </p>
          <div className="flex items-center gap-6 text-text-secondary font-medium">
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>❤️</span> 12
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <span>💬</span> 4
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
