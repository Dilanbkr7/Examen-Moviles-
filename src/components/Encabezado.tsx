import { IonBackButton, IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { logOutOutline, cloudOfflineOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useConexion } from '../services/redService';
import { NOMBRE_ROL } from '../models';

interface Props {
  titulo: string;
  atras?: string;
}

/** Encabezado comun: titulo, rol del usuario, cerrar sesion y aviso de sin conexion. */
export default function Encabezado({ titulo, atras }: Props) {
  const { perfil, cerrarSesion } = useAuth();
  const conectado = useConexion();
  return (
    <IonHeader>
      <IonToolbar color="primary">
        {atras && (
          <IonButtons slot="start">
            <IonBackButton defaultHref={atras} text="" />
          </IonButtons>
        )}
        <IonTitle>
          {titulo}
          {perfil && <div className="subtitulo">{NOMBRE_ROL[perfil.rol]} · {perfil.nombres}</div>}
        </IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={cerrarSesion} aria-label="Cerrar sesión">
            <IonIcon slot="icon-only" icon={logOutOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
      {!conectado && (
        <IonToolbar color="warning">
          <div className="aviso-offline">
            <IonIcon icon={cloudOfflineOutline} /> Sin conexión: no se podrán guardar cambios hasta reconectar.
          </div>
        </IonToolbar>
      )}
    </IonHeader>
  );
}
