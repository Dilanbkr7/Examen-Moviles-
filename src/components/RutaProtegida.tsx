// Proteccion de rutas en la interfaz (UX). La seguridad real esta en RLS del backend.
import type { ReactNode } from 'react';
import { Redirect } from 'react-router-dom';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import type { Rol } from '../models';

export const RUTA_INICIO: Record<Rol, string> = {
  coordinador_provincial: '/provincial',
  coordinador_recinto: '/recinto',
  veedor: '/veedor',
};

export function PantallaCarga() {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="centrado">
          <IonSpinner name="crescent" />
          <p>Cargando…</p>
        </div>
      </IonContent>
    </IonPage>
  );
}

export function RutaProtegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { sesion, perfil, cargando } = useAuth();
  if (cargando) return <PantallaCarga />;
  if (!sesion) return <Redirect to="/login" />;
  if (!perfil) return <PantallaCarga />;
  if (perfil.debe_cambiar_password) return <Redirect to="/cambiar-password" />;
  if (roles && !roles.includes(perfil.rol)) return <Redirect to={RUTA_INICIO[perfil.rol]} />;
  return <>{children}</>;
}
