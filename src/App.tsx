import React from 'react';
import { ProductProvider } from './context/ProductContext';
import { ProductSettingsProvider } from './context/ProductSettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import { A11yProvider } from './components/A11yProvider';
import Layout from './components/Layout';
import { initSentry } from './monitoring/sentry';

// Initialize Sentry in production
if (import.meta.env.PROD) {
  initSentry();
}

function App() {
  return (
    <ErrorBoundary>
      <A11yProvider>
        <ProductSettingsProvider>
          <ProductProvider>
            <Layout />
          </ProductProvider>
        </ProductSettingsProvider>
      </A11yProvider>
    </ErrorBoundary>
  );
}

export default App;