import { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { IonButton, IonContent, IonInput, IonItem, IonList, IonPage, IonSpinner, IonText, IonRouterLink } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import CampoError from '../../components/CampoError';
import { RUTA_INICIO } from '../../components/RutaProtegida';
import { validarCedula } from '../../utils/validaciones';
import { mensajeError } from '../../utils/errores';

export default function Login() {
  const { sesion, perfil, iniciarSesion } = useAuth();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [errorCedula, setErrorCedula] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (sesion && perfil) {
    return <Redirect to={perfil.debe_cambiar_password ? '/cambiar-password' : RUTA_INICIO[perfil.rol]} />;
  }

  const entrar = async () => {
    setError(null);
    const ec = validarCedula(cedula);
    setErrorCedula(ec);
    if (ec) return;
    if (!password) {
      setError('Ingrese su contraseña.');
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(cedula, password);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo iniciar sesión.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-cabecera">
          <h1>Control Electoral</h1>
          <p>Escrutinio por JRV · Alcaldía y Prefectura</p>
        </div>
        <IonList>
          <IonItem>
            <IonInput
              label="Cédula"
              labelPlacement="stacked"
              inputmode="numeric"
              maxlength={10}
              value={cedula}
              onIonInput={(e) => setCedula(String(e.detail.value ?? ''))}
              onIonBlur={() => cedula && setErrorCedula(validarCedula(cedula))}
            />
            <CampoError mensaje={errorCedula} />
          </IonItem>
          <IonItem>
            <IonInput
              label="Contraseña"
              labelPlacement="stacked"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(String(e.detail.value ?? ''))}
              onKeyUp={(e) => e.key === 'Enter' && entrar()}
            />
          </IonItem>
        </IonList>
        {error && <IonText color="danger"><p className="ion-padding-horizontal">{error}</p></IonText>}
        <IonButton expand="block" onClick={entrar} disabled={cargando}>
          {cargando ? <IonSpinner name="dots" /> : 'Ingresar'}
        </IonButton>
        <p className="ion-text-center">
          <IonRouterLink routerLink="/recuperar">¿Olvidó su contraseña?</IonRouterLink>
        </p>
      </IonContent>
    </IonPage>
  );
}
