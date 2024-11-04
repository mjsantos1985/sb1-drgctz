import { create } from 'zustand';
import { getPedidos } from '../lib/db';

interface Pedido {
  id: string;
  vendedor_nome: string;
  cliente: string;
  valor: number;
  status: string;
  data: string;
  produtos: number;
}

interface PedidosStore {
  pedidos: Pedido[];
  loading: boolean;
  error: string | null;
  fetchPedidos: () => void;
}

export const usePedidosStore = create<PedidosStore>((set) => ({
  pedidos: [],
  loading: false,
  error: null,
  fetchPedidos: () => {
    try {
      set({ loading: true });
      const result = getPedidos();
      set({ pedidos: result, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar pedidos', loading: false });
    }
  }
}));