import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  add,
  cubeOutline,
  createOutline,
  pricetagOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';
import AdjustStockModal from '../components/AdjustStockModal';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateCategory,
  updateProduct,
} from '../services/inventory';
import { ApiRequestError } from '../services/api';
import { Category, Product } from '../types';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { apiRequest } from '../services/api';

interface ProductForm {
  name: string;
  categoryId: string;
  sku: string;
  costPrice: string;
  sellingPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  imageUrl: string;
}

type ConfirmTarget =
  | { kind: 'product'; id: string; name: string }
  | { kind: 'category'; id: string; name: string }
  | null;

const emptyForm: ProductForm = {
  name: '',
  categoryId: '',
  sku: '',
  costPrice: '0',
  sellingPrice: '0',
  stockQuantity: '0',
  lowStockThreshold: '5',
  imageUrl: '',
};

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

function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [nextProducts, nextCategories] = await Promise.all([
        fetchProducts(token),
        fetchCategories(token),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Unable to load inventory.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.sku || '').toLowerCase().includes(normalizedSearch) ||
        (product.category || '').toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, products, search]);

  const lowStockCount = products.filter(
    (product) => product.stockQuantity <= product.lowStockThreshold
  ).length;

  const openAddProduct = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setEditorMode('add');
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      categoryId: product.categoryId || '',
      sku: product.sku || '',
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      stockQuantity: String(product.stockQuantity),
      lowStockThreshold: String(product.lowStockThreshold),
      imageUrl: product.imageUrl || '',
    });
    setSelectedProduct(null);
    setEditorMode('edit');
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSavingProduct(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        sku: form.sku.trim() || null,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        imageUrl: form.imageUrl.trim() || null,
      };
      if (editorMode === 'edit' && editingProduct) {
        await updateProduct(token, editingProduct.id, payload);
        setToastMessage('Product updated.');
      } else {
        await createProduct(token, payload);
        setToastMessage('Product added.');
      }
      setEditorMode(null);
      setEditingProduct(null);
      await loadData();
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Unable to save product.'));
    } finally {
      setSavingProduct(false);
    }
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !categoryName.trim()) return;
    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        await updateCategory(token, editingCategoryId, categoryName.trim());
        setToastMessage('Category updated.');
      } else {
        await createCategory(token, categoryName.trim());
        setToastMessage('Category added.');
      }
      setCategoryName('');
      setEditingCategoryId(null);
      await loadData();
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Unable to save category.'));
    } finally {
      setSavingCategory(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !confirmTarget) return;
    setDeleting(true);
    try {
      if (confirmTarget.kind === 'product') {
        await deleteProduct(token, confirmTarget.id);
        setSelectedProduct(null);
        setToastMessage('Product deleted.');
      } else {
        await deleteCategory(token, confirmTarget.id);
        if (categoryFilter === confirmTarget.id) setCategoryFilter('all');
        if (editingCategoryId === confirmTarget.id) {
          setEditingCategoryId(null);
          setCategoryName('');
        }
        setToastMessage('Category deleted. Products in it are now uncategorized.');
      }
      setConfirmTarget(null);
      await loadData();
    } catch (error) {
      setToastMessage(getErrorMessage(error, 'Unable to delete item.'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading && products.length === 0 && !loadError) {
    return <LoadingState message="Loading products..." />;
  }

  if (loadError && products.length === 0) {
    return (
      <IonPage>
        <PageHeader title="Products" />
        <IonContent>
          <ErrorState title="Couldn't load products" message={loadError} onRetry={loadData} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products${lowStockCount ? ` · ${lowStockCount} low stock` : ''}`}
        actions={
          <IonButton fill="clear" aria-label="Add product" onClick={openAddProduct}>
            <IonIcon slot="icon-only" icon={add} />
          </IonButton>
        }
      />
      <IonContent>
        <div className="app-container products-page">
          {loadError && (
            <IonText color="danger">
              <p className="inventory-error">{loadError}</p>
            </IonText>
          )}
          <IonSearchbar
            value={search}
            placeholder="Search products or SKU..."
            className="products-search"
            onIonInput={(event) => setSearch(event.detail.value || '')}
          />
          <div className="product-toolbar">
            <IonSelect
              aria-label="Filter by category"
              value={categoryFilter}
              interface="popover"
              className="product-category-filter"
              onIonChange={(event) => setCategoryFilter(event.detail.value)}
            >
              <IonSelectOption value="all">All categories</IonSelectOption>
              {categories.map((category) => (
                <IonSelectOption key={category.id} value={category.id}>
                  {category.name}
                </IonSelectOption>
              ))}
            </IonSelect>
            <IonButton fill="outline" onClick={() => setCategoryManagerOpen(true)}>
              <IonIcon slot="start" icon={pricetagOutline} />
              Categories
            </IonButton>
          </div>

          {loading && products.length > 0 && (
            <p className="inventory-refreshing">Refreshing inventory...</p>
          )}
          {products.length === 0 ? (
            <EmptyState
              icon={cubeOutline}
              title="Your inventory starts here"
              message="Add products to keep stock, prices, and low-stock alerts in one place."
              action={<IonButton onClick={openAddProduct}>Add your first product</IonButton>}
            />
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              icon={cubeOutline}
              title="No matching products"
              message="Try a different search or category filter."
            />
          ) : (
            <div className="app-grid app-grid-2">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </IonContent>

      <IonModal
        isOpen={editorMode !== null}
        onDidDismiss={() => setEditorMode(null)}
        className="inventory-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editorMode === 'edit' ? 'Edit product' : 'Add product'}</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setEditorMode(null)}>
              Cancel
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <form className="inventory-form" onSubmit={saveProduct}>
            <IonItem>
              <IonLabel position="stacked">Product name</IonLabel>
              <IonInput
                required
                maxlength={200}
                value={form.name}
                onIonInput={(event) =>
                  setForm((current) => ({ ...current, name: event.detail.value || '' }))
                }
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={form.categoryId || 'none'}
                interface="popover"
                onIonChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    categoryId: event.detail.value === 'none' ? '' : event.detail.value,
                  }))
                }
              >
                <IonSelectOption value="none">Uncategorized</IonSelectOption>
                {categories.map((category) => (
                  <IonSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">SKU (optional)</IonLabel>
              <IonInput
                maxlength={100}
                value={form.sku}
                onIonInput={(event) =>
                  setForm((current) => ({ ...current, sku: event.detail.value || '' }))
                }
              />
            </IonItem>
            <div className="inventory-form-grid">
              <IonItem>
                <IonLabel position="stacked">Cost price</IonLabel>
                <IonInput
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onIonInput={(event) =>
                    setForm((current) => ({ ...current, costPrice: event.detail.value || '' }))
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Selling price</IonLabel>
                <IonInput
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onIonInput={(event) =>
                    setForm((current) => ({ ...current, sellingPrice: event.detail.value || '' }))
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Stock quantity</IonLabel>
                <IonInput
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockQuantity}
                  onIonInput={(event) =>
                    setForm((current) => ({ ...current, stockQuantity: event.detail.value || '' }))
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Low-stock threshold</IonLabel>
                <IonInput
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.lowStockThreshold}
                  onIonInput={(event) =>
                    setForm((current) => ({
                      ...current,
                      lowStockThreshold: event.detail.value || '',
                    }))
                  }
                />
              </IonItem>
            </div>
            <IonItem>
              <IonLabel position="stacked">Image URL (optional)</IonLabel>
              <IonInput
                type="url"
                value={form.imageUrl}
                onIonInput={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.detail.value || '' }))
                }
              />
            </IonItem>
            <IonButton
              type="button"
              fill="outline"
              expand="block"
              onClick={async () => {
                try {
                  const photo = await Camera.getPhoto({
                    resultType: CameraResultType.DataUrl,
                    source: CameraSource.Prompt,
                    quality: 50,
                  });
                  if (photo.dataUrl) {
                    setCapturedPhoto(photo.dataUrl);
                  }
                } catch (err) {
                  // User cancelled or permission denied — surface gracefully.
                  const message = err instanceof Error ? err.message : '';
                  if (!/cancel/i.test(message)) {
                    setToastMessage('Camera or photo permission was denied. You can still paste an image URL.');
                  }
                }
              }}
            >
              Take or Choose Photo
            </IonButton>
            {capturedPhoto && (
              <div className="app-card" style={{ marginTop: 'var(--app-spacing-sm)' }}>
                <img
                  src={capturedPhoto}
                  alt="Selected product"
                  style={{ width: '100%', borderRadius: 8 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <IonButton
                    size="small"
                    disabled={uploadingPhoto}
                    onClick={async () => {
                      if (!token || !capturedPhoto) return;
                      setUploadingPhoto(true);
                      try {
                        const result = await apiRequest<{ status: string; data: { url: string } }>(
                          '/uploads/product-image',
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ dataUrl: capturedPhoto }),
                          }
                        );
                        setForm((current) => ({ ...current, imageUrl: result.data.url }));
                        setCapturedPhoto(null);
                        setToastMessage('Photo uploaded.');
                      } catch (err) {
                        setToastMessage(
                          err instanceof Error ? err.message : 'Photo upload failed. You can paste an image URL instead.'
                        );
                      } finally {
                        setUploadingPhoto(false);
                      }
                    }}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Use Photo'}
                  </IonButton>
                  <IonButton size="small" fill="clear" onClick={() => setCapturedPhoto(null)}>
                    Retake
                  </IonButton>
                </div>
              </div>
            )}
            <IonButton type="submit" expand="block" disabled={savingProduct}>
              {savingProduct ? 'Saving...' : editorMode === 'edit' ? 'Save changes' : 'Add product'}
            </IonButton>
          </form>
        </IonContent>
      </IonModal>

      <IonModal
        isOpen={Boolean(selectedProduct)}
        onDidDismiss={() => setSelectedProduct(null)}
        className="inventory-modal"
      >
        {selectedProduct && (
          <>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Product details</IonTitle>
                <IonButton slot="end" fill="clear" onClick={() => setSelectedProduct(null)}>
                  Done
                </IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div className="product-detail">
                {selectedProduct.imageUrl && (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                )}
                <h2>{selectedProduct.name}</h2>
                <p>{selectedProduct.category || 'Uncategorized'}</p>
                {selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold && (
                  <IonChip color="danger">
                    <IonIcon icon={warningOutline} />
                    {selectedProduct.stockQuantity === 0 ? 'Out of stock' : 'Low stock'}
                  </IonChip>
                )}
                <dl className="product-detail-list">
                  <div><dt>Selling price</dt><dd>{formatPrice(selectedProduct.sellingPrice)}</dd></div>
                  <div><dt>Cost price</dt><dd>{formatPrice(selectedProduct.costPrice)}</dd></div>
                  <div><dt>Stock quantity</dt><dd>{selectedProduct.stockQuantity}</dd></div>
                  <div><dt>Low-stock threshold</dt><dd>{selectedProduct.lowStockThreshold}</dd></div>
                  <div><dt>SKU</dt><dd>{selectedProduct.sku || 'Not set'}</dd></div>
                  {selectedProduct.imageUrl && (
                    <div><dt>Image URL</dt><dd className="product-image-url">{selectedProduct.imageUrl}</dd></div>
                  )}
                </dl>
                <div className="product-detail-actions">
                  <IonButton
                    expand="block"
                    onClick={() => openEditProduct(selectedProduct)}
                  >
                    <IonIcon slot="start" icon={createOutline} />
                    Edit product
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => {
                      setAdjustingProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <IonIcon slot="start" icon={pricetagOutline} />
                    Adjust stock
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    onClick={() =>
                      setConfirmTarget({
                        kind: 'product',
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                      })
                    }
                  >
                    <IonIcon slot="start" icon={trashOutline} />
                    Delete product
                  </IonButton>
                </div>
              </div>
            </IonContent>
          </>
        )}
      </IonModal>

      <IonModal
        isOpen={categoryManagerOpen}
        onDidDismiss={() => {
          setCategoryManagerOpen(false);
          setEditingCategoryId(null);
          setCategoryName('');
        }}
        className="inventory-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Manage categories</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setCategoryManagerOpen(false)}>
              Done
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="category-manager">
            <form className="category-form" onSubmit={saveCategory}>
              <IonItem>
                <IonLabel position="stacked">
                  {editingCategoryId ? 'Edit category name' : 'New category name'}
                </IonLabel>
                <IonInput
                  required
                  maxlength={100}
                  value={categoryName}
                  onIonInput={(event) => setCategoryName(event.detail.value || '')}
                />
              </IonItem>
              <IonButton type="submit" disabled={savingCategory}>
                {savingCategory ? 'Saving...' : editingCategoryId ? 'Save category' : 'Add category'}
              </IonButton>
              {editingCategoryId && (
                <IonButton
                  type="button"
                  fill="clear"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setCategoryName('');
                  }}
                >
                  Cancel edit
                </IonButton>
              )}
            </form>
            {categories.length === 0 ? (
              <EmptyState
                icon={pricetagOutline}
                title="No categories yet"
                message="Create categories to organize and filter your products."
              />
            ) : (
              <IonList>
                {categories.map((category) => (
                  <IonItem key={category.id}>
                    <IonLabel>{category.name}</IonLabel>
                    <IonButton
                      fill="clear"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setCategoryName(category.name);
                      }}
                    >
                      <IonIcon slot="icon-only" icon={createOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      aria-label={`Delete ${category.name}`}
                      onClick={() =>
                        setConfirmTarget({
                          kind: 'category',
                          id: category.id,
                          name: category.name,
                        })
                      }
                    >
                      <IonIcon slot="icon-only" icon={trashOutline} />
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>
        </IonContent>
      </IonModal>

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
      <IonAlert
        isOpen={Boolean(confirmTarget)}
        header={`Delete ${confirmTarget?.kind || 'item'}?`}
        message={`"${confirmTarget?.name || ''}" will be permanently deleted.`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setConfirmTarget(null) },
          { text: deleting ? 'Deleting...' : 'Delete', role: 'destructive', handler: confirmDelete },
        ]}
        onDidDismiss={() => setConfirmTarget(null)}
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

export default Products;
