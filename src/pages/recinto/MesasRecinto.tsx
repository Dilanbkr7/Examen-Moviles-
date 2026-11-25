import { useCallback, useState } from 'react';
import {
  IonBadge, IonButton, IonContent, IonIcon, IonItem, IonLabel, IonList, IonListHeader, IonPage, IonRefresher,
  IonRefresherContent, IonSelect, IonSelectOption, IonText, useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import { useAuth } from '../../contexts/AuthContext';
import { asignarVeedor, listarMesas } from '../../services/jrvService';
import { miRecinto } from '../../services/recintosService';
import { listarPorRol } from '../../services/usuariosService';
import { mensajeError } from '../../utils/errores';
import type { Mesa, Perfil } from '../../models';

function estadoMesa(m: Mesa): { texto: string; color: string } {
  const n = Number(m.acta_alcalde) + Number(m.acta_prefecto);
  if (n === 2) return { texto: 'Completa', color: 'success' };
  if (n === 1) return { texto: 'Parcial', color: 'warning' };
  return { texto: 'Sin actas', color: 'medium' };
}

/** R5: mesas del recinto con su estado, asignacion/reasignacion de veedores y acceso a correcciones. */
export default function MesasRecinto() {
  const { perfil } = useAuth();
  const [presentToast] = useIonToast();
  const [recintoId, setRecintoId] = useState<number | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [veedores, setVeedores] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asignando, setAsignando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!perfil) return;
    setError(null);
    try {
      const rid = await miRecinto(perfil.id);
      setRecintoId(rid);
      if (rid === null) {
        setMesas([]);
        return;
      }
      const [m, v] = await Promise.all([listarMesas(rid), listarPorRol('veedor')]);
      setMesas(m);
      setVeedores(v);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [perfil]);

  useIonViewWillEnter(() => {
    cargar();
  });

  const cambiarVeedor = async (mesa: Mesa, veedorId: string) => {
    if (!perfil || !recintoId || veedorId === mesa.veedor_id) return;
    setAsignando(mesa.jrv_id);
    try {
      await asignarVeedor(mesa.jrv_id, recintoId, veedorId, perfil.id);
      presentToast({ message: mesa.veedor_id ? `JRV ${mesa.numero} reasignada.` : `Veedor asignado a la JRV ${mesa.numero}.`, duration: 2000, color: 'success' });
      await cargar();
    } catch (e) {
      presentToast({ message: mensajeError(e), duration: 3500, color: 'danger' });
    } finally {
      setAsignando(null);
    }
  };

  const completas = mesas.filter((m) => m.acta_alcalde && m.acta_prefecto).length;

  return (
    <IonPage>
      <Encabezado titulo={mesas[0]?.recinto ?? 'Mi recinto'} />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await cargar(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <IonButton expand="block" className="ion-margin" fill="outline" routerLink="/recinto/veedores">
          <IonIcon slot="start" icon={peopleOutline} /> Veedores (crear / ver)
        </IonButton>
        <EstadoVista cargando={cargando} error={error} reintentar={cargar}
          vacio={recintoId === null || mesas.length === 0}
          mensajeVacio={recintoId === null ? 'Aún no tiene un recinto asignado por el coordinador provincial.' : 'El recinto no tiene JRV.'} />
        {!cargando && !error && mesas.length > 0 && (
          <>
            <IonText color="medium"><p className="ion-padding-horizontal">{completas} de {mesas.length} mesas completas.</p></IonText>
            <IonList>
              {mesas.map((m) => {
                const est = estadoMesa(m);
                return (
                  <div key={m.jrv_id}>
                    <IonListHeader>
                      <IonLabel>JRV {m.numero}</IonLabel>
                      <IonBadge color={est.color} className="ion-margin-end">{est.texto}</IonBadge>
                    </IonListHeader>
                    <IonItem>
                      <IonSelect
                        label="Veedor"
                        labelPlacement="stacked"
                        placeholder={veedores.length ? 'Seleccione un veedor' : 'Primero cree veedores'}
                        value={m.veedor_id ?? undefined}
                        disabled={asignando === m.jrv_id || veedores.length === 0}
                        onIonChange={(e) => cambiarVeedor(m, String(e.detail.value))}
                      >
                        {veedores.map((v) => (
                          <IonSelectOption key={v.id} value={v.id}>{v.nombres} {v.apellidos} · {v.cedula}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem button detail routerLink={`/acta/${m.jrv_id}/alcalde`}>
                      <IonLabel>Acta Alcalde {m.acta_alcalde ? '(ver / corregir)' : '(pendiente)'}</IonLabel>
                    </IonItem>
                    <IonItem button detail routerLink={`/acta/${m.jrv_id}/prefecto`}>
                      <IonLabel>Acta Prefecto {m.acta_prefecto ? '(ver / corregir)' : '(pendiente)'}</IonLabel>
                    </IonItem>
                  </div>
                );
              })}
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
