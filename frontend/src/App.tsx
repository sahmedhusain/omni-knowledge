import { useState } from 'react';
import Layout from './components/Layout';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import MetricsPage from './pages/MetricsPage';

function App() {
  const [activePage, setActivePage] = useState<'search' | 'admin' | 'metrics'>('search');

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'search' && <SearchPage />}
      {activePage === 'admin' && <AdminPage />}
      {activePage === 'metrics' && <MetricsPage />}
    </Layout>
  );
}

export default App;
