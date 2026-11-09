// Leitura/gravação do localStorage pensada para o React (useSyncExternalStore):
// funciona no servidor (sem localStorage), não gera diferença na hidratação e
// avisa os componentes assim que algo muda, nesta aba ou em outra.
const ouvintes = new Set<() => void>();

export function assinarArmazenamento(aviso: () => void) {
  ouvintes.add(aviso);
  const aoOutraAba = (e: StorageEvent) => {
    if (e.storageArea === localStorage) aviso();
  };
  window.addEventListener("storage", aoOutraAba);
  return () => {
    ouvintes.delete(aviso);
    window.removeEventListener("storage", aoOutraAba);
  };
}

export function lerBruto(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null; // navegador sem armazenamento
  }
}

export function gravarBruto(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: segue sem memória */
  }
  ouvintes.forEach((aviso) => aviso());
}
