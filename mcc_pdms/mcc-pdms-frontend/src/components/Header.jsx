import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">MCC PDMS</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User size={20} className="text-gray-600" />
          <span className="text-sm text-gray-700">{user?.username}</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {user?.role}
          </span>
        </div>
        <button onClick={logout} className="text-gray-600 hover:text-gray-900">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
