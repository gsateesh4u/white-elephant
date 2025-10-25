import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ParticipantViewApp from './ParticipantView.jsx';
import HostSummaryApp from './HostSummary.jsx';
import './styles.css';

const path = window.location.pathname.toLowerCase();
const isParticipantView = path === '/participants' || path.startsWith('/participants/');
const isSummaryView = path === '/summary' || path.startsWith('/summary');

let RootComponent;
if (isParticipantView) {
  RootComponent = ParticipantViewApp;
} else if (isSummaryView) {
  RootComponent = HostSummaryApp;
} else {
  RootComponent = App;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
