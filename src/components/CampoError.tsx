import { IonNote } from '@ionic/react';

/** Mensaje de validacion bajo un campo. */
export default function CampoError({ mensaje }: { mensaje?: string | null }) {
  if (!mensaje) return null;
  return (
    <IonNote color="danger" className="campo-error">
      {mensaje}
    </IonNote>
  );
}
