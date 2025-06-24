import React from 'react';
import { Avatar, AvatarFallback } from "../ui/avatar/Avatar";
import { useAuth } from "../../contexts/AuthContext";

export const UserProfile = () => {
  const { user } = useAuth();

  // Get initials from first and last name
  const getInitials = () => {
    if (!user) return '';
    const firstInitial = user.first_name.charAt(0);
    const lastInitial = user.last_name.charAt(0);
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="w-12 h-12 bg-blue-100 rounded-3xl">
        <AvatarFallback className="text-blue-500 font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 flex-1">
        <h6 className="font-semibold text-gray-900">
          {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
        </h6>
      </div>
    </div>
  );
}; 