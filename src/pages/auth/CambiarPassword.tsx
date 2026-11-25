import { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonSpinner, IonText, IonTitle, IonToolbar, useIonToast } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import CampoError from '../../components/CampoError';
import { RUTA_INICIO } from '../../components/RutaProtegida';
import { cambiarPassword } from '../../services/authService';
import { validarNuevaPassword } from '../../utils/validaciones';
import { mensajeError } from '../../utils/errores';

/** R3: cambio obligatorio de la contrasena inicial en el primer acceso. */
export default function CambiarPassword() {
  const { sesion, perfil, recargarPerfil, cerrarSesion } = useAuth();
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [presentToast] = useIonToast();

  if (!sesion) return <Redirect to="/login" />;

  const guardar = async () => {
    const e = validarNuevaPassword(password, confirmacion);
    setError(e);
    if (e) return;
    setGuardando(true);
    try {
      await cambiarPassword(password);
      await recargarPerfil();
      presentToast({ message: 'Contraseña actualizada.', duration: 2500, color: 'success' });
      history.replace(perfil ? RUTA_INICIO[perfil.rol] : '/');
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary"><IonTitle>Cambiar contraseña</IonTitle></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <p>Por seguridad debe reemplazar la contraseña inicial antes de continuar.</p>
        </IonText>
        <IonList>
          <IonItem>
            <IonInput label="Nueva contraseña" labelPlacement="stacked" type="password" value={password}
              onIonInput={(e) => setPassword(String(e.detail.value ?? ''))} />
          </IonItem>
          <IonItem>
            <IonInput label="Repetir contraseña" labelPlacement="stacked" type="password" value={confirmacion}
              onIonInput={(e) => setConfirmacion(String(e.detail.value ?? ''))} />
            <CampoError mensaje={error} />
          </IonItem>
        </IonList>
        <IonText color="medium"><p className="nota">Mínimo 8 caracteres, con letras y números.</p></IonText>
        <IonButton expand="block" onClick={guardar} disabled={guardando}>
          {guardando ? <IonSpinner name="dots" /> : 'Guardar'}
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={cerrarSesion}>Cerrar sesión</IonButton>
      </IonContent>
    </IonPage>
  );
}
