import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EventProvider } from './store/EventContext';
import AdminPanel from './pages/AdminPanel';
import DisplayScreen from './pages/DisplayScreen';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <EventProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/display" element={<DisplayScreen />} />
        </Routes>
      </Router>
    </EventProvider>
  );
}

export default App;
