import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../tailwind.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';

const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
