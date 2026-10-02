import { IonContent, IonPage, IonItem, IonLabel, IonInput, IonIcon, IonText } from '@ionic/react';
import { mail, lockClosed, logIn, eye, eyeOff } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { ApiRequestError } from '../services/api';

function Login() {
  const history = useHistory();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setFieldErrors({});
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldErrors({ email: 'Enter a valid email address' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Password is required' });
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.statusCode === 401 ? 'Invalid email or password' : err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your MarketList account</p>
          </div>

          <div className="auth-form">
            {error && (
              <div className="auth-error">
                <IonText color="danger">{error}</IonText>
              </div>
            )}
            <IonItem className="auth-input" lines="none">
              <IonIcon icon={mail} slot="start" color="medium" />
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onIonInput={(e) => {
                  setEmail(e.detail.value || '');
                  setFieldErrors((current) => ({ ...current, email: '' }));
                }}
              />
            </IonItem>
            {fieldErrors.email && <IonText color="danger" className="auth-field-error">{fieldErrors.email}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={lockClosed} slot="start" color="medium" />
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
              />
              <IonIcon
                icon={showPassword ? eyeOff : eye}
                slot="end"
                color="medium"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-password-toggle"
              />
            </IonItem>
            {fieldErrors.password && <IonText color="danger" className="auth-field-error">{fieldErrors.password}</IonText>}

            <div className="auth-forgot">
              <IonText color="primary" onClick={() => {}}>Forgot password?</IonText>
            </div>

            <Button fullWidth onClick={handleLogin} disabled={isLoading} className="auth-submit">
              <IonIcon icon={logIn} slot="start" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <IonText color="primary" onClick={() => history.push('/register')}>
                Create one
              </IonText>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Login;
