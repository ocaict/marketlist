import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { fetchSale, fetchSales, Sale, SaleListItem } from '../services/sales';
import { ApiRequestError } from '../services/api';

type Range = 'all' | 'today' | 'yesterday' | 'last7days' | 'month';

const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

const formatDate = (value: string) => new Date(value).toLocaleString();

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const fieldMessages = Object.entries(error.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
    return fieldMessages || error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function SalesHistory() {
  const { token } = useAuth();
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const next = await fetchSales(token, range === 'all' ? undefined : range);
      setSales(next);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load sales history.'));
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleSales = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return sales.filter(
      (sale) =>
        !normalized ||
        sale.id.toLowerCase().includes(normalized) ||
        sale.paymentMethod.toLowerCase().includes(normalized)
    );
  }, [sales, search]);

  const openSale = async (sale: SaleListItem) => {
    if (!token) return;
    setLoadingDetail(true);
    try {
      const detail = await fetchSale(token, sale.id);
      setSelectedSale(detail);
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Unable to load sale details.'));
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading && sales.length === 0 && !loadError) {
    return <LoadingState message="Loading sales history..." />;
  }

  if (loadError && sales.length === 0) {
    return (
      <IonPage>
        <PageHeader title="Sales History" backButton backHref="/sales" />
        <IonContent>
          <ErrorState title="Couldn't load sales history" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader title="Sales History" subtitle={`${sales.length} sale${sales.length === 1 ? '' : 's'}`} backButton backHref="/sales" />
      <IonContent>
        <div className="app-container">
          <IonSearchbar
            value={search}
            placeholder="Search by ID or payment method..."
            onIonInput={(event) => setSearch(event.detail.value || '')}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--app-spacing-md)' }}>
            {rangeOptions.map((option) => (
              <IonChip
                key={option.value}
                color={range === option.value ? 'primary' : 'medium'}
                onClick={() => setRange(option.value)}
              >
                <IonLabel>{option.label}</IonLabel>
              </IonChip>
            ))}
          </div>

          {loadError && (
            <IonText color="danger">
              <p className="inventory-error">{loadError}</p>
            </IonText>
          )}

          {sales.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No sales recorded"
              message="Sales will appear here once you start recording transactions."
            />
          ) : visibleSales.length === 0 ? (
            <EmptyState
              icon="search-outline"
              title="No matching sales"
              message="Try a different search or date filter."
            />
          ) : (
            <IonList>
              {visibleSales.map((sale) => (
                <IonItem key={sale.id} button onClick={() => openSale(sale)}>
                  <IonLabel>
                    <h2>{formatPrice(sale.total)}</h2>
                    <p>
                      {formatDate(sale.createdAt)} · {sale.paymentMethod} · {sale.itemCount} item{sale.itemCount === 1 ? '' : 's'}
                    </p>
                    <p className="app-text-muted">#{sale.id.slice(0, 8)}</p>
                  </IonLabel>
                  <IonChip color="medium" slot="end">{sale.paymentMethod}</IonChip>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>

      <IonModal
        isOpen={Boolean(selectedSale) || loadingDetail}
        onDidDismiss={() => setSelectedSale(null)}
        className="inventory-modal"
      >
        {selectedSale && (
          <>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Sale Details</IonTitle>
                <IonButton slot="end" fill="clear" onClick={() => setSelectedSale(null)}>
                  Done
                </IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div className="product-detail">
                <h2>{formatPrice(selectedSale.total)}</h2>
                <p>{formatDate(selectedSale.createdAt)} · {selectedSale.paymentMethod}</p>
                <p className="app-text-muted">#{selectedSale.id}</p>
                <dl className="product-detail-list">
                  {selectedSale.items?.map((item) => (
                    <div key={item.id}>
                      <dt>{item.productName ?? item.productId}</dt>
                      <dd>
                        {item.quantity} × {formatPrice(item.unitPrice)} = {formatPrice(item.subtotal)}
                      </dd>
                    </div>
                  ))}
                  <div><dt>Subtotal</dt><dd>{formatPrice(selectedSale.subtotal)}</dd></div>
                  <div><dt>Discount</dt><dd>−{formatPrice(selectedSale.discount)}</dd></div>
                  <div><dt>Total</dt><dd>{formatPrice(selectedSale.total)}</dd></div>
                  <div><dt>Payment method</dt><dd>{selectedSale.paymentMethod}</dd></div>
                  <div><dt>Date/time</dt><dd>{formatDate(selectedSale.createdAt)}</dd></div>
                </dl>
              </div>
            </IonContent>
          </>
        )}
      </IonModal>

      <IonToast
        isOpen={Boolean(toastMessage)}
        message={toastMessage}
        duration={2600}
        onDidDismiss={() => setToastMessage('')}
      />
    </IonPage>
  );
}

export default SalesHistory;
