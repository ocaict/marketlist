import { IonContent, IonPage, IonItem, IonLabel, IonIcon, IonToggle, IonSelect, IonSelectOption } from '@ionic/react';
import { cash, alertCircle, logOut } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const CURRENCY_KEY = 'marketlist_currency';
const LOW_STOCK_ALERTS_KEY = 'marketlist_low_stock_alerts';

function Settings() {
  const { logout } = useAuth();
  const [currency, setCurrency] = useState(() => localStorage.getItem(CURRENCY_KEY) || 'NGN');
  const [lowStockAlerts, setLowStockAlerts] = useState(
    () => localStorage.getItem(LOW_STOCK_ALERTS_KEY) !== 'false'
  );

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem(CURRENCY_KEY, value);
  };

  const handleLowStockToggle = (checked: boolean) => {
    setLowStockAlerts(checked);
    localStorage.setItem(LOW_STOCK_ALERTS_KEY, String(checked));
  };

  const handleLogout = () => {
    logout();
    window.location.replace('/');
  };

  return (
    <IonPage>
      <PageHeader title="Settings" subtitle="App preferences" backButton backHref="/profile" />
      <IonContent>
        <div className="app-container">
          <div className="app-card">
            <h3 className="app-section-title">Preferences</h3>
            <IonItem lines="none">
              <IonIcon icon={cash} slot="start" color="primary" />
              <IonLabel>Currency</IonLabel>
              <IonSelect value={currency} slot="end" onIonChange={(e) => handleCurrencyChange(e.detail.value)}>
                <IonSelectOption value="NGN">Nigerian Naira (₦)</IonSelectOption>
                <IonSelectOption value="USD">US Dollar ($)</IonSelectOption>
                <IonSelectOption value="GBP">British Pound (£)</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem lines="none">
              <IonIcon icon={alertCircle} slot="start" color="primary" />
              <IonLabel>
                <h3>Low-Stock Alerts</h3>
                <p>Highlight products at or below their low-stock threshold</p>
              </IonLabel>
              <IonToggle
                slot="end"
                checked={lowStockAlerts}
                onIonChange={(e) => handleLowStockToggle(e.detail.checked)}
              />
            </IonItem>
          </div>

          <div className="app-card">
            <IonItem lines="none" detail button onClick={handleLogout}>
              <IonIcon icon={logOut} slot="start" color="danger" />
              <IonLabel color="danger">
                <h3>Logout</h3>
              </IonLabel>
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Settings;
