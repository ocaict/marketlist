import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

function Home() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>MarketList</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>Welcome to MarketList</h1>
        <p>Inventory &amp; Sales Manager for small businesses.</p>
      </IonContent>
    </IonPage>
  );
}

export default Home;
