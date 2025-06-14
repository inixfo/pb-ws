declare module 'react-hot-toast' {
  export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

  export interface ToastOptions {
    duration?: number;
    position?: ToastPosition;
    className?: string;
    style?: React.CSSProperties;
    icon?: React.ReactNode;
  }

  export function toast(
    message: string | React.ReactNode,
    options?: ToastOptions
  ): string;

  export namespace toast {
    function success(
      message: string | React.ReactNode,
      options?: ToastOptions
    ): string;
    function error(
      message: string | React.ReactNode,
      options?: ToastOptions
    ): string;
    function loading(
      message: string | React.ReactNode,
      options?: ToastOptions
    ): string;
    function dismiss(toastId?: string): void;
  }

  export function Toaster(props?: {
    position?: ToastPosition;
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerClassName?: string;
    containerStyle?: React.CSSProperties;
  }): JSX.Element;

  export default toast;
} 