import React from 'react';
import { Upload, Truck, Users, Package, BarChart, Box } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'import', icon: Upload, label: 'Importar XML' },
    { id: 'pedidos', icon: Package, label: 'Pedidos' },
    { id: 'produtos', icon: Box, label: 'Produtos' },
    { id: 'vendedores', icon: Users, label: 'Vendedores' },
    { id: 'entregas', icon: Truck, label: 'Entregas' },
    { id: 'relatorios', icon: BarChart, label: 'Relatórios' },
  ];

  return (
    <aside
      className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 w-64 transition duration-300 transform bg-gray-900 overflow-y-auto lg:translate-x-0 lg:static lg:inset-0 z-50`}
    >
      <div className="flex items-center justify-center mt-8">
        <div className="flex items-center">
          <Truck className="h-12 w-12 text-green-500" />
          <span className="text-white text-2xl mx-2 font-semibold">LogiFood</span>
        </div>
      </div>

      <nav className="mt-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsOpen(false);
            }}
            className={`flex items-center w-full mt-4 py-2 px-6 cursor-pointer ${
              activeTab === item.id
                ? 'bg-gray-700 bg-opacity-25 text-gray-100 border-l-4 border-green-500'
                : 'text-gray-300 hover:bg-gray-700 hover:bg-opacity-25 hover:text-gray-100'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="mx-3">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;