import { IonButton } from '@ionic/react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  fullWidth?: boolean;
  color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  fill?: 'solid' | 'outline' | 'clear';
  size?: 'small' | 'default' | 'large';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

function Button({ children, fullWidth, className = '', color, fill, size, onClick, disabled, type }: ButtonProps) {
  return (
    <IonButton
      className={`${fullWidth ? 'button-full-width' : ''} ${className}`}
      expand={fullWidth ? 'full' : undefined}
      color={color}
      fill={fill}
      size={size}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </IonButton>
  );
}

export default Button;
