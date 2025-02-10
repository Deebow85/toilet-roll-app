import React, { useState, useEffect } from 'react';
import { Gauge, Table, Settings, Info, Users, Wind, MessageCircle, ClipboardList, Wrench } from 'lucide-react';
import ShiftRota from './components/ShiftRota';
import InfoTroubleshooting from './components/InfoTroubleshooting';
import ProductGradeChange from './components/ProductGradeChange';
import { ProductProvider } from './context/ProductContext';
import { ProductSettingsProvider } from './context/ProductSettingsContext';
import ProductSettings from './components/ProductSettings';
import SpeedProduction from './components/SpeedProduction';
import Downstream from './components/Downstream';
import Unwinds from './components/Unwinds';
import ActualLogs from './components/ActualLogs';
import Threads from './components/Threads';
import Tensions from './components/Tensions';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState('Speed / Production');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    { name: 'Speed / Production', icon: <Gauge className="w-4 h-4" /> },
    { name: 'Tables', icon: <Table className="w-4 h-4" /> },
    { name: 'Product / Settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Grade/Product Change', icon: <ClipboardList className="w-4 h-4" /> },
    { name: 'Tensions', icon: <Wind className="w-4 h-4" /> },
    { name: 'Downstream', icon: <Wind className="w-4 h-4 rotate-180" /> },
    { name: 'Unwinds', icon: <Wind className="w-4 h-4" /> },
    { name: 'Threads', icon: <Wrench className="w-4 h-4" /> },
    { name: 'Info / Troubleshooting', icon: <Info className="w-4 h-4" /> },
    { name: 'Shift Rota', icon: <Users className="w-4 h-4" /> },
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case 'Shift Rota':
        return <ShiftRota />;
      case 'Info / Troubleshooting':
        return <InfoTroubleshooting />;
      case 'Grade/Product Change':
        return <ProductGradeChange />;
      case 'Product / Settings':
        return <ProductSettings />;
      case 'Speed / Production':
        return <SpeedProduction />;
      case 'Downstream':
        return <Downstream />;
      case 'Unwinds':
        return <Unwinds />;
      case 'Tables':
        return <ActualLogs />;
      case 'Threads':
        return <Threads />;
      case 'Tensions':
        return <Tensions />;
      default:
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{currentPage} Content</h2>
            <p className="text-gray-600">Content for {currentPage} will be added here.</p>
          </div>
        );
    }
  };

  return (
    <ProductSettingsProvider>
      <ProductProvider>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Left Navigation */}
          <nav className="w-56 bg-indigo-800 text-white p-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setCurrentPage(item.name)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentPage === item.name
                      ? 'bg-indigo-900 text-white'
                      : 'hover:bg-indigo-700'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <header className="bg-white shadow-md">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-gray-700">Line 5</div>
                  <div className="text-2xl font-bold text-indigo-800">{currentPage}</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {currentTime.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
              {renderPageContent()}
            </main>
          </div>
        </div>
      </ProductProvider>
    </ProductSettingsProvider>
  );
}

export default App;