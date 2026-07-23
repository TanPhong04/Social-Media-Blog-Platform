import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface UserListItemProps {
  user: {
    id: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
  };
  onClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const UserListItem: React.FC<UserListItemProps> = ({ user, onClick, rightAction, className }) => {
  const navigate = useNavigate();
  const displayName = user.displayName || user.username || 'User';
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      e.stopPropagation();
      navigate(`/?userId=${user.id}`); // Legacy route behavior
    }
  };

  return (
    <div 
      className={cn("flex items-center justify-between p-2 hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer", className)}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <Avatar 
          src={user.avatarUrl} 
          fallback={displayName} 
          size="md" 
        />
        <div className="flex flex-col">
          <span className="font-bold text-[15px] text-text-primary hover:underline">
            {displayName}
          </span>
          <span className="text-text-secondary text-[13px]">
            @{user.username}
          </span>
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
};
