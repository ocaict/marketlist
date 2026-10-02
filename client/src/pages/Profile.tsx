import { IonContent, IonPage, IonItem, IonLabel, IonIcon, IonAvatar } from '@ionic/react';
import { person, mail, storefront, call, chevronForward, logOut } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

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
            <IonItem lines="none" detail>
              <IonIcon icon={storefront} slot="start" color="primary" />
              <IonLabel>
                <h3>Business Name</h3>
                <p>{user?.business_name}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" detail>
              <IonIcon icon={person} slot="start" color="primary" />
              <IonLabel>
                <h3>Owner Name</h3>
                <p>{user?.name}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" detail>
              <IonIcon icon={mail} slot="start" color="primary" />
              <IonLabel>
                <h3>Email</h3>
                <p>{user?.email}</p>
              </IonLabel>
            </IonItem>
            <IonItem lines="none" detail>
              <IonIcon icon={call} slot="start" color="primary" />
              <IonLabel>
                <h3>Phone</h3>
                <p>{user?.phone || 'Not provided'}</p>
              </IonLabel>
            </IonItem>
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
