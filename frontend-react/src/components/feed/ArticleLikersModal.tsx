import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { articleApi } from '../../api/articleApi';
import { userApi } from '../../api/userApi';
import { Modal } from '../ui/Modal';
import { UserListItem } from '../shared/UserListItem';
import { Spinner } from '../ui/Spinner';

interface ArticleLikersModalProps {
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleLikersModal: React.FC<ArticleLikersModalProps> = ({ articleId, isOpen, onClose }) => {
  const [likers, setLikers] = useState<any[]>([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLikers();
    }
  }, [isOpen, articleId]);

  const loadLikers = async () => {
    try {
      setLoadingLikers(true);
      const res: any = await articleApi.getArticleLikers(articleId, 0, 50);
      const interactions = res.content || res.data?.content || [];
      
      const profiles = await Promise.all(
        interactions.map(async (interaction: any) => {
          try {
            const userRes: any = await userApi.getUserById(interaction.actorId);
            return userRes.data || userRes;
          } catch (e) {
            return null;
          }
        })
      );
      
      setLikers(profiles.filter(p => p !== null));
    } catch (err) {
      console.error('Failed to load likers', err);
    } finally {
      setLoadingLikers(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lượt thích">
      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
        {loadingLikers ? (
          <div className="flex justify-center p-8">
            <Spinner size="md" className="text-primary" />
          </div>
        ) : likers.length > 0 ? (
          <div className="flex flex-col gap-1">
            {likers.map((user, idx) => (
              <UserListItem key={user.id || idx} user={user} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-text-muted">
            <Heart className="w-12 h-12 mb-3 opacity-20" />
            <p>Chưa có lượt thích nào</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
