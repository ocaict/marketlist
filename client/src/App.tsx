import { IonApp, IonRouterOutlet, IonToast, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect, useHistory, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabBar from './components/TabBar';
import OfflineBanner from './components/OfflineBanner';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingState from './components/LoadingState';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LowStock from './pages/LowStock';
import SalesHistory from './pages/SalesHistory';

setupIonicReact();

const appPaths = new Set([
  '/', '/login', '/register', '/dashboard', '/products', '/sales', '/reports', '/profile', '/settings', '/low-stock', '/sales/history',
]);

function AppRoutes() {
  const { isAuthenticated, isLoading, successMessage, clearSuccessMessage } = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!appPaths.has(location.pathname)) {
      history.replace(isAuthenticated ? '/dashboard' : '/');
    }
  }, [history, isAuthenticated, location.pathname]);

  if (isLoading) {
    return <LoadingState message="Loading..." />;
  }

  return (
    <>
      <IonRouterOutlet>
        {/* Public routes */}
        <Route
          exact
          path="/"
          render={() => isAuthenticated ? <Redirect to="/dashboard" /> : <Welcome />}
        />
        <Route
          exact
          path="/login"
          render={() => isAuthenticated ? <Redirect to="/dashboard" /> : <Login />}
        />
        <Route
          exact
          path="/register"
          render={() => isAuthenticated ? <Redirect to="/dashboard" /> : <Register />}
        />

        {/* Protected routes */}
        <ProtectedRoute exact path="/dashboard" component={Dashboard} />
        <ProtectedRoute exact path="/products" component={Products} />
        <ProtectedRoute exact path="/low-stock" component={LowStock} />
        <ProtectedRoute exact path="/sales" component={Sales} />
        <ProtectedRoute exact path="/sales/history" component={SalesHistory} />
        <ProtectedRoute exact path="/reports" component={Reports} />
        <ProtectedRoute exact path="/profile" component={Profile} />
        <ProtectedRoute exact path="/settings" component={Settings} />

      </IonRouterOutlet>
      {isAuthenticated && <TabBar />}
      <OfflineBanner />
      <IonToast
        isOpen={Boolean(successMessage)}
        message={successMessage || undefined}
        duration={1800}
        onDidDismiss={clearSuccessMessage}
      />
    </>
  );
}

function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}

export default App;
