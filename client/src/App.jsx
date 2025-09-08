// src/App.jsx

import React from 'react';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  // App is now cleaner. All logic is in AppRoutes and AuthContext.
  return <AppRoutes />;
}