import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../api/articleApi';
import { PenTool, FileText, Send, AlertCircle, ArrowLeft } from 'lucide-react';

const CreateArticle: React.FC = () => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const parseTags = (input: string): string[] => {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const handleAction = async (publish: boolean) => {
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền tiêu đề và nội dung bài viết.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const tags = parseTags(tagsInput);
    if (tags.length > 10) {
      setError('Tối đa chỉ được nhập 10 thẻ.');
      setLoading(false);
      return;
    }

    try {
      // 1. Tạo bài viết ở dạng nháp (DRAFT)
      const res: any = await articleApi.createArticle({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        tags
      });

      const articleId = res.id;

      // 2. Nếu người dùng chọn "Đăng bài" (Publish)
      if (publish) {
        await articleApi.publishArticle(articleId);
        setSuccess('Đăng bài viết thành công!');
      } else {
        setSuccess('Lưu bản nháp thành công!');
      }

      // Đợi 1.5 giây hiển thị thông báo thành công rồi quay về trang chủ
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi khi tạo/xuất bản bài viết', err);
      setError(
        err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý bài viết.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-surface text-primary rounded-app border border-white/10 shadow-lg">
          <PenTool className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            Viết bài mới
          </h1>
          <p className="text-text-secondary mt-1">
            Chia sẻ những câu chuyện và kiến thức bổ ích của bạn
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-app flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-app flex items-start gap-3">
          <FileText className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-surface rounded-app p-6 sm:p-8 border border-white/5 shadow-xl space-y-6">
        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tiêu đề bài viết <span className="text-error">*</span>
          </label>
          <input
            type="text"
            maxLength={200}
            required
            disabled={loading}
            className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-lg font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề ấn tượng..."
          />
        </div>

        {/* Tóm tắt */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tóm tắt / Mô tả ngắn
          </label>
          <textarea
            maxLength={500}
            disabled={loading}
            rows={2}
            className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Mô tả tóm tắt nội dung bài viết (tối đa 500 ký tự)..."
          />
        </div>

        {/* Thẻ tags */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Thẻ chủ đề (Tags)
          </label>
          <input
            type="text"
            disabled={loading}
            className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Nhập các tags cách nhau bằng dấu phẩy. Ví dụ: technology, coding, react"
          />
          <p className="text-xs text-text-secondary mt-1">
            Tối đa 10 thẻ, mỗi thẻ không quá 50 ký tự.
          </p>
        </div>

        {/* Nội dung bài viết */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Nội dung bài viết <span className="text-error">*</span>
          </label>
          <textarea
            maxLength={50000}
            required
            disabled={loading}
            rows={12}
            className="w-full bg-background border border-gray-700 text-text-primary rounded-md px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Soạn thảo nội dung chi tiết bài viết (chấp nhận định dạng Markdown)..."
          />
        </div>

        {/* Các nút hành động */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-white/5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction(false)}
            className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-text-primary font-medium rounded-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Lưu bản nháp
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleAction(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Đang gửi...' : 'Đăng bài viết'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateArticle;
