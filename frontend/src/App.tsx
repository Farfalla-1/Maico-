import { Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import IngredientsPage from "./pages/IngredientsPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecipeFormPage from "./pages/RecipeFormPage";
import CalculatorPage from "./pages/CalculatorPage";
import UsersPage from "./pages/UsersPage";
import "./App.css";
import { ReactNode, useState, useEffect, useRef } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppLayout() {
  const { isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const [waOpen, setWaOpen] = useState(false);
  const waRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (waRef.current && !waRef.current.contains(e.target as Node)) {
        setWaOpen(false);
      }
    }
    if (waOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [waOpen]);

  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <img src="/logo crema.png" alt="Maico" className="nav-logo" />
          <span className="brand-name">Maico</span>
        </Link>

        {isAuthenticated ? (
          <>
            <button
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
            <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
              <Link to="/ingredients">Ingredientes</Link>
              <Link to="/recipes">Recetas</Link>
              <Link to="/calculator">Calculadora</Link>
              {isAdmin && <Link to="/users">Usuarios</Link>}
              <button onClick={handleLogout} className="nav-logout">
                Salir
              </button>
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-login-btn">Iniciar sesión</Link>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/ingredients" element={<ProtectedRoute><IngredientsPage /></ProtectedRoute>} />
          <Route path="/recipes/new" element={<ProtectedRoute><RecipeFormPage /></ProtectedRoute>} />
          <Route path="/recipes/:id/edit" element={<ProtectedRoute><RecipeFormPage /></ProtectedRoute>} />
          <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/logo crema.png" alt="Maico" className="footer-logo" />
            <span className="footer-brand-name">Maico</span>
          </div>

          <div className="footer-col">
            <h4>Horarios</h4>
            <ul className="footer-hours">
              <li><span>Lunes a Viernes</span><span>6:00 - 20:00</span></li>
              <li><span>Sábados</span><span>7:00 - 14:00</span></li>
              <li><span>Domingos</span><span>Cerrado</span></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Ubicación</h4>
            <div className="footer-map-embed">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1642.5!2d-58.5576348!3d-34.5429955!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcba00a96aa36b%3A0x57ba348c2b33d456!2sPeluffo%2C%20Villa%20Ballester!5e0!3m2!1ses-419!2sar!4v1"
                width="100%"
                height="150"
                style={{ border: 0, borderRadius: "6px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Maico"
              />
            </div>
            <a
              href="https://maps.app.goo.gl/smY3eMDzYjF8MBRe8"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-map-link"
            >
              Ver en Google Maps
            </a>
          </div>

          <div className="footer-col">
            <h4>Seguinos</h4>
            <a
              href="https://www.instagram.com/soy.maico?igsh=ZWg4Y3E0dHJzcDlu"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              @soy.maico
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          Maico Panadería &middot; Villa Ballester
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <div className="wa-floating" ref={waRef}>
        {waOpen && (
          <div className="wa-popup">
            <p>Escribinos por WhatsApp</p>
            <a
              href="https://wa.me/5491162207229"
              target="_blank"
              rel="noopener noreferrer"
              className="wa-popup-btn"
            >
              Abrir chat
            </a>
          </div>
        )}
        <button
          className="wa-fab"
          onClick={() => setWaOpen(!waOpen)}
          aria-label="WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}

export default App;
