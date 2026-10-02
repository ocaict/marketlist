import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonPage,
  IonText,
  IonToast,
} from '@ionic/react';
import { checkmarkCircleOutline, warningOutline } from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import AdjustStockModal from '../components/AdjustStockModal';
import { useAuth } from '../context/AuthContext';
import { fetchLowStockProducts } from '../services/inventory';
import { ApiRequestError } from '../services/api';
import { Product } from '../types';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const fieldMessages = Object.entries(error.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
    return fieldMessages || error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function LowStock() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const next = await fetchLowStockProducts(token);
      setProducts(next);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load low-stock products.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading && products.length === 0 && !loadError) {
    return <LoadingState message="Checking stock levels..." />;
  }

  if (loadError && products.length === 0) {
    return (
      <IonPage>
        <PageHeader title="Low Stock" backButton backHref="/dashboard" />
        <IonContent>
          <ErrorState title="Couldn't load low stock" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader
        title="Low Stock"
        subtitle={products.length > 0 ? `${products.length} products need attention` : 'Stock levels'}
        backButton
        backHref="/dashboard"
      />
      <IonContent>
        <div className="app-container">
          {loadError && (
            <IonText color="danger">
              <p className="inventory-error">{loadError}</p>
            </IonText>
          )}
          {products.length === 0 ? (
            <EmptyState
              icon={checkmarkCircleOutline}
              title="All stocked up"
              message="No products are at or below their low-stock threshold right now."
            />
          ) : (
            <>
              <div className="app-card" style={{ marginBottom: 'var(--app-spacing-md)' }}>
                <p className="app-text-muted">
                  <IonIcon icon={warningOutline} color="danger" style={{ verticalAlign: 'middle' }} />{' '}
                  Products at or below their threshold are listed below. Adjust stock when you restock
                  or correct a count.
                </p>
              </div>
              <div className="app-grid app-grid-2">
                {products.map((product) => {
                  const outOfStock = product.stockQuantity === 0;
                  return (
                    <div
                      key={product.id}
                      className={`app-card product-card${outOfStock ? '' : ' product-card-low-stock'}`}
                    >
                      <div className="product-card-content">
                        <div className="product-card-info">
                          <h3 className="product-card-name">{product.name}</h3>
                          <span className="product-card-category">
                            {product.category || 'Uncategorized'}
                          </span>
                          <div className="product-card-footer">
                            <span className="product-card-price">
                              {product.stockQuantity} in stock
                            </span>
                            <IonChip color="danger" className="product-card-stock">
                              <IonIcon icon={warningOutline} />
                              {outOfStock ? 'Out of stock' : 'Low stock'}
                            </IonChip>
                          </div>
                          <span className="product-low-stock-label">
                            Threshold: {product.lowStockThreshold}
                          </span>
                          <IonButton
                            size="small"
                            fill="outline"
                            style={{ marginTop: 8 }}
                            onClick={() => setAdjustingProduct(product)}
                          >
                            Adjust stock
                          </IonButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </IonContent>

      <AdjustStockModal
        product={adjustingProduct}
        token={token || ''}
        onClose={() => setAdjustingProduct(null)}
        onSaved={(message) => {
          setToastMessage(message);
          void loadData();
        }}
        onError={(message) => setToastMessage(message)}
      />
      <IonToast
        isOpen={Boolean(toastMessage)}
        message={toastMessage}
        duration={2600}
        onDidDismiss={() => setToastMessage('')}
      />
    </IonPage>
  );
}

export default LowStock;
