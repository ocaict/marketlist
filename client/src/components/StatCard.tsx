import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { arrowUp, arrowDown } from 'ionicons/icons';
import { StatCardData } from '../types';

interface StatCardProps {
  data: StatCardData;
  onClick?: () => void;
}

function StatCard({ data, onClick }: StatCardProps) {
  const { title, value, icon, color, trend, trendDirection } = data;

  return (
    <IonCard className="stat-card" button={Boolean(onClick)} onClick={onClick}>
      <IonCardContent>
        <div className="stat-card-content">
          <div className="stat-card-text">
            <span className="stat-card-title">{title}</span>
            <span className="stat-card-value">{value}</span>
            {trend && (
              <span className={`stat-card-trend ${trendDirection}`}>
                <IonIcon icon={trendDirection === 'up' ? arrowUp : arrowDown} />
                {trend}
              </span>
            )}
          </div>
          <div className={`stat-card-icon stat-card-icon--${color}`}>
            <IonIcon icon={icon} />
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

export default StatCard;
