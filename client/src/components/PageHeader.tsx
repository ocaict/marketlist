import { IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton } from '@ionic/react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  backHref?: string;
  actions?: ReactNode;
}

function PageHeader({ title, subtitle, backButton, backHref, actions }: PageHeaderProps) {
  return (
    <IonHeader className="ion-no-border">
      <IonToolbar>
        {backButton && (
          <IonButtons slot="start">
            <IonBackButton defaultHref={backHref || '/'} />
          </IonButtons>
        )}
        <IonTitle>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--ion-color-medium)' }}>
                {subtitle}
              </div>
            )}
          </div>
        </IonTitle>
        {actions && <IonButtons slot="end">{actions}</IonButtons>}
      </IonToolbar>
    </IonHeader>
  );
}

export default PageHeader;
