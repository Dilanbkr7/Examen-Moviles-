import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonAccordion, IonAccordionGroup, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonItem,
  IonLabel, IonList, IonPage, IonProgressBar, IonSelect, IonSelectOption, useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import FormularioUsuario from '../../components/FormularioUsuario';
import { useAuth } from '../../contexts/AuthContext';
import { asignarCoordinador, coordinadoresAsignados, obtenerAvanceRecinto } from '../../services/recintosService';
import { listarMesas } from '../../services/jrvService';
import { listarPorRol } from '../../services/usuariosService';
import { mensajeError } from '../../utils/errores';
import type { AvanceRecinto, Mesa, Perfil } from '../../models';

/** R4: crear y asignar el coordinador del recinto; ver mesas y su avance. */
export default function RecintoDetalle() {
  const { id } = useParams<{ id: string }>();
  const recintoId = Number(id);
  const { perfil } = useAuth();
  const [presentToast] = useIonToast();
  const [avance, setAvance] = useState<AvanceRecinto | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [coordinadores, setCoordinadores] = useState<Perfil[]>([]);
  const [asignados, setAsignados] = useState<Map<string, number>>(new Map());
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [a, m, c, asig] = await Promise.all([
        obtenerAvanceRecinto(recintoId), listarMesas(recintoId), listarPorRol('coordinador_recinto'), coordinadoresAsignados(),
      ]);
      setAvance(a);
      setMesas(m);
      setCoordinadores(c);
      setAsignados(asig);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [recintoId]);

  useIonViewWillEnter(() => {
    cargar();
  });

  const coordinadorActual = [...asignados.entries()].find(([, r]) => r === recintoId)?.[0];
  // Disponibles: sin recinto, o el actual de este recinto
  const disponibles = coordinadores.filter((c) => !asignados.has(c.id) || asignados.get(c.id) === recintoId);

  const asignar = async (usuarioId: string) => {
    if (!perfil || usuarioId === coordinadorActual) return;
    setGuardando(true);
    try {
      await asignarCoordinador(recintoId, usuarioId, perfil.id);
      presentToast({ message: 'Coordinador asignado al recinto.', duration: 2500, color: 'success' });
      await cargar();
    } catch (e) {
      presentToast({ message: mensajeError(e), duration: 3500, color: 'danger' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <IonPage>
      <Encabezado titulo={avance?.recinto ?? 'Recinto'} atras="/provincial" />
      <IonContent>
        <EstadoVista cargando={cargando} error={error} reintentar={cargar} vacio={!avance} mensajeVacio="Recinto no encontrado." />
        {!cargando && !error && avance && (
          <>
            <IonCard>
              <IonCardHeader><IonCardTitle>Avance</IonCardTitle></IonCardHeader>
              <IonCardContent>
                <p>{avance.canton} · {avance.parroquia} · {avance.num_jrv} JRV</p>
                <p>Actas registradas: {avance.actas_registradas} de {avance.actas_esperadas} · con foto: {avance.actas_con_foto}</p>
                <IonProgressBar value={avance.actas_esperadas ? avance.actas_registradas / avance.actas_esperadas : 0} />
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader><IonCardTitle>Coordinador de recinto</IonCardTitle></IonCardHeader>
              <IonCardContent>
                <IonItem lines="none">
                  <IonSelect label="Asignado" labelPlacement="stacked"
                    placeholder={disponibles.length ? 'Seleccione un coordinador' : 'Cree un coordinador abajo'}
                    value={coordinadorActual} disabled={guardando || disponibles.length === 0}
                    onIonChange={(e) => asignar(String(e.detail.value))}>
                    {disponibles.map((c) => (
                      <IonSelectOption key={c.id} value={c.id}>{c.nombres} {c.apellidos} · {c.cedula}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCardContent>
            </IonCard>

            <IonAccordionGroup>
              <IonAccordion value="nuevo">
                <IonItem slot="header"><IonLabel>Crear coordinador para este recinto</IonLabel></IonItem>
                <div slot="content">
                  <FormularioUsuario rol="coordinador_recinto" onCreado={(nuevoId) => asignar(nuevoId)} />
                </div>
              </IonAccordion>
            </IonAccordionGroup>

            <IonList>
              {mesas.map((m) => (
                <IonItem key={m.jrv_id}>
                  <IonLabel>
                    <h3>JRV {m.numero}</h3>
                    <p>Veedor: {m.veedor ?? 'sin asignar'}</p>
                  </IonLabel>
                  <IonBadge color={m.acta_alcalde ? 'success' : 'medium'} className="ion-margin-end">Alc.</IonBadge>
                  <IonBadge color={m.acta_prefecto ? 'success' : 'medium'}>Pref.</IonBadge>
                </IonItem>
              ))}
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
