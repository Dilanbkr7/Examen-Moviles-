import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonSpinner, IonText, IonTitle, IonToolbar, useIonToast } from '@ionic/react';
import CampoError from '../../components/CampoError';
import { enviarCodigoRecuperacion, restablecerConCodigo } from '../../services/authService';
import { validarCorreo, validarNuevaPassword } from '../../utils/validaciones';
import { mensajeError } from '../../utils/errores';
import { useAuth } from '../../contexts/AuthContext';

/** R3: recuperacion por correo con codigo de un solo uso. */
export default function RecuperarPassword() {
  const history = useHistory();
  const { recargarPerfil } = useAuth();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [presentToast] = useIonToast();

  const enviar = async () => {
    const e = validarCorreo(correo);
    setError(e);
    if (e) return;
    setCargando(true);
    try {
      await enviarCodigoRecuperacion(correo);
      presentToast({ message: 'Si el correo está registrado, recibirá un código.', duration: 3500, color: 'success' });
      setPaso(2);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const restablecer = async () => {
    if (!/^\d{6,10}$/.test(codigo.trim())) {
      setError('Ingrese el código numérico recibido por correo.');
      return;
    }
    const e = validarNuevaPassword(password, confirmacion);
    setError(e);
    if (e) return;
    setCargando(true);
    try {
      await restablecerConCodigo(correo, codigo, password);
      await recargarPerfil();
      presentToast({ message: 'Contraseña restablecida.', duration: 2500, color: 'success' });
      history.replace('/');
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/login" text="" /></IonButtons>
          <IonTitle>Recuperar contraseña</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {paso === 1 ? (
          <IonList>
            <IonItem>
              <IonInput label="Correo registrado" labelPlacement="stacked" type="email" value={correo}
                onIonInput={(e) => setCorreo(String(e.detail.value ?? ''))} />
              <CampoError mensaje={error} />
            </IonItem>
            <IonButton expand="block" className="ion-margin-top" onClick={enviar} disabled={cargando}>
              {cargando ? <IonSpinner name="dots" /> : 'Enviar código'}
            </IonButton>
          </IonList>
        ) : (
          <IonList>
            <IonText><p>Revise {correo} e ingrese el código recibido.</p></IonText>
            <IonItem>
              <IonInput label="Código" labelPlacement="stacked" inputmode="numeric" value={codigo}
                onIonInput={(e) => setCodigo(String(e.detail.value ?? ''))} />
            </IonItem>
            <IonItem>
              <IonInput label="Nueva contraseña" labelPlacement="stacked" type="password" value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ''))} />
            </IonItem>
            <IonItem>
              <IonInput label="Repetir contraseña" labelPlacement="stacked" type="password" value={confirmacion}
                onIonInput={(e) => setConfirmacion(String(e.detail.value ?? ''))} />
              <CampoError mensaje={error} />
            </IonItem>
            <IonButton expand="block" className="ion-margin-top" onClick={restablecer} disabled={cargando}>
              {cargando ? <IonSpinner name="dots" /> : 'Restablecer'}
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => setPaso(1)}>Volver a enviar</IonButton>
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
