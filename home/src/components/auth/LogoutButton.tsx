import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

interface LogoutButtonProps {
  onLogoutStart?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onLogoutStart,
  className = '',
  variant = 'ghost'
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    onLogoutStart?.();
    logout();
    navigate('/signin');
  };

  return (
    <Button
      variant={variant}
      className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg w-full hover:bg-gray-50 transition-colors ${className}`}
      onClick={handleLogout}
    >
      <LogOutIcon size={16} className="text-gray-700" />
      <span className="flex-1 text-left text-sm text-gray-700">
        Log out
      </span>
    </Button>
  );
}; 