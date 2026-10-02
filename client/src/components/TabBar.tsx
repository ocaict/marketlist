import { IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, cube, receipt, barChart, person } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Home', icon: home, path: '/dashboard' },
  { label: 'Products', icon: cube, path: '/products' },
  { label: 'Sales', icon: receipt, path: '/sales' },
  { label: 'Reports', icon: barChart, path: '/reports' },
  { label: 'Profile', icon: person, path: '/profile' },
];

function TabBar() {
  const history = useHistory();
  const location = useLocation();

  return (
    <IonTabBar slot="bottom">
      {tabs.map((tab) => (
        <IonTabButton
          key={tab.path}
          tab={tab.path}
          selected={location.pathname === tab.path}
          onClick={() => history.push(tab.path)}
        >
          <IonIcon icon={tab.icon} />
          <IonLabel>{tab.label}</IonLabel>
        </IonTabButton>
      ))}
    </IonTabBar>
  );
}

export default TabBar;
