// ADR-005: React Context API comparte sesion, perfil y rol entre todas las pantallas.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import * as authService from '../services/authService';
import type { Perfil } from '../models';

interface AuthContextValue {
  sesion: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  iniciarSesion: (cedula: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setPerfil(null);
      return;
    }
    try {
      setPerfil(await authService.obtenerPerfil(s.user.id));
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    // Sesion guardada (Preferences) al abrir la app
    supabase.auth.getSession().then(async ({ data }) => {
      setSesion(data.session);
      await cargarPerfil(data.session);
      setCargando(false);
    });
    // Sincronizacion con Supabase Auth (login, logout, refresco de token)
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s);
      // Se difiere para no llamar a Supabase dentro del callback
      setTimeout(() => {
        cargarPerfil(s);
      }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [cargarPerfil]);

  const iniciarSesion = async (cedula: string, password: string) => {
    await authService.iniciarSesionConCedula(cedula, password);
    const { data } = await supabase.auth.getSession();
    setSesion(data.session);
    await cargarPerfil(data.session);
  };

  const cerrarSesion = async () => {
    await authService.cerrarSesion();
    setSesion(null);
    setPerfil(null);
  };

  const recargarPerfil = async () => {
    const { data } = await supabase.auth.getSession();
    await cargarPerfil(data.session);
  };

  return (
    <AuthContext.Provider value={{ sesion, perfil, cargando, iniciarSesion, cerrarSesion, recargarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
