import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { configureRiveRuntime } from './rive/configureRuntime';
import './styles.css';

configureRiveRuntime();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
