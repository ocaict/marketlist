import { IonContent, IonPage, IonItem, IonLabel, IonIcon, IonAvatar, IonInput, IonText } from '@ionic/react';
import { person, mail, storefront, call, chevronForward, logOut } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profile';
import { ApiRequestError } from '../services/api';

function Profile() {
  const { user, token, logout, updateUser, notifySuccess } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [businessName, setBusinessName] = useState(user?.business_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then((response) => {
        const profile = response.data.user;
        setName(profile.name);
        setBusinessName(profile.business_name);
        setPhone(profile.phone ?? '');
        setEmail(profile.email);
        updateUser(profile);
      })
      .catch(() => {
        // Fall back to the cached user from AuthContext.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (businessName.trim().length < 2) errors.businessName = 'Business name must be at least 2 characters';
    if (phone.trim() && phone.trim().length < 7) errors.phone = 'Phone number must be at least 7 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setError('');
    setFieldErrors({});
    if (!validate() || !token) return;

    setIsSaving(true);
    try {
      const response = await updateProfile(token, {
        name: name.trim(),
        businessName: businessName.trim(),
        phone: phone.trim() === '' ? null : phone.trim(),
        email: email.trim(),
      });
      updateUser(response.data.user);
      notifySuccess('Profile updated successfully.');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const clearFieldError = (field: string) =>
    setFieldErrors((current) => ({ ...current, [field]: '' }));

  return (
    <IonPage>
      <PageHeader title="Profile" subtitle="Account information" />
      <IonContent>
        <div className="app-container">
          <div className="app-card profile-card">
            <div className="profile-header">
              <IonAvatar className="profile-avatar">
                <IonIcon icon={person} />
              </IonAvatar>
              <div className="profile-info">
                <h2 className="profile-name">{user?.name}</h2>
                <p className="app-text-muted">{user?.business_name}</p>
              </div>
            </div>
          </div>

          <div className="app-card">
            <h3 className="app-section-title">Edit Profile</h3>
            {error && (
              <div className="auth-error">
                <IonText color="danger">{error}</IonText>
              </div>
            )}
            <IonItem className="auth-input" lines="none">
              <IonIcon icon={person} slot="start" color="medium" />
              <IonLabel position="stacked">Name</IonLabel>
              <IonInput
                value={name}
                onIonInput={(e) => {
                  setName(e.detail.value || '');
                  clearFieldError('name');
                }}
              />
            </IonItem>
            {fieldErrors.name && <IonText color="danger" className="auth-field-error">{fieldErrors.name}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={storefront} slot="start" color="medium" />
              <IonLabel position="stacked">Business Name</IonLabel>
              <IonInput
                value={businessName}
                onIonInput={(e) => {
                  setBusinessName(e.detail.value || '');
                  clearFieldError('businessName');
                }}
              />
            </IonItem>
            {fieldErrors.businessName && <IonText color="danger" className="auth-field-error">{fieldErrors.businessName}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={call} slot="start" color="medium" />
              <IonLabel position="stacked">Phone</IonLabel>
              <IonInput
                type="tel"
                placeholder="Not provided"
                value={phone}
                onIonInput={(e) => {
                  setPhone(e.detail.value || '');
                  clearFieldError('phone');
                }}
              />
            </IonItem>
            {fieldErrors.phone && <IonText color="danger" className="auth-field-error">{fieldErrors.phone}</IonText>}

            <IonItem className="auth-input" lines="none">
              <IonIcon icon={mail} slot="start" color="medium" />
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => {
                  setEmail(e.detail.value || '');
                  clearFieldError('email');
                }}
              />
            </IonItem>
            {fieldErrors.email && <IonText color="danger" className="auth-field-error">{fieldErrors.email}</IonText>}

            <Button onClick={handleSave} disabled={isSaving} fullWidth>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="app-card">
            <IonItem lines="none" detail button onClick={handleLogout}>
              <IonIcon icon={logOut} slot="start" color="danger" />
              <IonLabel color="danger">
                <h3>Sign Out</h3>
              </IonLabel>
              <IonIcon icon={chevronForward} slot="end" color="medium" />
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Profile;
