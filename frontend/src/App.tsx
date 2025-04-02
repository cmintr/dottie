import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Conversation from './pages/Conversation';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Navigate to="/conversation" replace />} />
                <Route path="/conversation" element={<Conversation />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
