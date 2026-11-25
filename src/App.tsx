import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useAuth } from './contexts/AuthContext';
import { PantallaCarga, RUTA_INICIO, RutaProtegida } from './components/RutaProtegida';
import Login from './pages/auth/Login';
import CambiarPassword from './pages/auth/CambiarPassword';
import RecuperarPassword from './pages/auth/RecuperarPassword';
import MisMesas from './pages/veedor/MisMesas';
import ActaFormulario from './pages/veedor/ActaFormulario';
import MesasRecinto from './pages/recinto/MesasRecinto';
import VeedoresRecinto from './pages/recinto/VeedoresRecinto';
import Recintos from './pages/provincial/Recintos';
import RecintoDetalle from './pages/provincial/RecintoDetalle';
import Dashboard from './pages/provincial/Dashboard';

setupIonicReact();

function Inicio() {
  const { sesion, perfil, cargando } = useAuth();
  if (cargando || (sesion && !perfil)) return <PantallaCarga />;
  if (!sesion || !perfil) return <Redirect to="/login" />;
  return <Redirect to={perfil.debe_cambiar_password ? '/cambiar-password' : RUTA_INICIO[perfil.rol]} />;
}

/** Navegacion (ADR-001: React Router con @ionic/react-router). Las rutas se agrupan por rol. */
export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <Route exact path="/recuperar" component={RecuperarPassword} />
          <Route exact path="/cambiar-password" component={CambiarPassword} />

          <Route exact path="/veedor" render={() => <RutaProtegida roles={['veedor']}><MisMesas /></RutaProtegida>} />
          <Route exact path="/acta/:jrvId/:dignidad" render={() => <RutaProtegida><ActaFormulario /></RutaProtegida>} />

          <Route exact path="/recinto" render={() => <RutaProtegida roles={['coordinador_recinto']}><MesasRecinto /></RutaProtegida>} />
          <Route exact path="/recinto/veedores" render={() => <RutaProtegida roles={['coordinador_recinto']}><VeedoresRecinto /></RutaProtegida>} />

          <Route exact path="/provincial" render={() => <RutaProtegida roles={['coordinador_provincial']}><Recintos /></RutaProtegida>} />
          <Route exact path="/provincial/recinto/:id" render={() => <RutaProtegida roles={['coordinador_provincial']}><RecintoDetalle /></RutaProtegida>} />
          <Route exact path="/provincial/dashboard" render={() => <RutaProtegida roles={['coordinador_provincial']}><Dashboard /></RutaProtegida>} />

          <Route exact path="/" component={Inicio} />
          <Route render={() => <Redirect to="/" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
