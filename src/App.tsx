// ═══════════════════════════════════════════════════════════════════
// Main Application Component
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "./store/useThemeStore";
import { useInitializationStore } from "./store/useInitializationStore";
import { useLanguage } from "./i18n";
import { NavBar } from "./components/layout/NavBar";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/errors";
import { SkipToContent } from "./components/accessibility";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { SetupPage } from "./pages/Setup";
import { History } from "./pages/History";
import { Admin } from "./pages/Admin";
import { Help } from "./pages/Help";
import { Profile } from "./pages/Profile";

// Initialization Guard Component
function InitializationGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInitialized, checkInitialization } = useInitializationStore();

  useEffect(() => {
    checkInitialization();
  }, [checkInitialization]);

  useEffect(() => {
    if (isInitialized === false && !location.pathname.startsWith("/setup") && !location.pathname.startsWith("/share/")) {
      navigate("/setup", { replace: true });
    }
  }, [isInitialized, navigate, location.pathname]);

  if (isInitialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-default-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  const theme = useThemeStore(useShallow((state) => state.theme));
  const { t } = useLanguage();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toastOptions = useMemo(
    () => ({
      duration: 4000,
      style: {
        background: theme === "dark" ? "#1f2937" : "#fff",
        color: theme === "dark" ? "#f3f4f6" : "#1f2937",
        border: `2px solid ${theme === "dark" ? "#374151" : "#d1d5db"}`,
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      },
      success: {
        iconTheme: {
          primary: "#065f46",
          secondary: "#fff",
        },
      },
      error: {
        iconTheme: {
          primary: "#991b1b",
          secondary: "#fff",
        },
      },
    }),
    [theme]
  );

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <InitializationGuard>
          <SkipToContent />
          <div className="min-h-screen bg-background">
            <Toaster position="top-right" toastOptions={toastOptions} />

            <Routes>
              <Route
                path="/setup"
                element={
                  <ErrorBoundary>
                    <SetupPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <LoginPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/share/:token"
                element={
                  <ErrorBoundary>
                    <div>Public Share Link (TODO)</div>
                  </ErrorBoundary>
                }
              />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <NavBar />

                    <main id="main-content" tabIndex={-1} className="outline-none">
                      <Routes>
                      <Route
                        path="/"
                        element={
                          <ErrorBoundary>
                            <HomePage />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/history"
                        element={
                          <ErrorBoundary>
                            <History />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ErrorBoundary>
                            <Admin />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/help"
                        element={
                          <ErrorBoundary>
                            <Help />
                          </ErrorBoundary>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ErrorBoundary>
                            <Profile />
                          </ErrorBoundary>
                        }
                      />
                    </Routes>
                    </main>

                    <footer className="backdrop-blur-sm bg-content1 border-t border-divider mt-16">
                      <div className="container mx-auto px-4 py-8 text-center">
                        <p className="text-sm font-medium text-default-500">{t.footerText}</p>
                      </div>
                    </footer>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </InitializationGuard>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
