import React from 'react';
import ReactDOM from 'react-dom/client';

// Simple test component
const TestApp = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#4285F4' }}>Dottie AI Assistant - Test Page</h1>
      
      <div style={{ 
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Mock Authentication</h2>
        <button 
          style={{
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign in with Google
        </button>
      </div>
      
      <div style={{ 
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Chat Interface</h2>
        <div style={{
          border: '1px solid #eee',
          borderRadius: '8px',
          height: '300px',
          padding: '10px',
          marginBottom: '10px',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>Dottie</div>
            <div style={{ padding: '8px', backgroundColor: '#f1f3f4', borderRadius: '8px', display: 'inline-block' }}>
              Hello! I'm Dottie, your AI assistant. How can I help you today?
            </div>
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <input 
            type="text" 
            placeholder="Type your message here..."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              marginRight: '10px'
            }}
          />
          <button
            style={{
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>
      
      <div style={{ 
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        <h2>Test Commands</h2>
        <ul>
          <li>"Show me my recent emails"</li>
          <li>"What's on my calendar today?"</li>
          <li>"Create a spreadsheet for Q1 sales data"</li>
        </ul>
      </div>
    </div>
  );
};

// Mount the test app
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  );
}

export default TestApp;
