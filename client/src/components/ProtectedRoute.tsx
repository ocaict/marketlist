import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

interface ProtectedRouteProps {
  path: string;
  exact?: boolean;
  component: React.ComponentType<any>;
}

function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}

export default ProtectedRoute;
