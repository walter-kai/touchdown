import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/styles.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './providers/AuthContext';
import { LoadingProvider } from './providers/LoadingContext';
import { ScoreboardProvider } from './providers/ScoreboardContext';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Router>
      <AuthProvider>
        <LoadingProvider>
          <ScoreboardProvider>
            <App />
          </ScoreboardProvider>
        </LoadingProvider>
      </AuthProvider>
  </Router>
);

reportWebVitals();
