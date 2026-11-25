import { IonButton, IonSpinner, IonText } from '@ionic/react';

/** Estados explicitos de carga, error y vacio (R9). */
export default function EstadoVista({
  cargando, error, vacio, mensajeVacio, reintentar,
}: { cargando: boolean; error: string | null; vacio?: boolean; mensajeVacio?: string; reintentar?: () => void }) {
  if (cargando) {
    return (
      <div className="centrado">
        <IonSpinner name="crescent" />
        <p>Cargando…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="centrado">
        <IonText color="danger"><p>{error}</p></IonText>
        {reintentar && <IonButton fill="outline" onClick={reintentar}>Reintentar</IonButton>}
      </div>
    );
  }
  if (vacio) {
    return (
      <div className="centrado">
        <IonText color="medium"><p>{mensajeVacio ?? 'No hay registros.'}</p></IonText>
      </div>
    );
  }
  return null;
}
