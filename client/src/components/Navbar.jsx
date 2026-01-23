import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ isWsConnected, soundEnabled, onToggleSound }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🍜</span>
              <span className="text-xl font-bold">Ming Hin Cuisine</span>
            </Link>

            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md ${
                  isActive('/dashboard')
                    ? 'bg-white bg-opacity-20'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className={`px-3 py-2 rounded-md ${
                  isActive('/history')
                    ? 'bg-white bg-opacity-20'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                History
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-md"
                title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
              >
                <span className="text-xl">{soundEnabled ? '🔔' : '🔕'}</span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isWsConnected ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-sm">
                {isWsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
