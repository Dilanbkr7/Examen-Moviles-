// Formulario reutilizable para crear coordinadores de recinto y veedores (R2).
import { useState } from 'react';
import { IonButton, IonInput, IonItem, IonList, IonSpinner, IonText, useIonToast } from '@ionic/react';
import CampoError from './CampoError';
import { FILTROS, LIMITES, limpiarEntrada } from '../utils/entrada';
import { validarNuevoUsuario, type ErroresUsuario, PASSWORD_INICIAL } from '../utils/validaciones';
import { crearUsuario } from '../services/usuariosService';
import { mensajeError } from '../utils/errores';
import type { NuevoUsuario, Rol } from '../models';

const VACIO: NuevoUsuario = { cedula: '', nombres: '', apellidos: '', telefono: '', correo: '' };

interface Props {
  rol: Exclude<Rol, 'coordinador_provincial'>;
  onCreado: (id: string) => void;
}

export default function FormularioUsuario({ rol, onCreado }: Props) {
  const [datos, setDatos] = useState<NuevoUsuario>(VACIO);
  const [errores, setErrores] = useState<ErroresUsuario>({});
  const [tocado, setTocado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [presentToast] = useIonToast();

  const cambiar = (campo: keyof NuevoUsuario, valor: string) => {
    const nuevos = { ...datos, [campo]: valor };
    setDatos(nuevos);
    if (tocado) setErrores(validarNuevoUsuario(nuevos));
  };

  const guardar = async () => {
    setTocado(true);
    const errs = validarNuevoUsuario(datos);
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;
    setGuardando(true);
    try {
      const r = await crearUsuario(datos, rol);
      presentToast({
        message: r.correo_enviado
          ? `Cuenta creada. Se envió la confirmación a ${datos.correo}. Contraseña inicial: ${PASSWORD_INICIAL}`
          : `Cuenta creada (${r.mensaje}). Contraseña inicial: ${PASSWORD_INICIAL}`,
        duration: 5000,
        color: 'success',
      });
      setDatos(VACIO);
      setTocado(false);
      setErrores({});
      onCreado(r.id);
    } catch (e) {
      presentToast({ message: mensajeError(e), duration: 4000, color: 'danger' });
    } finally {
      setGuardando(false);
    }
  };

  const campo = (k: keyof NuevoUsuario, etiqueta: string, tipo: 'text' | 'email' | 'tel', max: number, filtro?: RegExp) => (
    <IonItem key={k}>
      <IonInput
        label={etiqueta}
        labelPlacement="stacked"
        type={tipo}
        inputmode={k === 'cedula' || k === 'telefono' ? 'numeric' : undefined}
        value={datos[k]}
        onIonInput={(e) => cambiar(k, limpiarEntrada(e, max, filtro))}
      />
      <CampoError mensaje={errores[k]} />
    </IonItem>
  );

  return (
    <IonList>
      {campo('cedula', 'Cédula', 'text', LIMITES.cedula, FILTROS.digitos)}
      {campo('nombres', 'Nombres', 'text', LIMITES.nombre, FILTROS.letras)}
      {campo('apellidos', 'Apellidos', 'text', LIMITES.nombre, FILTROS.letras)}
      {campo('telefono', 'Celular', 'tel', LIMITES.telefono, FILTROS.digitos)}
      {campo('correo', 'Correo electrónico', 'email', LIMITES.correo, FILTROS.sinEspacios)}
      <IonText color="medium">
        <p className="ion-padding-horizontal nota">
          La cuenta se crea con la contraseña inicial {PASSWORD_INICIAL}; el usuario deberá cambiarla en su primer acceso.
        </p>
      </IonText>
      <IonButton expand="block" className="ion-margin" onClick={guardar} disabled={guardando}>
        {guardando ? <IonSpinner name="dots" /> : 'Crear cuenta'}
      </IonButton>
    </IonList>
  );
}
