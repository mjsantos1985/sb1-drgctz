import initSqlJs from 'sql.js';
import { create } from 'zustand';

interface DBState {
  db: any;
  initialized: boolean;
  init: () => Promise<void>;
}

export const useDB = create<DBState>((set) => ({
  db: null,
  initialized: false,
  init: async () => {
    if (!useDB.getState().initialized) {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      const db = new SQL.Database();
      
      // Initialize tables
      db.run(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id TEXT PRIMARY KEY,
          vendedor_id TEXT,
          cliente TEXT,
          valor REAL,
          status TEXT,
          data TEXT,
          produtos INTEGER,
          FOREIGN KEY (vendedor_id) REFERENCES vendedores (id)
        );

        CREATE TABLE IF NOT EXISTS vendedores (
          id TEXT PRIMARY KEY,
          nome TEXT,
          email TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS produtos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo TEXT UNIQUE,
          nome TEXT NOT NULL,
          descricao TEXT,
          unidade TEXT,
          preco_unitario REAL,
          estoque INTEGER DEFAULT 0,
          data_cadastro TEXT,
          ultima_atualizacao TEXT
        );

        CREATE TABLE IF NOT EXISTS produtos_pedido (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pedido_id TEXT,
          produto_id INTEGER,
          quantidade INTEGER,
          valor_unitario REAL,
          FOREIGN KEY (pedido_id) REFERENCES pedidos (id),
          FOREIGN KEY (produto_id) REFERENCES produtos (id)
        );
      `);

      set({ db, initialized: true });
    }
  }
}));

// Existing functions...
export const insertVendedor = (vendedor: { id: string; nome: string; email: string }) => {
  const { db } = useDB.getState();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO vendedores (id, nome, email)
    VALUES (?, ?, ?)
  `);
  stmt.run([vendedor.id, vendedor.nome, vendedor.email]);
  stmt.free();
};

export const insertPedido = (pedido: {
  id: string;
  vendedor_id: string;
  cliente: string;
  valor: number;
  status: string;
  data: string;
  produtos: number;
}) => {
  const { db } = useDB.getState();
  const stmt = db.prepare(`
    INSERT INTO pedidos (id, vendedor_id, cliente, valor, status, data, produtos)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    pedido.id,
    pedido.vendedor_id,
    pedido.cliente,
    pedido.valor,
    pedido.status,
    pedido.data,
    pedido.produtos
  ]);
  stmt.free();
};

// New Product functions
export const insertProduto = (produto: {
  codigo: string;
  nome: string;
  descricao?: string;
  unidade: string;
  preco_unitario: number;
  estoque: number;
}) => {
  const { db } = useDB.getState();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO produtos (codigo, nome, descricao, unidade, preco_unitario, estoque, data_cadastro, ultima_atualizacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    produto.codigo,
    produto.nome,
    produto.descricao || '',
    produto.unidade,
    produto.preco_unitario,
    produto.estoque,
    now,
    now
  ]);
  stmt.free();
};

export const updateProduto = (id: number, produto: {
  codigo?: string;
  nome?: string;
  descricao?: string;
  unidade?: string;
  preco_unitario?: number;
  estoque?: number;
}) => {
  const { db } = useDB.getState();
  const updates = Object.entries(produto)
    .filter(([_, value]) => value !== undefined)
    .map(([key]) => `${key} = ?`)
    .join(', ');

  const values = Object.entries(produto)
    .filter(([_, value]) => value !== undefined)
    .map(([_, value]) => value);

  const stmt = db.prepare(`
    UPDATE produtos 
    SET ${updates}, ultima_atualizacao = ?
    WHERE id = ?
  `);
  stmt.run([...values, new Date().toISOString(), id]);
  stmt.free();
};

export const deleteProduto = (id: number) => {
  const { db } = useDB.getState();
  const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
  stmt.run([id]);
  stmt.free();
};

export const getProdutos = () => {
  const { db } = useDB.getState();
  return db.exec(`
    SELECT * FROM produtos 
    ORDER BY nome ASC
  `)[0]?.values.map((row: any[]) => ({
    id: row[0],
    codigo: row[1],
    nome: row[2],
    descricao: row[3],
    unidade: row[4],
    preco_unitario: row[5],
    estoque: row[6],
    data_cadastro: row[7],
    ultima_atualizacao: row[8]
  })) || [];
};

export const getProdutoById = (id: number) => {
  const { db } = useDB.getState();
  const result = db.exec('SELECT * FROM produtos WHERE id = ?', [id]);
  if (!result[0]) return null;
  
  const row = result[0].values[0];
  return {
    id: row[0],
    codigo: row[1],
    nome: row[2],
    descricao: row[3],
    unidade: row[4],
    preco_unitario: row[5],
    estoque: row[6],
    data_cadastro: row[7],
    ultima_atualizacao: row[8]
  };
};

// Update existing functions
export const insertProdutoPedido = async (produto: {
  pedido_id: string;
  produto: string;
  quantidade: number;
  valor_unitario: number;
}) => {
  const { db } = useDB.getState();
  
  // First, ensure the product exists in the produtos table
  let produtoId;
  const produtoResult = db.exec('SELECT id FROM produtos WHERE nome = ?', [produto.produto]);
  
  if (!produtoResult[0]) {
    // If product doesn't exist, create it
    const stmt = db.prepare(`
      INSERT INTO produtos (codigo, nome, unidade, preco_unitario, estoque, data_cadastro, ultima_atualizacao)
      VALUES (?, ?, 'UN', ?, 0, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run([`PRD${Date.now()}`, produto.produto, produto.valor_unitario, now, now]);
    stmt.free();
    
    produtoId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  } else {
    produtoId = produtoResult[0].values[0][0];
  }

  // Then insert the produto_pedido record
  const stmt = db.prepare(`
    INSERT INTO produtos_pedido (pedido_id, produto_id, quantidade, valor_unitario)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run([produto.pedido_id, produtoId, produto.quantidade, produto.valor_unitario]);
  stmt.free();
};

export const getPedidos = () => {
  const { db } = useDB.getState();
  return db.exec(`
    SELECT p.*, v.nome as vendedor_nome
    FROM pedidos p
    JOIN vendedores v ON p.vendedor_id = v.id
    ORDER BY p.data DESC
  `)[0]?.values.map((row: any[]) => ({
    id: row[0],
    vendedor_id: row[1],
    cliente: row[2],
    valor: row[3],
    status: row[4],
    data: row[5],
    produtos: row[6],
    vendedor_nome: row[7]
  })) || [];
};

export const getPedidosByVendedor = (vendedorId: string) => {
  const { db } = useDB.getState();
  return db.exec(`
    SELECT p.*, v.nome as vendedor_nome
    FROM pedidos p
    JOIN vendedores v ON p.vendedor_id = v.id
    WHERE v.id = ?
    ORDER BY p.data DESC
  `, [vendedorId])[0]?.values.map((row: any[]) => ({
    id: row[0],
    vendedor_id: row[1],
    cliente: row[2],
    valor: row[3],
    status: row[4],
    data: row[5],
    produtos: row[6],
    vendedor_nome: row[7]
  })) || [];
};