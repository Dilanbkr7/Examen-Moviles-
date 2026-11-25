import { useCallback, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonItem,
  IonLabel, IonList, IonListHeader, IonNote, IonPage, IonSpinner, IonText, useIonToast, useIonViewWillEnter,
} from '@ionic/react';
import { cameraOutline, locateOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';
import Encabezado from '../../components/Encabezado';
import EstadoVista from '../../components/EstadoVista';
import { useAuth } from '../../contexts/AuthContext';
import { guardarActa, listarCandidaturas, obtenerActa, registrarFotoActa } from '../../services/actasService';
import { subirFotoActa, urlFirmada } from '../../services/fotoService';
import { tomarFotoActa } from '../../services/camaraService';
import { obtenerUbicacion } from '../../services/ubicacionService';
import { hayConexion } from '../../services/redService';
import { aEnteroNoNegativo, validarTotalesActa } from '../../utils/validaciones';
import { calcularNitidez, esNitida, UMBRAL_NITIDEZ } from '../../utils/nitidez';
import { mensajeError } from '../../utils/errores';
import { FILTROS, LIMITES, limpiarEntrada } from '../../utils/entrada';
import type { Acta, Candidatura, Dignidad, Ubicacion } from '../../models';

interface FotoNueva {
  dataUrl: string;
  nitidez: number;
}

/**
 * R6 + R7: registro y correccion del acta de una JRV.
 * Lo usan el veedor (sus mesas) y el coordinador de recinto (correcciones). RLS decide quien puede guardar.
 */
export default function ActaFormulario() {
  const { jrvId: jrvParam, dignidad: dignidadParam } = useParams<{ jrvId: string; dignidad: string }>();
  const jrvId = Number(jrvParam);
  const dignidad = (dignidadParam === 'prefecto' ? 'prefecto' : 'alcalde') as Dignidad;
  const { perfil } = useAuth();
  const history = useHistory();
  const [presentToast] = useIonToast();
  const soloLectura = perfil?.rol === 'coordinador_provincial';

  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [actaExistente, setActaExistente] = useState<Acta | null>(null);
  const [fotoExistenteUrl, setFotoExistenteUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Campos como texto para validar lo que el usuario escribe
  const [total, setTotal] = useState('');
  const [nulos, setNulos] = useState('');
  const [blancos, setBlancos] = useState('');
  const [votos, setVotos] = useState<Record<number, string>>({});

  const [foto, setFoto] = useState<FotoNueva | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [errorGps, setErrorGps] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [cands, acta] = await Promise.all([listarCandidaturas(dignidad), obtenerActa(jrvId, dignidad)]);
      setCandidaturas(cands);
      setActaExistente(acta);
      if (acta) {
        setTotal(String(acta.total_sufragantes));
        setNulos(String(acta.votos_nulos));
        setBlancos(String(acta.votos_blancos));
        setVotos(Object.fromEntries(acta.detalle_votos.map((d) => [d.candidatura_id, String(d.votos)])));
        if (acta.latitud !== null && acta.longitud !== null) {
          setUbicacion({ latitud: acta.latitud, longitud: acta.longitud, precision: acta.precision_gps ?? 0 });
        }
        if (acta.foto_url) {
          urlFirmada(acta.foto_url).then(setFotoExistenteUrl).catch(() => setFotoExistenteUrl(null));
        }
      }
    } catch (e) {
      setErrorCarga(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [jrvId, dignidad]);

  useIonViewWillEnter(() => {
    cargar();
  });

  // Validacion en vivo de totales (R6)
  const resumen = useMemo(
    () =>
      validarTotalesActa(
        candidaturas.map((c) => aEnteroNoNegativo(votos[c.id] ?? '')),
        aEnteroNoNegativo(nulos),
        aEnteroNoNegativo(blancos),
        aEnteroNoNegativo(total),
      ),
    [candidaturas, votos, nulos, blancos, total],
  );

  const requiereFoto = !actaExistente?.foto_url && !foto;
  const requiereGps = !ubicacion;

  const capturarUbicacion = async () => {
    setObteniendoGps(true);
    setErrorGps(null);
    try {
      setUbicacion(await obtenerUbicacion());
    } catch (e) {
      setErrorGps(mensajeError(e));
    } finally {
      setObteniendoGps(false);
    }
  };

  const capturarFoto = async () => {
    setErrorFoto(null);
    setProcesandoFoto(true);
    try {
      const dataUrl = await tomarFotoActa();
      if (!dataUrl) return; // el usuario cancelo
      const puntaje = await calcularNitidez(dataUrl);
      if (!esNitida(puntaje)) {
        setFoto(null);
        setErrorFoto(`Foto borrosa (nitidez ${puntaje}, mínimo ${UMBRAL_NITIDEZ}). Sostenga el teléfono firme, con buena luz, y repita.`);
        return;
      }
      setFoto({ dataUrl, nitidez: puntaje });
      if (!ubicacion) capturarUbicacion(); // R7: GPS junto con la foto
    } catch (e) {
      setErrorFoto(mensajeError(e));
    } finally {
      setProcesandoFoto(false);
    }
  };

  const guardar = async () => {
    setErrorGuardar(null);
    if (!resumen.cuadra) {
      setErrorGuardar(resumen.mensaje);
      return;
    }
    if (requiereFoto) {
      setErrorGuardar('Debe tomar una foto nítida del acta.');
      return;
    }
    if (requiereGps) {
      setErrorGuardar('Debe registrar la ubicación GPS.');
      return;
    }
    if (!(await hayConexion())) {
      setErrorGuardar('Sin conexión a internet. Los datos siguen en pantalla; intente al recuperar la señal.');
      return;
    }
    setGuardando(true);
    try {
      const actaId = await guardarActa({
        jrvId,
        dignidad,
        totalSufragantes: Number(total),
        nulos: Number(nulos),
        blancos: Number(blancos),
        votos: candidaturas.map((c) => ({ candidatura_id: c.id, votos: Number(votos[c.id]) })),
        ubicacion,
      });
      if (foto) {
        try {
          const ruta = await subirFotoActa(jrvId, actaId, foto.dataUrl);
          await registrarFotoActa(actaId, ruta, foto.nitidez);
        } catch (e) {
          setErrorGuardar(`El acta se guardó, pero la foto no se subió: ${mensajeError(e)}. Presione Guardar para reintentar.`);
          return;
        }
      }
      presentToast({
        message: actaExistente ? 'Acta corregida correctamente.' : 'Acta registrada correctamente.',
        duration: 2500,
        color: 'success',
      });
      history.goBack();
    } catch (e) {
      setErrorGuardar(mensajeError(e, 'No se pudo guardar el acta.'));
    } finally {
      setGuardando(false);
    }
  };

  const campoNumero = (valor: string, setter: (v: string) => void, etiqueta: string, nota?: string) => {
    const invalido = valor !== '' && aEnteroNoNegativo(valor) === null;
    return (
      <IonItem>
        <IonInput
          label={etiqueta}
          labelPlacement="stacked"
          inputmode="numeric"
          type="text"
          value={valor}
          disabled={soloLectura}
          onIonInput={(e) => setter(limpiarEntrada(e, LIMITES.votos, FILTROS.digitos))}
        />
        {nota && <IonNote slot="end">{nota}</IonNote>}
        {invalido && <IonNote color="danger">Solo números enteros.</IonNote>}
      </IonItem>
    );
  };

  const titulo = `JRV ${jrvId} · ${dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto'}`;

  return (
    <IonPage>
      <Encabezado titulo={titulo} atras="/" />
      <IonContent>
        <EstadoVista cargando={cargando} error={errorCarga} reintentar={cargar} />
        {!cargando && !errorCarga && (
          <>
            {actaExistente && (
              <IonText color="medium">
                <p className="ion-padding-horizontal nota">
                  Acta registrada. Última modificación: {new Date(actaExistente.updated_at).toLocaleString()}.
                  {!soloLectura && ' Puede corregir los datos y guardar.'}
                </p>
              </IonText>
            )}
            <IonList>
              <IonListHeader>Votos por organización</IonListHeader>
              {candidaturas.map((c) =>
                campoNumero(
                  votos[c.id] ?? '',
                  (v) => setVotos((prev) => ({ ...prev, [c.id]: v })),
                  `${c.organizacion.siglas} (Lista ${c.organizacion.lista}) · ${c.nombre_candidato}`,
                ),
              )}
              <IonListHeader>Totales</IonListHeader>
              {campoNumero(nulos, setNulos, 'Votos nulos')}
              {campoNumero(blancos, setBlancos, 'Votos blancos')}
              {campoNumero(total, setTotal, 'Total de sufragantes')}
            </IonList>

            <IonCard color={resumen.cuadra ? 'success' : 'light'}>
              <IonCardContent>
                <IonIcon icon={resumen.cuadra ? checkmarkCircle : alertCircle} />{' '}
                {resumen.cuadra
                  ? `Cuadra: válidos ${resumen.validos} + nulos ${nulos} + blancos ${blancos} = ${total}`
                  : resumen.mensaje}
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader><IonCardTitle>Foto del acta</IonCardTitle></IonCardHeader>
              <IonCardContent>
                {foto && (
                  <>
                    <img src={foto.dataUrl} alt="Foto nueva del acta" className="foto-acta" />
                    <IonText color="success"><p>Foto nítida (puntaje {foto.nitidez}).</p></IonText>
                  </>
                )}
                {!foto && fotoExistenteUrl && <img src={fotoExistenteUrl} alt="Foto registrada del acta" className="foto-acta" />}
                {!foto && actaExistente?.foto_url && !fotoExistenteUrl && <p>Foto registrada (no se pudo cargar la vista previa).</p>}
                {errorFoto && <IonText color="danger"><p>{errorFoto}</p></IonText>}
                {!soloLectura && (
                  <IonButton expand="block" fill="outline" onClick={capturarFoto} disabled={procesandoFoto}>
                    {procesandoFoto ? <IonSpinner name="dots" /> : (<><IonIcon slot="start" icon={cameraOutline} />{foto || actaExistente?.foto_url ? 'Tomar otra foto' : 'Tomar foto'}</>)}
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader><IonCardTitle>Ubicación GPS</IonCardTitle></IonCardHeader>
              <IonCardContent>
                {ubicacion ? (
                  <IonLabel>
                    Lat {ubicacion.latitud.toFixed(6)}, Lon {ubicacion.longitud.toFixed(6)} (±{ubicacion.precision} m)
                  </IonLabel>
                ) : (
                  <p>Sin ubicación registrada.</p>
                )}
                {errorGps && <IonText color="danger"><p>{errorGps}</p></IonText>}
                {!soloLectura && (
                  <IonButton expand="block" fill="outline" onClick={capturarUbicacion} disabled={obteniendoGps}>
                    {obteniendoGps ? <IonSpinner name="dots" /> : (<><IonIcon slot="start" icon={locateOutline} />{ubicacion ? 'Actualizar ubicación' : 'Obtener ubicación'}</>)}
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>

            {errorGuardar && <IonText color="danger"><p className="ion-padding-horizontal">{errorGuardar}</p></IonText>}
            {!soloLectura && (
              <IonButton expand="block" className="ion-margin" onClick={guardar}
                disabled={guardando || !resumen.cuadra || requiereFoto || requiereGps}>
                {guardando ? <IonSpinner name="dots" /> : actaExistente ? 'Guardar corrección' : 'Registrar acta'}
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
