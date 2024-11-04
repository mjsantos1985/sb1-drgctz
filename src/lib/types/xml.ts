export interface NFEEmit {
  CNPJ: string;
  xNome: string;
  email?: string;
  enderEmit?: {
    xLgr: string;
    nro: string;
    xBairro: string;
    xMun: string;
    UF: string;
    CEP: string;
  };
}

export interface NFEDest {
  CNPJ?: string;
  CPF?: string;
  xNome: string;
  email?: string;
  enderDest?: {
    xLgr: string;
    nro: string;
    xBairro: string;
    xMun: string;
    UF: string;
    CEP: string;
  };
}

export interface NFEProduto {
  cProd: string;
  xProd: string;
  NCM: string;
  CFOP: string;
  uCom: string;
  qCom: string;
  vUnCom: string;
  vProd: string;
  uTrib: string;
  qTrib: string;
  vUnTrib: string;
}

export interface NFETotal {
  ICMSTot: {
    vNF: string;
    vProd: string;
    vDesc?: string;
    vICMS?: string;
    vST?: string;
  };
}

export interface NFEData {
  nfeProc: {
    NFe: {
      infNFe: {
        ide: {
          dhEmi: string;
          nNF: string;
          serie: string;
        };
        emit: NFEEmit;
        dest: NFEDest;
        det: Array<{
          prod: NFEProduto;
          imposto?: {
            ICMS?: any;
            IPI?: any;
            PIS?: any;
            COFINS?: any;
          };
        }>;
        total: NFETotal;
      };
    };
    protNFe?: {
      infProt: {
        chNFe: string;
        dhRecbto: string;
        nProt: string;
        cStat: string;
        xMotivo: string;
      };
    };
  };
}