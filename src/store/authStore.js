import { create } from "zustand";
import { supabase } from "../lib/supabase";
import useLayerTreeStore from "./layerTreeStore";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signInWithEmail: async (email, password) => {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  },

  signUpWithEmail: async (email, password) => {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  },

  signInWithGoogle: async () => {
    if (!supabase) return { error: { message: "Supabase not configured" } };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
    return { error };
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
    useLayerTreeStore.getState().reset();
  },
}));

export default useAuthStore;
