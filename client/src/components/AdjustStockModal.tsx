import { FormEvent, useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { adjustProductStock } from '../services/inventory';
import { ApiRequestError } from '../services/api';
import { Product } from '../types';

interface AdjustStockModalProps {
  product: Product | null;
  token: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const fieldMessages = Object.entries(error.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
    return fieldMessages || error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function AdjustStockModal({ product, token, onClose, onSaved, onError }: AdjustStockModalProps) {
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setNewQuantity(String(product.stockQuantity));
      setReason('');
    }
  }, [product]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;

    const parsed = Number(newQuantity);
    if (newQuantity.trim() === '' || !Number.isInteger(parsed) || parsed < 0) {
      onError('Enter a valid non-negative whole number for the new quantity.');
      return;
    }
    if (!reason.trim()) {
      onError('Enter a reason for the adjustment.');
      return;
    }

    setSaving(true);
    try {
      await adjustProductStock(token, product.id, parsed, reason.trim());
      onSaved(`Stock for "${product.name}" updated to ${parsed}.`);
      onClose();
    } catch (error) {
      onError(getErrorMessage(error, 'Unable to adjust stock.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal
      isOpen={Boolean(product)}
      onDidDismiss={onClose}
      className="inventory-modal"
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Adjust stock</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            Cancel
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {product && (
          <form className="inventory-form" onSubmit={save}>
            <IonItem>
              <IonLabel position="stacked">Product</IonLabel>
              <IonInput value={product.name} readonly />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Current stock</IonLabel>
              <IonInput value={String(product.stockQuantity)} readonly />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">New quantity</IonLabel>
              <IonInput
                required
                type="number"
                min="0"
                step="1"
                value={newQuantity}
                onIonInput={(event) => setNewQuantity(event.detail.value || '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Reason</IonLabel>
              <IonInput
                required
                maxlength={200}
                placeholder="e.g. Restock, damaged goods, stock count"
                value={reason}
                onIonInput={(event) => setReason(event.detail.value || '')}
              />
            </IonItem>
            <IonButton type="submit" expand="block" disabled={saving}>
              {saving ? 'Saving...' : 'Save adjustment'}
            </IonButton>
          </form>
        )}
      </IonContent>
    </IonModal>
  );
}

export default AdjustStockModal;
