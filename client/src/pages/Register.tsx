import { IonContent, IonPage, IonItem, IonLabel, IonInput, IonIcon, IonText } from '@ionic/react';
import { person, mail, lockClosed, storefront, call, eye, eyeOff } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { ApiRequestError } from '../services/api';

function Register() {
  const history = useHistory();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setFieldErrors({});
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = 'Enter your name (at least 2 characters)';
    if (form.businessName.trim().length < 2) errors.businessName = 'Enter a business name (at least 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
    if (form.phone.trim().length < 7 || form.phone.trim().length > 20) errors.phone = 'Enter a phone number between 7 and 20 characters';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), businessName: form.businessName.trim(), email: form.email.trim(), phone: form.phone.trim() });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.fieldErrors.email || err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed');
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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Start managing your business today</p>
          </div>

          <div className="auth-form">
            {error && (
              <div className="auth-error">
                <IonText color="danger">{error}</IonText>
              </div>
            )}
            <IonItem className="auth-input" lines="none">
              <IonIcon icon={storefront} slot="start" color="medium" />
              <IonLabel position="stacked">Business Name</IonLabel>
              <IonInput
                placeholder="Your business name"
                value={form.businessName}
                onIonInput={(e) => setForm((current) => ({ ...current, businessName: e.detail.value || '' }))}
              />
            </IonItem>
            {fieldErrors.businessName && <IonText color="danger" className="auth-field-error">{fieldErrors.businessName}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={person} slot="start" color="medium" />
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                placeholder="Your full name"
                value={form.name}
                onIonInput={(e) => setForm((current) => ({ ...current, name: e.detail.value || '' }))}
              />
            </IonItem>
            {fieldErrors.name && <IonText color="danger" className="auth-field-error">{fieldErrors.name}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={mail} slot="start" color="medium" />
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onIonInput={(e) => setForm((current) => ({ ...current, email: e.detail.value || '' }))}
              />
            </IonItem>
            {fieldErrors.email && <IonText color="danger" className="auth-field-error">{fieldErrors.email}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={call} slot="start" color="medium" />
              <IonLabel position="stacked">Phone</IonLabel>
              <IonInput
                type="tel"
                placeholder="+1234567890"
                value={form.phone}
                onIonInput={(e) => setForm((current) => ({ ...current, phone: e.detail.value || '' }))}
              />
            </IonItem>
            {fieldErrors.phone && <IonText color="danger" className="auth-field-error">{fieldErrors.phone}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={lockClosed} slot="start" color="medium" />
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onIonInput={(e) => setForm((current) => ({ ...current, password: e.detail.value || '' }))}
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

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={lockClosed} slot="start" color="medium" />
              <IonLabel position="stacked">Confirm Password</IonLabel>
              <IonInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onIonInput={(e) => setForm((current) => ({ ...current, confirmPassword: e.detail.value || '' }))}
              />
            </IonItem>
            {fieldErrors.confirmPassword && <IonText color="danger" className="auth-field-error">{fieldErrors.confirmPassword}</IonText>}

            <Button fullWidth onClick={handleRegister} disabled={isLoading} className="auth-submit">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch">
              Already have an account?{' '}
              <IonText color="primary" onClick={() => history.push('/login')}>
                Sign in
              </IonText>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Register;
