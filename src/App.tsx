import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { EventProvider } from './store/EventContext';
import AdminPanel from './pages/AdminPanel';
import DisplayScreen from './pages/DisplayScreen';

function App() {
  return (
    <EventProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/display" element={<DisplayScreen />} />
        </Routes>
      </Router>
    </EventProvider>
  );
}

export default App;
