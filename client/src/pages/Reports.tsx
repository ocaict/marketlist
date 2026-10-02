import { useCallback, useEffect, useState } from 'react';
import {
  IonChip,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonText,
} from '@ionic/react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { fetchReportSummary, ReportSummary } from '../services/reports';
import { ApiRequestError } from '../services/api';

type Period = 'today' | 'last7days' | 'month';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  return error instanceof Error ? error.message : fallback;
}

function SalesTrendChart({ trend }: { trend: Array<{ date: string; total: number }> }) {
  const max = Math.max(...trend.map((point) => point.total), 1);
  return (
    <div className="reports-chart" role="img" aria-label="Sales trend chart">
      <div className="reports-chart-bars">
        {trend.map((point) => (
          <div key={point.date} className="reports-chart-bar-group">
            <div
              className="reports-chart-bar"
              style={{ height: `${Math.max((point.total / max) * 100, 2)}%` }}
              title={`${point.date}: ${formatPrice(point.total)}`}
            />
            <span className="reports-chart-label">{point.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Reports() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>('last7days');
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const next = await fetchReportSummary(token, period);
      setData(next);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load report.'));
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading && !data && !loadError) {
    return <LoadingState message="Loading report..." />;
  }

  if (loadError && !data) {
    return (
      <IonPage>
        <PageHeader title="Reports" subtitle="Business analytics" />
        <IonContent>
          <ErrorState title="Couldn't load report" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader title="Reports" subtitle="Business analytics" />
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
          <IonSegment
            value={period}
            className="reports-segment"
            onIonChange={(event) => setPeriod(event.detail.value as Period)}
          >
            <IonSegmentButton value="today">
              <IonLabel>Today</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="last7days">
              <IonLabel>7 Days</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="month">
              <IonLabel>Month</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {loadError && (
            <IonText color="danger">
              <p className="inventory-error">{loadError}</p>
            </IonText>
          )}

          <div className="app-grid app-grid-3" style={{ marginTop: 'var(--app-spacing-md)' }}>
            <StatCard
              data={{
                title: 'Total Sales',
                value: formatPrice(data?.totalSales ?? 0),
                icon: 'cash',
                color: 'primary',
              }}
            />
            <StatCard
              data={{
                title: 'Transactions',
                value: String(data?.transactionCount ?? 0),
                icon: 'receipt',
                color: 'secondary',
              }}
            />
            <StatCard
              data={{
                title: 'Est. Gross Profit',
                value: formatPrice(data?.estimatedGrossProfit ?? 0),
                icon: 'bar-chart',
                color: 'success',
              }}
            />
          </div>

          <div className="app-card" style={{ marginTop: 'var(--app-spacing-md)' }}>
            <h3 className="app-section-title">Sales Trend</h3>
            {data && data.salesTrend.some((point) => point.total > 0) ? (
              <SalesTrendChart trend={data.salesTrend} />
            ) : (
              <EmptyState
                icon="bar-chart-outline"
                title="No sales in this period"
                message="Record a sale and it will show up in the trend."
              />
            )}
          </div>

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Top Products
          </h3>
          {data && data.topProducts.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="No top products"
              message="Top-selling products appear here once sales are recorded."
            />
          ) : (
            <IonList>
              {data?.topProducts.map((product, index) => (
                <IonItem key={product.id}>
                  <IonLabel>
                    <h2>
                      {index + 1}. {product.name}
                    </h2>
                    <p>
                      {product.quantitySold} sold · {formatPrice(product.revenue)} revenue
                    </p>
                  </IonLabel>
                  <IonChip color="primary" slot="end">
                    #{index + 1}
                  </IonChip>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Reports;
