import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-surface p-8 rounded-app border border-gray-800 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">My Profile</h1>
        <p className="text-text-secondary text-lg">Display Name: {user?.displayName}</p>
        <p className="text-text-secondary text-lg">Email: {user?.email}</p>
        <p className="text-text-secondary text-lg mt-4">
          This page is under construction. More features coming soon!
        </p>
      </div>
    </div>
  );
}
