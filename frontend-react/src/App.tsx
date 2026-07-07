import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-sans">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes here later */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
