import { IonContent, IonPage, IonIcon, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { barChart, download } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatCardData } from '../types';

const weeklyStats: StatCardData[] = [
  { title: 'Revenue', value: '₦8,450', icon: 'trending-up', color: 'success', trend: '8%', trendDirection: 'up' },
  { title: 'Expenses', value: '₦3,200', icon: 'trending-down', color: 'danger', trend: '3%', trendDirection: 'down' },
  { title: 'Profit', value: '₦5,250', icon: 'bar-chart', color: 'primary', trend: '12%', trendDirection: 'up' },
];

function Reports() {
  return (
    <IonPage>
      <PageHeader
        title="Reports"
        subtitle="Business analytics"
        actions={
          <IonIcon icon={download} style={{ fontSize: '1.25rem', color: 'var(--ion-color-primary)' }} />
        }
      />
      <IonContent>
        <div className="app-container">
          <IonSegment value="weekly" className="reports-segment">
            <IonSegmentButton value="daily">
              <IonLabel>Daily</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="weekly">
              <IonLabel>Weekly</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="monthly">
              <IonLabel>Monthly</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <div className="app-grid app-grid-3" style={{ marginTop: 'var(--app-spacing-md)' }}>
            {weeklyStats.map((stat) => (
              <StatCard key={stat.title} data={stat} />
            ))}
          </div>

          <div className="app-card" style={{ marginTop: 'var(--app-spacing-md)' }}>
            <h3 className="app-section-title">Sales Overview</h3>
            <div className="reports-chart-placeholder">
              <IonIcon icon={barChart} />
              <p className="app-text-muted">Chart visualization coming soon</p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Reports;
