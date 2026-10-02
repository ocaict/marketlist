import { useCallback, useEffect, useState } from 'react';
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { StatCardData } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchLowStockProducts, fetchProducts } from '../services/inventory';

function Dashboard() {
  const { token } = useAuth();
  const history = useHistory();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [products, lowStock] = await Promise.all([
        fetchProducts(token),
        fetchLowStockProducts(token),
      ]);
      setProductCount(products.length);
      setLowStockCount(lowStock.length);
    } catch {
      // Keep placeholders if the API is unavailable.
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dashboardStats: (StatCardData & { onClick?: () => void })[] = [
    { title: "Today's Sales", value: '₦1,250.00', icon: 'cash', color: 'primary', trend: '12%', trendDirection: 'up' },
    { title: 'Products', value: productCount === null ? '—' : String(productCount), icon: 'cube', color: 'secondary' },
    {
      title: 'Low Stock',
      value: lowStockCount === null ? '—' : String(lowStockCount),
      icon: 'warning',
      color: lowStockCount ? 'danger' : 'warning',
      onClick: () => history.push('/low-stock'),
    },
    { title: "Today's Transactions", value: '24', icon: 'receipt', color: 'success' },
  ];

  return (
    <IonPage>
      <PageHeader title="Dashboard" subtitle="Business overview" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { void loadData(); setTimeout(() => e.detail.complete(), 500); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="app-container">
          <div className="app-grid app-grid-2">
            {dashboardStats.map(({ onClick, ...stat }) => (
              <StatCard key={stat.title} data={stat} onClick={onClick} />
            ))}
          </div>

          {lowStockCount !== null && lowStockCount > 0 && (
            <div
              className="app-card"
              style={{ marginTop: 'var(--app-spacing-md)', cursor: 'pointer', borderLeft: '4px solid var(--ion-color-danger)' }}
              onClick={() => history.push('/low-stock')}
            >
              <h3 className="app-section-title" style={{ color: 'var(--ion-color-danger)' }}>
                ⚠ {lowStockCount} product{lowStockCount === 1 ? '' : 's'} low on stock
              </h3>
              <p className="app-text-muted">Tap to review and adjust stock levels.</p>
            </div>
          )}

          <div className="app-card" style={{ marginTop: 'var(--app-spacing-md)' }}>
            <h3 className="app-section-title">Recent Activity</h3>
            <p className="app-text-muted">No recent activity to display.</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Dashboard;
