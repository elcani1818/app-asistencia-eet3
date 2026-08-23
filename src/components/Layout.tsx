import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X, BookOpen, LayoutDashboard, Settings } from 'lucide-react';

const Layout = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl">EET N°3 - Asistencia</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {profile?.role === 'profesor' || profile?.role === 'admin' ? (
                  <Link
                    to="/asistencia"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Cargar Asistencia
                  </Link>
                ) : null}
                
                {profile?.role === 'admin' || profile?.role === 'preceptor' ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                ) : null}

                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Administración
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {profile?.full_name} ({profile?.role})
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-blue-700 p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white transition-colors flex items-center"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-2">Salir</span>
                </button>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-blue-700">
            <div className="pt-2 pb-3 space-y-1">
              {profile?.role === 'profesor' || profile?.role === 'admin' ? (
                <Link
                  to="/asistencia"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Cargar Asistencia
                </Link>
              ) : null}
              
              {profile?.role === 'admin' || profile?.role === 'preceptor' ? (
                <Link
                  to="/dashboard"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 flex items-center"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              ) : null}

              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Administración
                </Link>
              )}
            </div>
            <div className="pt-4 pb-3 border-t border-blue-600">
              <div className="flex items-center px-4">
                <div>
                  <div className="text-base font-medium text-white">{profile?.full_name}</div>
                  <div className="text-sm font-medium text-blue-200 capitalize">{profile?.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleSignOut();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600 flex items-center"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
