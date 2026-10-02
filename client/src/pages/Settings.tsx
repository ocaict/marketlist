import { IonContent, IonPage, IonItem, IonLabel, IonIcon, IonToggle, IonSelect, IonSelectOption } from '@ionic/react';
import { notifications, moon, language, lockClosed, helpCircle, information, chevronForward } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';

function Settings() {
  return (
    <IonPage>
      <PageHeader title="Settings" subtitle="App preferences" backButton backHref="/profile" />
      <IonContent>
        <div className="app-container">
          <div className="app-card">
            <h3 className="app-section-title">Notifications</h3>
            <IonItem lines="none">
              <IonIcon icon={notifications} slot="start" color="primary" />
              <IonLabel>Push Notifications</IonLabel>
              <IonToggle slot="end" checked={true} />
            </IonItem>
            <IonItem lines="none">
              <IonIcon icon={notifications} slot="start" color="primary" />
              <IonLabel>Low Stock Alerts</IonLabel>
              <IonToggle slot="end" checked={true} />
            </IonItem>
          </div>

          <div className="app-card">
            <h3 className="app-section-title">Appearance</h3>
            <IonItem lines="none">
              <IonIcon icon={moon} slot="start" color="primary" />
              <IonLabel>Dark Mode</IonLabel>
              <IonToggle slot="end" checked={false} />
            </IonItem>
            <IonItem lines="none">
              <IonIcon icon={language} slot="start" color="primary" />
              <IonLabel>Language</IonLabel>
              <IonSelect value="en" slot="end">
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="fr">French</IonSelectOption>
                <IonSelectOption value="es">Spanish</IonSelectOption>
              </IonSelect>
            </IonItem>
          </div>

          <div className="app-card">
            <h3 className="app-section-title">Security</h3>
            <IonItem lines="none" detail onClick={() => {}}>
              <IonIcon icon={lockClosed} slot="start" color="primary" />
              <IonLabel>
                <h3>Change Password</h3>
              </IonLabel>
              <IonIcon icon={chevronForward} slot="end" color="medium" />
            </IonItem>
          </div>

          <div className="app-card">
            <h3 className="app-section-title">About</h3>
            <IonItem lines="none" detail onClick={() => {}}>
              <IonIcon icon={helpCircle} slot="start" color="primary" />
              <IonLabel>
                <h3>Help &amp; Support</h3>
              </IonLabel>
              <IonIcon icon={chevronForward} slot="end" color="medium" />
            </IonItem>
            <IonItem lines="none" detail onClick={() => {}}>
              <IonIcon icon={information} slot="start" color="primary" />
              <IonLabel>
                <h3>About MarketList</h3>
                <p>Version 1.0.0</p>
              </IonLabel>
              <IonIcon icon={chevronForward} slot="end" color="medium" />
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Settings;
