import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/styles.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './providers/AuthContext';
import { LoadingProvider } from './providers/LoadingContext';
import { LeagueProvider } from './providers/LeagueContext';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Router>
    <LeagueProvider>
      <AuthProvider>
        <LoadingProvider>
            <App />
        </LoadingProvider>
      </AuthProvider>
    </LeagueProvider>
  </Router>
);

reportWebVitals();
