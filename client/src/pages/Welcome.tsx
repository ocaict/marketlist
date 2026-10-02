import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/react';
import { storefront, arrowForward, checkmarkCircle } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

function Welcome() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ion-padding welcome-page">
        <div className="welcome-container">
          <div className="welcome-logo">
            <IonIcon icon={storefront} />
          </div>
          <h1 className="welcome-title">MarketList</h1>
          <p className="welcome-subtitle">
            Inventory &amp; Sales Manager for your business
          </p>

          <div className="welcome-features">
            <div className="welcome-feature">
              <IonIcon icon={checkmarkCircle} />
              <span>Track inventory in real-time</span>
            </div>
            <div className="welcome-feature">
              <IonIcon icon={checkmarkCircle} />
              <span>Record sales &amp; transactions</span>
            </div>
            <div className="welcome-feature">
              <IonIcon icon={checkmarkCircle} />
              <span>Generate business reports</span>
            </div>
          </div>

          <div className="welcome-actions">
            <IonButton
              expand="block"
              color="primary"
              onClick={() => history.push('/login')}
              className="welcome-btn"
            >
              Get Started
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              onClick={() => history.push('/register')}
              className="welcome-btn"
            >
              Create Account
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Welcome;
