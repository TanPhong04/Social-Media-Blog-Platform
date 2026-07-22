import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';

interface FollowListModalProps {
  type: 'followers' | 'following';
  users: any[];
  isLoading: boolean;
  onClose: () => void;
  onToggleFollow: (user: any) => void;
  currentUser: any;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  type,
  users,
  isLoading,
  onClose,
  onToggleFollow,
  currentUser
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface w-full max-w-sm rounded-2xl border border-border-default shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-heading font-bold text-text-primary">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-surface-elevated transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Spinner size="md" className="text-primary" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              title={`Chưa có ${type === 'followers' ? 'người theo dõi' : 'đang theo dõi'}`}
              className="border-none bg-transparent my-4"
            />
          ) : (
            <div className="flex flex-col gap-1">
              {users.map((u) => {
                // Determine user fields based on API response structure differences
                const id = u.id || u.userId || u.targetId;
                const displayName = u.displayName || 'Unknown';
                const username = u.username || `user_${id.substring(0, 8)}`;
                const avatarUrl = u.avatarUrl;
                const isMe = currentUser?.id === id;

                return (
                  <div key={id} className="flex items-center justify-between p-3 hover:bg-surface-elevated rounded-xl transition-colors">
                    <div 
                      className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                      onClick={() => {
                        onClose();
                        navigate(`/profile?userId=${id}`);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onClose();
                          navigate(`/profile?userId=${id}`);
                        }
                      }}
                    >
                      <Avatar src={avatarUrl} fallback={displayName.substring(0, 2).toUpperCase()} size="md" />
                      <div className="min-w-0 pr-2">
                        <h4 className="font-bold text-text-primary truncate text-sm hover:underline">{displayName}</h4>
                        <p className="text-text-secondary text-xs truncate">@{username}</p>
                      </div>
                    </div>
                    
                    {!isMe && currentUser && (
                      <Button
                        variant={u.following ? 'secondary' : 'primary'}
                        size="sm"
                        className="rounded-full shrink-0 px-4"
                        onClick={() => onToggleFollow(u)}
                      >
                        {u.following ? 'Following' : 'Follow'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
