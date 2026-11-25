// Estado de conectividad mediante @capacitor/network (ADR-004).
import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

export async function hayConexion(): Promise<boolean> {
  const estado = await Network.getStatus();
  return estado.connected;
}

/** Hook: devuelve true/false segun haya conexion, y se actualiza al cambiar. */
export function useConexion(): boolean {
  const [conectado, setConectado] = useState(true);
  useEffect(() => {
    let activo = true;
    Network.getStatus().then((s) => activo && setConectado(s.connected));
    const sub = Network.addListener('networkStatusChange', (s) => setConectado(s.connected));
    return () => {
      activo = false;
      sub.then((h) => h.remove());
    };
  }, []);
  return conectado;
}
