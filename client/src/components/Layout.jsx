import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { LogOut, AlertCircle, Menu, X } from "lucide-react";
import { toast } from "react-toastify";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  /* ---------- UI states ---------- */
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* ---------- Handlers ---------- */
  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const toggleMobileMenu = () => setMobileMenuOpen(v => !v);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // ---- replace with your real async logout if needed ----
      await new Promise(r => setTimeout(r, 800)); // mock delay
      logout();                     // <-- your auth context
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      {/* ==== Loader (centered logo) ==== */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-2xl">
            <div className="w-16 h-16 animate-spin">
              {/* you can replace with your own logo */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-yellow-600"
                fill="currentColor"
              >
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
                <path d="M50 10 A40 40 0 0 1 90 50" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">Logging out…</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* ==== Sticky Header ==== */}
        <header className="sticky top-0 z-40 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-xl">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            {/* Brand */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-white drop-shadow-md">
              RITHU ALERT EYE
            </h1>

            {/* ==== Desktop Nav ==== */}
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/" current={location.pathname}>List</NavLink>
              <NavLink to="/create" current={location.pathname}>Add New</NavLink>

              <button
                onClick={openLogoutModal}
                className="flex items-center cursor-pointer gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold 
                           px-5 py-2.5 rounded-xl shadow-lg transform transition-all duration-300 
                           hover:scale-105 hover:shadow-red-500/50 active:scale-95"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>

            {/* ==== Mobile Hamburger ==== */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-yellow-600/30 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </header>

        {/* ==== Mobile Drawer ==== */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="flex-1 bg-black/40" onClick={toggleMobileMenu} />
            <nav className="w-64 bg-gradient-to-b from-yellow-600 to-yellow-500 text-white p-6 flex flex-col gap-6 shadow-2xl">
              <NavLinkMobile to="/" onClick={toggleMobileMenu} current={location.pathname}>
                List
              </NavLinkMobile>
              <NavLinkMobile to="/create" onClick={toggleMobileMenu} current={location.pathname}>
                Add New
              </NavLinkMobile>

              <button
                onClick={() => {
                  toggleMobileMenu();
                  openLogoutModal();
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold 
                           px-5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </div>
        )}

        {/* ==== Main Content ==== */}
        <main className="max-w-6xl mx-auto p-4 sm:p-6">{children}</main>
      </div>

      {/* ==== Confirmation Modal ==== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={28} />
              <h3 className="text-xl font-bold">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeLogoutModal}
                className="px-5 py-2 bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={performLogout}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 cursor-pointer text-white font-medium rounded-lg transition-all transform hover:scale-105"
              >
                OK, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Re-usable NavLink (desktop) ---------- */
function NavLink({ to, current, children }) {
  const isActive = current === to;
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 text-lg font-medium transition-all duration-300 
        ${isActive ? "text-yellow-200 scale-110 font-bold" : "text-yellow-100 hover:text-yellow-200"}`}
    >
      {children}
      {isActive && <span className="absolute -bottom-1 left-0 w-full h-1 bg-yellow-300 rounded-full" />}
    </Link>
  );
}

/* ---------- Mobile NavLink (drawer) ---------- */
function NavLinkMobile({ to, current, onClick, children }) {
  const isActive = current === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 text-lg font-medium rounded-lg transition-colors
        ${isActive ? "bg-yellow-700 text-yellow-100" : "hover:bg-yellow-600/50"}`}
    >
      {children}
    </Link>
  );
}