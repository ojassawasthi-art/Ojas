import {useCallback, useEffect, useState} from 'react';
import {siteContent} from '../content/site';
import type {Project, SiteSettingsMap, Testimonial} from '../types/database';

interface PortfolioDataState {
  projects: Project[];
  testimonials: Testimonial[];
  settings: SiteSettingsMap;
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  refresh: () => Promise<void>;
}

export function usePortfolioData(): PortfolioDataState {
  const [projects, setProjects] = useState<Project[]>(siteContent.fallbackProjects);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<SiteSettingsMap>(
    siteContent.fallbackSettings,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [projRes, testRes, setRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/testimonials'),
        fetch('/api/settings'),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
        setSupabaseConnected(Boolean(data.supabaseConnected));
      }

      if (testRes.ok) {
        const data = await testRes.json();
        if (Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
        }
      }

      if (setRes.ok) {
        const data = await setRes.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch {
      setError('Unable to sync live updates; displaying saved portfolio content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projects,
    testimonials,
    settings,
    loading,
    error,
    supabaseConnected,
    refresh,
  };
}
