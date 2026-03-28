import { create } from "zustand";
import { supabase } from "../lib/supabase";
import useLayerTreeStore from "./layerTreeStore";
import { fetchProfile } from "../lib/profilesService";

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ user, loading: false });

    if (user) {
      const { data: profile } = await fetchProfile(user.id);
      set({ profile });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      if (user) {
        const { data: profile } = await fetchProfile(user.id);
        set({ profile });
      } else {
        set({ profile: null });
      }
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
    set({ user: null, profile: null });
    useLayerTreeStore.getState().reset();
  },
}));

export default useAuthStore;
