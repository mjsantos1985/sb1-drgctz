import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { processXML } from '../lib/xmlParser';
import { usePedidosStore } from '../store/pedidosStore';
import { useDB } from '../lib/db';

interface XMLPreview {
  vendedor: {
    cnpj: string;
    nome: string;
    email: string;
  };
  cliente: string;
  produtos: Array<{
    nome: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  total: number;
}

const ImportXML: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [xmlPreview, setXmlPreview] = useState<XMLPreview | null>(null);
  const fetchPedidos = usePedidosStore(state => state.fetchPedidos);
  const initDB = useDB(state => state.init);

  const validateXMLFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      throw new Error('O arquivo deve ter extensão .xml');
    }
    if (file.size === 0) {
      throw new Error('O arquivo está vazio');
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('O arquivo é muito grande. Limite máximo: 5MB');
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await handleFiles(files);
  };

  const previewXML = async (content: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      
      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        throw new Error("XML inválido ou mal formatado");
      }

      const preview: XMLPreview = {
        vendedor: {
          cnpj: xmlDoc.querySelector('CNPJ')?.textContent || '',
          nome: xmlDoc.querySelector('xNome')?.textContent || '',
          email: xmlDoc.querySelector('email')?.textContent || '',
        },
        cliente: xmlDoc.querySelector('dest xNome')?.textContent || '',
        produtos: Array.from(xmlDoc.querySelectorAll('det')).map(det => ({
          nome: det.querySelector('xProd')?.textContent || '',
          quantidade: Number(det.querySelector('qCom')?.textContent || 0),
          valorUnitario: Number(det.querySelector('vUnCom')?.textContent || 0),
        })),
        total: Number(xmlDoc.querySelector('vNF')?.textContent || 0),
      };

      // Validate preview data
      if (!preview.vendedor.cnpj || !preview.vendedor.nome || !preview.vendedor.email) {
        throw new Error('Dados do vendedor incompletos no XML');
      }
      if (!preview.cliente) {
        throw new Error('Dados do cliente incompletos no XML');
      }
      if (preview.produtos.length === 0) {
        throw new Error('Nenhum produto encontrado no XML');
      }
      if (preview.total <= 0) {
        throw new Error('Valor total inválido no XML');
      }

      setXmlPreview(preview);
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
      throw new Error(err instanceof Error ? err.message : 'Erro ao gerar preview do arquivo XML');
    }
  };

  const handleFiles = async (files: File[]) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);
    setXmlPreview(null);

    try {
      const xmlFiles = files.filter(file => file.name.toLowerCase().endsWith('.xml'));
      
      if (xmlFiles.length === 0) {
        throw new Error("Por favor, selecione apenas arquivos XML.");
      }

      await initDB();
      
      for (const file of xmlFiles) {
        try {
          validateXMLFile(file);
          const content = await file.text();
          await previewXML(content);
          const result = await processXML(content);
          
          if (!result.success) {
            throw new Error(result.error || 'Erro ao processar arquivo XML');
          }
        } catch (fileError) {
          throw new Error(`Erro no arquivo ${file.name}: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`);
        }
      }

      setSuccess(`${xmlFiles.length} arquivo(s) processado(s) com sucesso!`);
      fetchPedidos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivos');
      setXmlPreview(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Importar XML de Pedidos</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 rounded-md flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={processing}
            />
            
            {processing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-lg text-gray-700">Processando arquivos...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg text-gray-700">
                  Arraste e solte seus arquivos XML aqui
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  ou clique para selecionar
                </p>
              </>
            )}
          </div>

          {xmlPreview && (
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-medium">Preview do XML</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Dados do Vendedor</h4>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p><span className="font-medium">CNPJ:</span> {xmlPreview.vendedor.cnpj}</p>
                    <p><span className="font-medium">Nome:</span> {xmlPreview.vendedor.nome}</p>
                    <p><span className="font-medium">Email:</span> {xmlPreview.vendedor.email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cliente</h4>
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <p>{xmlPreview.cliente}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Produtos</h4>
                  <div className="bg-white rounded-md shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Produto</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor Un.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {xmlPreview.produtos.map((produto, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">{produto.nome}</td>
                            <td className="px-3 py-2 text-sm text-right">{produto.quantidade}</td>
                            <td className="px-3 py-2 text-sm text-right">
                              {produto.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {xmlPreview.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Instruções:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Aceita apenas arquivos no formato XML</li>
            <li>Os arquivos devem seguir o padrão de nota fiscal eletrônica</li>
            <li>Múltiplos arquivos podem ser importados simultaneamente</li>
            <li>O sistema processará automaticamente os pedidos por vendedor</li>
            <li>Tamanho máximo por arquivo: 5MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportXML;