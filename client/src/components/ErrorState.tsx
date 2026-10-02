import { IonIcon } from '@ionic/react';
import { alertCircle, refresh } from 'ionicons/icons';
import { ReactNode } from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  children,
}: ErrorStateProps) {
  return (
    <div className="error-state">
      <div className="error-state-icon">
        <IonIcon icon={alertCircle} />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <IonIcon icon={refresh} className="error-state-retry" onClick={onRetry} />
      )}
      {children}
    </div>
  );
}

export default ErrorState;
