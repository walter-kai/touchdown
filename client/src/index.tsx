import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/styles.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './providers/AuthContext';
import { PoolProvider } from './providers/PoolContext';
import { TrendingCoinsProvider } from './providers/TrendingCoinsContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Router>
      <AuthProvider>
        <PoolProvider>
          <TrendingCoinsProvider>
            <App />
          </TrendingCoinsProvider>
        </PoolProvider>
      </AuthProvider>
  </Router>
);

reportWebVitals();
