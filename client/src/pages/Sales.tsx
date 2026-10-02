import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonToast,
} from '@ionic/react';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../services/inventory';
import { createSale, fetchSales, Sale, SaleListItem } from '../services/sales';
import { ApiRequestError } from '../services/api';
import { Product } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const fieldMessages = Object.entries(error.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
    return fieldMessages || error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function Sales() {
  const { token } = useAuth();
  const history = useHistory();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'pos' | 'other'>('cash');
  const [completing, setCompleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [nextProducts, nextSales] = await Promise.all([fetchProducts(token), fetchSales(token)]);
      setProducts(nextProducts);
      setSales(nextSales);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load sales data.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        (product.sku || '').toLowerCase().includes(normalized)
    );
  }, [products, search]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discount = Math.max(Number(discountInput) || 0, 0);
  const total = Math.max(subtotal - discount, 0);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          setToastMessage(`Only ${product.stockQuantity} in stock for "${product.name}".`);
          return current;
        }
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stockQuantity < 1) {
        setToastMessage(`"${product.name}" is out of stock.`);
        return current;
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const setQuantity = (productId: string, quantity: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item;
          const clamped = Math.min(Math.max(quantity, 1), item.product.stockQuantity);
          return { ...item, quantity: clamped };
        })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  };

  const completeSale = async () => {
    if (!token || cart.length === 0) return;
    setCompleting(true);
    try {
      const sale = await createSale(token, {
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        discount,
        paymentMethod,
      });
      setLastSale(sale);
      setCart([]);
      setDiscountInput('0');
      setToastMessage('Sale completed successfully.');
      await loadData();
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Unable to complete the sale.'));
    } finally {
      setCompleting(false);
    }
  };

  if (loading && products.length === 0 && !loadError) {
    return <LoadingState message="Loading sales..." />;
  }

  if (loadError && products.length === 0) {
    return (
      <IonPage>
        <PageHeader title="Sales" />
        <IonContent>
          <ErrorState title="Couldn't load sales" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader
        title="Sales"
        subtitle="Point of sale"
        actions={
          <IonButton fill="clear" onClick={() => history.push('/sales/history')}>
            History
          </IonButton>
        }
      />
      <IonContent>
        <div className="app-container">
          <IonSearchbar
            value={search}
            placeholder="Search products or SKU..."
            onIonInput={(event) => setSearch(event.detail.value || '')}
          />

          {visibleProducts.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No products found"
              message="Try a different search, or add products from the inventory."
            />
          ) : (
            <IonList>
              {visibleProducts.slice(0, 20).map((product) => (
                <IonItem key={product.id} button onClick={() => addToCart(product)}>
                  <IonLabel>
                    <h2>{product.name}</h2>
                    <p>
                      {formatPrice(product.sellingPrice)} · {product.stockQuantity} in stock
                    </p>
                  </IonLabel>
                  {product.stockQuantity === 0 && <IonChip color="danger">Out of stock</IonChip>}
                  {product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold && (
                    <IonChip color="warning">Low stock</IonChip>
                  )}
                </IonItem>
              ))}
            </IonList>
          )}

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
          </h3>
          {cart.length === 0 ? (
            <p className="app-text-muted">Tap a product above to add it to the cart.</p>
          ) : (
            <>
              <IonList>
                {cart.map((item) => (
                  <IonItem key={item.product.id}>
                    <IonLabel>
                      <h2>{item.product.name}</h2>
                      <p>
                        {formatPrice(item.product.sellingPrice)} each ·{' '}
                        {formatPrice(item.product.sellingPrice * item.quantity)}
                      </p>
                    </IonLabel>
                    <IonButton fill="clear" size="small" onClick={() => setQuantity(item.product.id, item.quantity - 1)}>
                      <IonIcon slot="icon-only" icon={removeOutline} />
                    </IonButton>
                    <span style={{ minWidth: 28, textAlign: 'center' }}>{item.quantity}</span>
                    <IonButton fill="clear" size="small" onClick={() => setQuantity(item.product.id, item.quantity + 1)}>
                      <IonIcon slot="icon-only" icon={addOutline} />
                    </IonButton>
                    <IonButton fill="clear" size="small" color="danger" onClick={() => removeFromCart(item.product.id)}>
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>

              <IonItem>
                <IonLabel position="stacked">Discount (optional)</IonLabel>
                <IonInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountInput}
                  onIonInput={(event) => setDiscountInput(event.detail.value || '')}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Payment method</IonLabel>
                <IonSelect
                  value={paymentMethod}
                  interface="popover"
                  onIonChange={(event) => setPaymentMethod(event.detail.value)}
                >
                  <IonSelectOption value="cash">Cash</IonSelectOption>
                  <IonSelectOption value="transfer">Transfer</IonSelectOption>
                  <IonSelectOption value="pos">POS</IonSelectOption>
                  <IonSelectOption value="other">Other</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonCard>
                <IonCardContent>
                  <p>Subtotal: {formatPrice(subtotal)}</p>
                  <p>Discount: −{formatPrice(discount)}</p>
                  <h2>Total: {formatPrice(total)}</h2>
                </IonCardContent>
              </IonCard>

              <IonButton expand="block" disabled={completing} onClick={completeSale}>
                {completing ? 'Processing...' : 'Complete Sale'}
              </IonButton>
            </>
          )}

          {lastSale && (
            <IonCard style={{ borderLeft: '4px solid var(--ion-color-success)' }}>
              <IonCardContent>
                <h3 className="app-section-title">Last sale completed</h3>
                <p>Total: {formatPrice(lastSale.total)} · {lastSale.paymentMethod}</p>
                <p className="app-text-muted">
                  {lastSale.items?.length ?? 0} line item(s) ·{' '}
                  {new Date(lastSale.createdAt).toLocaleString()}
                </p>
              </IonCardContent>
            </IonCard>
          )}

          <h3 className="app-section-title" style={{ marginTop: 'var(--app-spacing-md)' }}>
            Recent sales
          </h3>
          {sales.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No sales recorded"
              message="Sales will appear here once you start recording transactions."
            />
          ) : (
            <IonList>
              {sales.slice(0, 10).map((sale) => (
                <IonItem key={sale.id}>
                  <IonLabel>
                    <h2>{formatPrice(sale.total)}</h2>
                    <p>
                      {sale.paymentMethod} · {new Date(sale.createdAt).toLocaleString()}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
      <IonToast
        isOpen={Boolean(toastMessage)}
        message={toastMessage}
        duration={2600}
        onDidDismiss={() => setToastMessage('')}
      />
    </IonPage>
  );
}

export default Sales;
