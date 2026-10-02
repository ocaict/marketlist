import { IonSpinner } from '@ionic/react';

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <IonSpinner name="crescent" color="primary" />
      <p className="loading-state-message">{message}</p>
    </div>
  );
}

export default LoadingState;
