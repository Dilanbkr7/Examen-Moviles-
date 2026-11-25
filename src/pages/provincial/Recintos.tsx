import { useCallback, useState } from 'react';
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem, IonLabel,
  IonList, IonPage, IonProgressBar, IonRefresher, IonRefresherContent, IonSelect, IonSelectOption, IonSpinner, IonText,
  useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import { addOutline, barChartOutline } from 'ionicons/icons';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import CampoError from '../../components/CampoError';
import { crearRecinto, listarAvanceRecintos, listarParroquias } from '../../services/recintosService';
import { mensajeError } from '../../utils/errores';
import { FILTROS, LIMITES, limpiarEntrada } from '../../utils/entrada';
import type { AvanceRecinto, Parroquia } from '../../models';

/** R4: listar y crear recintos, ver avance de actas por recinto. */
export default function Recintos() {
  const [presentToast] = useIonToast();
  const [recintos, setRecintos] = useState<AvanceRecinto[]>([]);
  const [parroquias, setParroquias] = useState<Parroquia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ parroquia_id: 0, nombre: '', direccion: '', num_jrv: '' });
  const [errForm, setErrForm] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [r, p] = await Promise.all([listarAvanceRecintos(), listarParroquias()]);
      setRecintos(r);
      setParroquias(p);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargar();
  });

  const guardar = async () => {
    const errs: Record<string, string> = {};
    if (!form.parroquia_id) errs.parroquia = 'Seleccione la parroquia.';
    if (form.nombre.trim().length < 3) errs.nombre = 'Ingrese el nombre del recinto.';
    const n = Number(form.num_jrv);
    if (!/^\d+$/.test(form.num_jrv) || n < 1 || n > 200) errs.num_jrv = 'Número de JRV entre 1 y 200.';
    setErrForm(errs);
    if (Object.keys(errs).length) return;
    setGuardando(true);
    try {
      await crearRecinto({ parroquia_id: form.parroquia_id, nombre: form.nombre, direccion: form.direccion, num_jrv: n });
      presentToast({ message: `Recinto creado con ${n} JRV.`, duration: 2500, color: 'success' });
      setForm({ parroquia_id: 0, nombre: '', direccion: '', num_jrv: '' });
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      presentToast({ message: mensajeError(e), duration: 3500, color: 'danger' });
    } finally {
      setGuardando(false);
    }
  };

  const esperadas = recintos.reduce((a, r) => a + r.actas_esperadas, 0);
  const registradas = recintos.reduce((a, r) => a + r.actas_registradas, 0);

  return (
    <IonPage>
      <Encabezado titulo="Recintos" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await cargar(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="fila-botones ion-padding-horizontal">
          <IonButton routerLink="/provincial/dashboard"><IonIcon slot="start" icon={barChartOutline} />Dashboard</IonButton>
          <IonButton fill="outline" onClick={() => setMostrarForm(!mostrarForm)}><IonIcon slot="start" icon={addOutline} />Nuevo recinto</IonButton>
        </div>

        {mostrarForm && (
          <IonCard>
            <IonCardHeader><IonCardTitle>Nuevo recinto</IonCardTitle></IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonSelect label="Parroquia" labelPlacement="stacked" placeholder="Seleccione"
                  value={form.parroquia_id || undefined} onIonChange={(e) => setForm({ ...form, parroquia_id: Number(e.detail.value) })}>
                  {parroquias.map((p) => <IonSelectOption key={p.id} value={p.id}>{p.nombre} ({p.canton})</IonSelectOption>)}
                </IonSelect>
                <CampoError mensaje={errForm.parroquia} />
              </IonItem>
              <IonItem>
                <IonInput label="Nombre del recinto" labelPlacement="stacked" value={form.nombre}
                  onIonInput={(e) => setForm({ ...form, nombre: limpiarEntrada(e, LIMITES.recinto) })} />
                <CampoError mensaje={errForm.nombre} />
              </IonItem>
              <IonItem>
                <IonInput label="Dirección (opcional)" labelPlacement="stacked" value={form.direccion}
                  onIonInput={(e) => setForm({ ...form, direccion: limpiarEntrada(e, LIMITES.direccion) })} />
              </IonItem>
              <IonItem>
                <IonInput label="Cantidad de JRV" labelPlacement="stacked" inputmode="numeric" value={form.num_jrv}
                  onIonInput={(e) => setForm({ ...form, num_jrv: limpiarEntrada(e, LIMITES.numJrv, FILTROS.digitos) })} />
                <CampoError mensaje={errForm.num_jrv} />
              </IonItem>
              <IonButton expand="block" className="ion-margin-top" onClick={guardar} disabled={guardando}>
                {guardando ? <IonSpinner name="dots" /> : 'Guardar recinto'}
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        <EstadoVista cargando={cargando} error={error} reintentar={cargar} vacio={recintos.length === 0} mensajeVacio="No hay recintos." />
        {!cargando && !error && recintos.length > 0 && (
          <>
            <IonText><p className="ion-padding-horizontal">Avance provincial: {registradas} de {esperadas} actas ({esperadas ? Math.round((registradas / esperadas) * 100) : 0} %).</p></IonText>
            <IonList>
              {recintos.map((r) => (
                <IonItem key={r.recinto_id} button detail routerLink={`/provincial/recinto/${r.recinto_id}`}>
                  <IonLabel>
                    <h2>{r.recinto}</h2>
                    <p>{r.canton} · {r.parroquia} · {r.num_jrv} JRV</p>
                    <p>Coordinador: {r.coordinador ?? <IonText color="danger">sin asignar</IonText>}</p>
                    <p>Actas: {r.actas_registradas}/{r.actas_esperadas} · con foto: {r.actas_con_foto}</p>
                    <IonProgressBar value={r.actas_esperadas ? r.actas_registradas / r.actas_esperadas : 0} />
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
