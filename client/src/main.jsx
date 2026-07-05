import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<GoogleOAuthProvider
			clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PENDING_CLIENT_ID'}
		>
			<ThemeProvider>
				<BrowserRouter>
					<AuthProvider>
						<SocketProvider>
							<App />
						</SocketProvider>
					</AuthProvider>
				</BrowserRouter>
			</ThemeProvider>
		</GoogleOAuthProvider>
	</React.StrictMode>,
);

