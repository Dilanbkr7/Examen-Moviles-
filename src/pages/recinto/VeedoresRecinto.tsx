import { useCallback, useState } from 'react';
import { IonContent, IonItem, IonLabel, IonList, IonListHeader, IonPage, useIonViewWillEnter } from '@ionic/react';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import FormularioUsuario from '../../components/FormularioUsuario';
import { listarPorRol } from '../../services/usuariosService';
import { mensajeError } from '../../utils/errores';
import type { Perfil } from '../../models';

/** R2 + R5: el coordinador de recinto crea veedores. */
export default function VeedoresRecinto() {
  const [veedores, setVeedores] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setVeedores(await listarPorRol('veedor'));
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
      <Encabezado titulo="Veedores" atras="/recinto" />
      <IonContent>
        <IonListHeader>Nuevo veedor</IonListHeader>
        <FormularioUsuario rol="veedor" onCreado={cargar} />
        <IonListHeader>Veedores creados</IonListHeader>
        <EstadoVista cargando={cargando} error={error} reintentar={cargar} vacio={veedores.length === 0}
          mensajeVacio="Aún no ha creado veedores." />
        {!cargando && !error && (
          <IonList>
            {veedores.map((v) => (
              <IonItem key={v.id}>
                <IonLabel>
                  <h3>{v.nombres} {v.apellidos}</h3>
                  <p>{v.cedula} · {v.telefono} · {v.correo}</p>
                  <p>{v.debe_cambiar_password ? 'Pendiente de primer acceso' : 'Cuenta activa'}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
