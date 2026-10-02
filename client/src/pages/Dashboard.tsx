import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { fetchDashboard, DashboardData } from '../services/dashboard';
import { ApiRequestError } from '../services/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function Dashboard() {
  const { token } = useAuth();
  const history = useHistory();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const next = await fetchDashboard(token);
      setData(next);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading && !data && !loadError) {
    return <LoadingState message="Loading dashboard..." />;
  }

  if (loadError && !data) {
    return (
      <IonPage>
        <PageHeader title="Dashboard" subtitle="Business overview" />
        <IonContent>
          <ErrorState title="Couldn't load dashboard" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader title="Dashboard" subtitle="Business overview" />
      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) => {
            void loadData();
            setTimeout(() => e.detail.complete(), 500);
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className="app-container">
          {loadError && (
            <IonText color="danger">
              <p className="inventory-error">{loadError}</p>
            </IonText>
          )}

          <div className="app-grid app-grid-2">
            <StatCard
              data={{
                title: "Today's Sales",
                value: formatPrice(data?.todaysSales ?? 0),
                icon: 'cash',
                color: 'primary',
              }}
            />
            <StatCard
              data={{
                title: 'Transactions',
                value: String(data?.todaysTransactionCount ?? 0),
                icon: 'receipt',
                color: 'success',
              }}
            />
            <StatCard
              data={{
                title: 'Products',
                value: String(data?.totalProducts ?? 0),
                icon: 'cube',
                color: 'secondary',
              }}
              onClick={() => history.push('/products')}
            />
            <StatCard
              data={{
                title: 'Low Stock',
                value: String(data?.lowStockCount ?? 0),
                icon: 'warning',
                color: (data?.lowStockCount ?? 0) > 0 ? 'danger' : 'warning',
              }}
              onClick={() => history.push('/low-stock')}
            />
          </div>

          <div className="app-card" style={{ marginTop: 'var(--app-spacing-md)' }}>
            <h3 className="app-section-title">Estimated Gross Profit (today)</h3>
            <h2>{formatPrice(data?.estimatedGrossProfit ?? 0)}</h2>
            <p className="app-text-muted">Selling price minus cost price from completed sales.</p>
          </div>

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Quick Actions
          </h3>
          <div className="app-grid app-grid-2">
            <IonButton expand="block" onClick={() => history.push('/products')}>
              Add Product
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => history.push('/sales')}>
              Record Sale
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => history.push('/products')}>
              View Inventory
            </IonButton>
            <IonButton expand="block" fill="outline" onClick={() => history.push('/reports')}>
              View Reports
            </IonButton>
          </div>

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Recent Sales
          </h3>
          {data && data.recentSales.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No sales yet"
              message="Recent sales will appear here after your first transaction."
            />
          ) : (
            <IonList>
              {data?.recentSales.map((sale) => (
                <IonItem key={sale.id} button onClick={() => history.push('/sales/history')}>
                  <IonLabel>
                    <h2>{formatPrice(sale.total)}</h2>
                    <p>{new Date(sale.createdAt).toLocaleString()}</p>
                  </IonLabel>
                  <IonChip color="medium" slot="end">{sale.paymentMethod}</IonChip>
                </IonItem>
              ))}
            </IonList>
          )}

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Top Products
          </h3>
          {data && data.topProducts.length === 0 ? (
            <EmptyState
              icon="trending-up-outline"
              title="No sales data"
              message="Top-selling products will appear here once you record sales."
            />
          ) : (
            <IonList>
              {data?.topProducts.map((product, index) => (
                <IonItem key={product.id}>
                  <IonLabel>
                    <h2>
                      {index + 1}. {product.name}
                    </h2>
                    <p>{product.quantitySold} sold · {formatPrice(product.revenue)} revenue</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Dashboard;
