export interface ToastProps {
  isOpen: boolean;
  title: string;
  description: string;
  duration?: number;
  onClose: () => void;
}