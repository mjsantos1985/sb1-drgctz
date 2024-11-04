import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import ImportXML from './components/ImportXML';
import Pedidos from './components/Pedidos';
import Produtos from './components/Produtos';
import Vendedores from './components/Vendedores';
import Sidebar from './components/Sidebar';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={isMenuOpen} 
        setIsOpen={setIsMenuOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">
              Sistema de Gestão - Transportadora de Alimentos
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'import' && <ImportXML />}
          {activeTab === 'pedidos' && <Pedidos />}
          {activeTab === 'produtos' && <Produtos />}
          {activeTab === 'vendedores' && <Vendedores />}
        </main>
      </div>
    </div>
  );
}

export default App;