import { IonCard, IonCardContent, IonChip, IonIcon } from '@ionic/react';
import { cube, warning } from 'ionicons/icons';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const isLowStock = product.stockQuantity <= product.lowStockThreshold;

  return (
    <IonCard
      className={`product-card${isLowStock ? ' product-card-low-stock' : ''}`}
      button
      onClick={onClick}
    >
      <IonCardContent>
        <div className="product-card-content">
          <div className="product-card-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" />
            ) : (
              <IonIcon icon={cube} />
            )}
          </div>
          <div className="product-card-info">
            <h3 className="product-card-name">{product.name}</h3>
            <span className="product-card-category">{product.category || 'Uncategorized'}</span>
            <div className="product-card-footer">
              <span className="product-card-price">
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(product.sellingPrice)}
              </span>
              <IonChip
                color={isLowStock ? 'danger' : 'success'}
                className="product-card-stock"
              >
                {isLowStock && <IonIcon icon={warning} className="stock-warning-icon" />}
                {product.stockQuantity} in stock
              </IonChip>
            </div>
            {isLowStock && (
              <span className="product-low-stock-label">
                {product.stockQuantity === 0 ? 'Out of stock' : 'Low stock'}
              </span>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

export default ProductCard;
