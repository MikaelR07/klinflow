import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import ProductClient from './pages/ProductClient.jsx';
import ProductAgent from './pages/ProductAgent.jsx';
import ProductFleet from './pages/ProductFleet.jsx';
import ProductHub from './pages/ProductHub.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Ecosystem from './pages/Ecosystem.jsx';
import EcosystemGallery from './pages/EcosystemGallery.jsx';
import ForResidents from './pages/ForResidents.jsx';
import ForAgents from './pages/ForAgents.jsx';
import ForBusinesses from './pages/ForBusinesses.jsx';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500/30">
        <Toaster position="top-right" expand={false} richColors />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/system" element={<HowItWorks />} />
          <Route path="/products/client" element={<ProductClient />} />
          <Route path="/products/agent" element={<ProductAgent />} />
          <Route path="/products/fleet" element={<ProductFleet />} />
          <Route path="/products/hub" element={<ProductHub />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ecosystem" element={<Ecosystem />} />
          <Route path="/gallery" element={<EcosystemGallery />} />
          <Route path="/for-residents" element={<ForResidents />} />
          <Route path="/for-agents" element={<ForAgents />} />
          <Route path="/for-businesses" element={<ForBusinesses />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
