
import { Hammer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-fade-in text-center">
      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(108,92,231,0.2)]">
        <Hammer className="w-10 h-10 text-primary animate-bounce" />
      </div>
      
      <h1 className="text-3xl font-heading font-bold text-text-primary mb-3">
        Tính năng đang được phát triển
      </h1>
      
      <p className="text-text-secondary max-w-md mb-8 leading-relaxed">
        Thành viên khác trong nhóm sẽ đảm nhận việc xây dựng tính năng này trong thời gian tới. Vui lòng quay lại sau!
      </p>

      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-text-primary rounded-app border border-white/10 font-medium transition-colors"
      >
        Quay lại Trang Chủ
      </button>
    </div>
  );
};

export default ComingSoon;
