import { useCallback, useState } from 'react';
import { IonBadge, IonContent, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonRefresher, IonRefresherContent, useIonViewWillEnter } from '@ionic/react';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import { listarMesas } from '../../services/jrvService';
import { mensajeError } from '../../utils/errores';
import type { Mesa } from '../../models';

/** R6: el veedor solo ve sus mesas asignadas (filtrado por RLS en el servidor). */
export default function MisMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setMesas(await listarMesas());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargar();
  });

  return (
    <IonPage>
      <Encabezado titulo="Mis mesas" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await cargar(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <EstadoVista cargando={cargando} error={error} reintentar={cargar} vacio={mesas.length === 0}
          mensajeVacio="Aún no tiene JRV asignadas. Contacte a su coordinador de recinto." />
        {!cargando && !error && mesas.length > 0 && (
          <IonList>
            {mesas.map((m) => (
              <div key={m.jrv_id}>
                <IonListHeader>JRV {m.numero} · {m.recinto}</IonListHeader>
                <IonItem button detail routerLink={`/acta/${m.jrv_id}/alcalde`}>
                  <IonLabel>Acta de Alcalde</IonLabel>
                  <IonBadge color={m.acta_alcalde ? 'success' : 'medium'}>{m.acta_alcalde ? 'Registrada' : 'Pendiente'}</IonBadge>
                </IonItem>
                <IonItem button detail routerLink={`/acta/${m.jrv_id}/prefecto`}>
                  <IonLabel>Acta de Prefecto</IonLabel>
                  <IonBadge color={m.acta_prefecto ? 'success' : 'medium'}>{m.acta_prefecto ? 'Registrada' : 'Pendiente'}</IonBadge>
                </IonItem>
              </div>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
