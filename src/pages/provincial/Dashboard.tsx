import { useCallback, useMemo, useState } from 'react';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonItem, IonLabel, IonList, IonPage,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonText, useIonViewWillEnter,
} from '@ionic/react';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import { consolidar, obtenerResultados, obtenerUbicacionesActas } from '../../services/dashboardService';
import { listarAvanceRecintos } from '../../services/recintosService';
import { mensajeError } from '../../utils/errores';
import type { AvanceRecinto, Dignidad, ResultadoVoto, UbicacionActa } from '../../models';

/** R4: dashboard de votos por candidato, por recinto o consolidado; avance y coordenadas GPS. */
export default function Dashboard() {
  const [dignidad, setDignidad] = useState<Dignidad>('alcalde');
  const [recintoId, setRecintoId] = useState<number>(0); // 0 = consolidado
  const [resultados, setResultados] = useState<ResultadoVoto[]>([]);
  const [recintos, setRecintos] = useState<AvanceRecinto[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionActa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (d: Dignidad) => {
    setError(null);
    setCargando(true);
    try {
      const [r, a, u] = await Promise.all([obtenerResultados(d), listarAvanceRecintos(), obtenerUbicacionesActas()]);
      setResultados(r);
      setRecintos(a);
      setUbicaciones(u);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargar(dignidad);
  });

  const filas = useMemo(() => consolidar(resultados, recintoId || undefined), [resultados, recintoId]);
  const totalVotos = filas.reduce((a, f) => a + f.votos, 0);
  const esperadas = recintos.reduce((a, r) => a + r.actas_esperadas, 0);
  const registradas = recintos.reduce((a, r) => a + r.actas_registradas, 0);

  return (
    <IonPage>
      <Encabezado titulo="Dashboard" atras="/provincial" />
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { await cargar(dignidad); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>
        <IonSegment value={dignidad} onIonChange={(e) => { const d = e.detail.value as Dignidad; setDignidad(d); cargar(d); }}>
          <IonSegmentButton value="alcalde"><IonLabel>Alcaldía</IonLabel></IonSegmentButton>
          <IonSegmentButton value="prefecto"><IonLabel>Prefectura</IonLabel></IonSegmentButton>
        </IonSegment>
        <IonItem>
          <IonSelect label="Ámbito" value={recintoId} onIonChange={(e) => setRecintoId(Number(e.detail.value))}>
            <IonSelectOption value={0}>Consolidado (todos los recintos)</IonSelectOption>
            {recintos.map((r) => <IonSelectOption key={r.recinto_id} value={r.recinto_id}>{r.recinto}</IonSelectOption>)}
          </IonSelect>
        </IonItem>

        <EstadoVista cargando={cargando} error={error} reintentar={() => cargar(dignidad)} />
        {!cargando && !error && (
          <>
            <IonCard>
              <IonCardHeader><IonCardTitle>Votos por candidato</IonCardTitle></IonCardHeader>
              <IonCardContent>
                <p>Actas registradas: {registradas} de {esperadas} ({esperadas ? Math.round((registradas / esperadas) * 100) : 0} %) · votos válidos contados: {totalVotos}</p>
                {filas.length === 0 && <IonText color="medium"><p>Aún no hay actas de esta dignidad.</p></IonText>}
                {filas.map((f) => (
                  <div key={f.candidatura_id} className="barra-fila">
                    <div className="barra-etiqueta">
                      <strong>{f.siglas}</strong> {f.nombre_candidato}
                      <span className="barra-valor">{f.votos} ({f.porcentaje} %)</span>
                    </div>
                    <div className="barra-fondo"><div className="barra" style={{ width: `${f.porcentaje}%` }} /></div>
                  </div>
                ))}
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader><IonCardTitle>Coordenadas GPS de las actas</IonCardTitle></IonCardHeader>
              <IonCardContent>
                {ubicaciones.length === 0 && <p>Sin actas registradas.</p>}
                <IonList>
                  {ubicaciones.map((u) => (
                    <IonItem key={u.acta_id}>
                      <IonLabel>
                        <h3>{u.recinto} · JRV {u.jrv} · {u.dignidad}</h3>
                        {u.latitud !== null && u.longitud !== null ? (
                          <p>
                            {u.latitud.toFixed(6)}, {u.longitud.toFixed(6)} (±{u.precision_gps ?? '?'} m) ·{' '}
                            <a href={`https://maps.google.com/?q=${u.latitud},${u.longitud}`} target="_blank" rel="noreferrer">ver en mapa</a>
                          </p>
                        ) : <p>Sin coordenadas</p>}
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
