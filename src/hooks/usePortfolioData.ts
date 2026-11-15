import {useCallback, useEffect, useState} from 'react';
import {siteContent} from '../content/site';
import {isSupabaseConfigured, supabase} from '../lib/supabase';
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

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok || !ct.includes('application/json')) return null;
  return res.json();
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
        fetch('/api/projects').catch(() => null),
        fetch('/api/testimonials').catch(() => null),
        fetch('/api/settings').catch(() => null),
      ]);

      const projData = projRes ? await safeJson(projRes) : null;
      const testData = testRes ? await safeJson(testRes) : null;
      const setData = setRes ? await safeJson(setRes) : null;

      if (projData && Array.isArray(projData.projects)) {
        setProjects(projData.projects);
        setSupabaseConnected(Boolean(projData.supabaseConnected));
      } else if (isSupabaseConfigured && supabase) {
        // Direct client-side Supabase fallback when running Vite without Express/API
        const {data} = await supabase
          .from('projects')
          .select('*')
          .eq('published', true)
          .order('sort_order', {ascending: true});
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data as Project[]);
          setSupabaseConnected(true);
        }
      }

      if (testData && Array.isArray(testData.testimonials)) {
        setTestimonials(testData.testimonials);
      } else if (isSupabaseConfigured && supabase) {
        const {data} = await supabase
          .from('testimonials')
          .select('*')
          .eq('approved', true)
          .order('created_at', {ascending: false});
        if (Array.isArray(data)) {
          setTestimonials(data as Testimonial[]);
        }
      }

      if (setData && setData.settings) {
        setSettings(setData.settings);
      } else if (isSupabaseConfigured && supabase) {
        const {data} = await supabase.from('site_settings').select('key, value');
        if (Array.isArray(data) && data.length > 0) {
          const map: SiteSettingsMap = structuredClone(siteContent.fallbackSettings);
          for (const row of data) {
            if (row.key === 'availability' && row.value) {
              map.availability = row.value as SiteSettingsMap['availability'];
            }
            if (row.key === 'hero' && row.value) {
              map.hero = row.value as SiteSettingsMap['hero'];
            }
          }
          setSettings(map);
        }
      }
    } catch {
      setError('Using saved portfolio content.');
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
