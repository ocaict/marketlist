import { IonIcon } from '@ionic/react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <IonIcon icon={icon} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
