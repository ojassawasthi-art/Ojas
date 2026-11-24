import {
  Check,
  Download,
  GripVertical,
  Loader2,
  LogOut,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {SeoHead} from '../components/SeoHead';
import {getCanonicalBaseUrl} from '../lib/seo';
import {ADMIN_EMAIL, isSupabaseConfigured, supabase} from '../lib/supabase';
import type {
  ChatLog,
  ContactMessage,
  ContactMessageStatus,
  NewsletterSubscriber,
  PageView,
  Project,
  SiteSettingsMap,
  Testimonial,
} from '../types/database';

interface AdminPageProps {
  onDataChanged: () => Promise<void>;
}

type AdminTab =
  | 'projects'
  | 'messages'
  | 'testimonials'
  | 'newsletter'
  | 'analytics'
  | 'chat'
  | 'settings';

export function AdminPage({onDataChanged}: AdminPageProps) {
  const [authChecking, setAuthChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginStatus, setLoginStatus] = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const [tab, setTab] = useState<AdminTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [chatTableMissing, setChatTableMissing] = useState(false);
  const [settings, setSettings] = useState<SiteSettingsMap>({
    availability: {enabled: true, text: 'Available for projects'},
    hero: {
      headline:
        'Web developer & digital strategist building fast, beautiful websites that grow brands.',
    },
  });

  const [loadingData, setLoadingData] = useState(false);
  const [notice, setNotice] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Project editor form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [category, setCategory] = useState('Web');
  const [year, setYear] = useState('2026');
  const [featured, setFeatured] = useState(true);
  const [published, setPublished] = useState(true);
  const [statusTag, setStatusTag] = useState('');
  const [role, setRole] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (isSupabaseConfigured && supabase) {
        const {data} = await supabase.auth.getSession();
        if (!active) return;
        const email = data.session?.user?.email || null;
        if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setUserEmail(email);
          setAccessToken(data.session?.access_token || null);
        }
        setAuthChecking(false);

        const {data: sub} = supabase.auth.onAuthStateChange((_event, session) => {
          const nextEmail = session?.user?.email || null;
          if (nextEmail && nextEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            setUserEmail(nextEmail);
            setAccessToken(session?.access_token || null);
          } else {
            setUserEmail(null);
            setAccessToken(null);
          }
        });
        return () => sub.subscription.unsubscribe();
      } else {
        try {
          const previewEmail = sessionStorage.getItem('oa_admin_preview_email');
          if (
            previewEmail &&
            previewEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          ) {
            setUserEmail(previewEmail);
            setAccessToken('preview-mode');
          }
        } catch {
          // Ignore
        }
        setAuthChecking(false);
      }
    }

    checkSession();
    return () => {
      active = false;
    };
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    if (isSupabaseConfigured && accessToken) {
      return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'x-admin-preview-email': userEmail || '',
      'Content-Type': 'application/json',
    };
  }, [accessToken, userEmail]);

  const fetchAdminData = useCallback(async () => {
    if (!userEmail) return;
    setLoadingData(true);
    try {
      const headers = authHeaders();
      const [pRes, mRes, tRes, nRes, aRes, cRes, sRes] = await Promise.all([
        fetch('/api/admin/projects', {headers}),
        fetch('/api/admin/messages', {headers}),
        fetch('/api/admin/testimonials', {headers}),
        fetch('/api/admin/newsletter', {headers}),
        fetch('/api/admin/analytics', {headers}),
        fetch('/api/admin/chat-logs', {headers}),
        fetch('/api/settings'),
      ]);

      if (pRes.ok) {
        const d = await pRes.json();
        setProjects(d.projects || []);
      }
      if (mRes.ok) {
        const d = await mRes.json();
        setMessages(d.messages || []);
      }
      if (tRes.ok) {
        const d = await tRes.json();
        setTestimonials(d.testimonials || []);
      }
      if (nRes.ok) {
        const d = await nRes.json();
        setSubscribers(d.subscribers || []);
      }
      if (aRes.ok) {
        const d = await aRes.json();
        setPageViews(d.views || []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setChatLogs(d.logs || []);
        setChatTableMissing(Boolean(d.tableMissing));
      }
      if (sRes.ok) {
        const d = await sRes.json();
        if (d.settings) setSettings(d.settings);
      }
    } finally {
      setLoadingData(false);
    }
  }, [userEmail, authHeaders]);

  useEffect(() => {
    if (userEmail) {
      fetchAdminData();
    }
  }, [userEmail, fetchAdminData]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus('');
    if (loginEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setLoginStatus(`Access is restricted to ${ADMIN_EMAIL}.`);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      setSendingLink(true);
      const {error} = await supabase.auth.signInWithOtp({
        email: loginEmail.trim(),
        options: {
          emailRedirectTo: `${getCanonicalBaseUrl()}/admin`,
        },
      });
      setSendingLink(false);
      if (error) {
        setLoginStatus(error.message);
      } else {
        setLoginStatus(`Magic link sent to ${loginEmail.trim()}. Check your inbox.`);
      }
    } else {
      try {
        sessionStorage.setItem('oa_admin_preview_email', loginEmail.trim());
      } catch {
        // Ignore
      }
      setUserEmail(loginEmail.trim());
      setAccessToken('preview-mode');
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    try {
      sessionStorage.removeItem('oa_admin_preview_email');
    } catch {
      // Ignore
    }
    setUserEmail(null);
    setAccessToken(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setLongDescription('');
    setLiveUrl('');
    setGithubUrl('');
    setThumbnailUrl('');
    setTechStackInput('');
    setCategory('Web');
    setYear('2026');
    setFeatured(true);
    setPublished(true);
    setStatusTag('');
    setRole('');
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setTitle(p.title);
    setSlug(p.slug);
    setDescription(p.description);
    setLongDescription(p.long_description || '');
    setLiveUrl(p.live_url || '');
    setGithubUrl(p.github_url || '');
    setThumbnailUrl(p.thumbnail_url || '');
    setTechStackInput((p.tech_stack || []).join(', '));
    setCategory(p.category || 'Web');
    setYear(p.year || '2026');
    setFeatured(p.featured);
    setPublished(p.published);
    setStatusTag(p.status_tag || '');
    setRole(p.role || '');
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Image must be under 5 MB.');
      return;
    }

    setUploadingImage(true);
    setNotice('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            dataUrl: base64,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setThumbnailUrl(data.url);
          setNotice('Image uploaded.');
        } else {
          setNotice(data.error || 'Upload failed.');
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
      setNotice('Upload failed.');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProject(true);
    setNotice('');

    const payload = {
      title: title.trim(),
      slug:
        slug.trim() ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      description: description.trim(),
      long_description: longDescription.trim() || null,
      live_url: liveUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      tech_stack: techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      category: category.trim() || 'Web',
      year: year.trim() || '2026',
      featured,
      published,
      status_tag: statusTag.trim() || null,
      role: role.trim() || null,
    };

    const url = editingId
      ? `/api/admin/projects/${editingId}`
      : '/api/admin/projects';
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    setSavingProject(false);
    if (res.ok) {
      setNotice(editingId ? 'Project updated.' : 'Project added.');
      resetForm();
      await fetchAdminData();
      await onDataChanged();
    } else {
      const err = await res.json();
      setNotice(err.error || 'Unable to save project.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      await fetchAdminData();
      await onDataChanged();
    }
  };

  const persistOrder = async (ordered: Project[]) => {
    setProjects(ordered);
    await fetch('/api/admin/projects/reorder', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({orderedIds: ordered.map((p) => p.id)}),
    });
    await onDataChanged();
  };

  const handleDropOnRow = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = projects.findIndex((p) => p.id === draggedId);
    const toIdx = projects.findIndex((p) => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const copy = [...projects];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setDraggedId(null);
    await persistOrder(copy);
  };

  const handleMessageStatus = async (
    id: string,
    status: ContactMessageStatus,
  ) => {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({status}),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? {...m, status} : m)),
      );
    }
  };

  const handleToggleTestimonial = async (id: string, approved: boolean) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({approved}),
    });
    if (res.ok) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? {...t, approved} : t)),
      );
      await onDataChanged();
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      await onDataChanged();
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const res = await fetch(`/api/admin/newsletter/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setNotice('Subscriber removed.');
    }
  };

  const handleExportSubscribersCsv = () => {
    const escapeCsv = (val: string | boolean | null | undefined) => {
      const str = val === null || val === undefined ? '' : String(val);
      if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = 'email,name,created_at,consent';
    const rows = subscribers.map((sub) =>
      [
        escapeCsv(sub.email),
        escapeCsv(sub.name || ''),
        escapeCsv(sub.created_at),
        escapeCsv(Boolean(sub.consent)),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSubscribers = (() => {
    const q = subscriberSearch.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.source || '').toLowerCase().includes(q),
    );
  })();

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({settings}),
    });
    if (res.ok) {
      setNotice('Site settings updated.');
      await onDataChanged();
    }
  };

  // Group page views by date (last 7 days)
  const dailyViews = (() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    pageViews.forEach((v) => {
      const key = v.created_at.slice(0, 10);
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([date, count]) => ({date, count}));
  })();

  const maxDailyCount = Math.max(1, ...dailyViews.map((d) => d.count));

  if (authChecking) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center pt-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </section>
    );
  }

  if (!userEmail) {
    return (
      <>
        <SeoHead title="Admin | Ojas Awasthi" path="/admin" noIndex />
        <section className="flex min-h-[75vh] items-center pt-24 pb-20">
          <div className="mx-auto w-full max-w-md px-6">
            <div className="card-elevated bg-[var(--surface)] p-8">
              <p className="text-xs tracking-widest text-[var(--accent-text)]">
                Private Workspace
              </p>
              <h1 className="mt-2 font-serif-display text-4xl text-[var(--text)]">
                Admin sign-in
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                {isSupabaseConfigured
                  ? `Enter ${ADMIN_EMAIL} to receive a Supabase magic link.`
                  : `Supabase environment variables are not connected yet. Enter ${ADMIN_EMAIL} to open local preview mode.`}
              </p>

              <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-medium text-[var(--muted)]"
                  >
                    Admin Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                {loginStatus && (
                  <p className="text-xs text-[var(--accent-text)]">
                    {loginStatus}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sendingLink}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-medium"
                >
                  {sendingLink && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {isSupabaseConfigured
                      ? 'Send magic link'
                      : 'Open preview console'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SeoHead title="Admin Console | Ojas Awasthi" path="/admin" noIndex />
      <section className="pt-28 pb-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <p className="text-xs text-[var(--accent-text)]">
                Signed in as {userEmail}{' '}
                {!isSupabaseConfigured && '(Local Preview Mode)'}
              </p>
              <h1 className="mt-1 font-serif-display text-4xl text-[var(--text)]">
                Portfolio Admin
              </h1>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>

          {/* Navigation tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                {id: 'projects', label: `Projects (${projects.length})`},
                {id: 'messages', label: `Inbox (${messages.length})`},
                {
                  id: 'testimonials',
                  label: `Testimonials (${testimonials.length})`,
                },
                {
                  id: 'newsletter',
                  label: `Newsletter (${subscribers.length})`,
                },
                {id: 'analytics', label: `Analytics (${pageViews.length})`},
                {id: 'chat', label: `Chat questions (${chatLogs.length})`},
                {id: 'settings', label: 'Settings'},
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  tab === item.id
                    ? 'bg-[var(--accent-button)] text-[var(--accent-contrast)] shadow-xs'
                    : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {notice && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text)]">
              <Check className="h-4 w-4 text-[var(--accent-text)]" />
              <span>{notice}</span>
            </div>
          )}

          {loadingData && (
            <div className="mt-6 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing data...</span>
            </div>
          )}

          {/* TAB 1: PROJECTS */}
          {tab === 'projects' && (
            <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <form
                  onSubmit={handleSaveProject}
                  className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif-display text-2xl text-[var(--text)]">
                      {editingId ? 'Edit project' : 'Add project'}
                    </h2>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-xs text-[var(--muted)] underline"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Slug
                      </label>
                      <input
                        type="text"
                        placeholder="auto-from-title"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      >
                        <option value="Web">Web</option>
                        <option value="E-commerce">E-commerce</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Year
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Status tag (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Closed Apr 2024"
                        value={statusTag}
                        onChange={(e) => setStatusTag(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      Short Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      Case Study Overview (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      Live URL (auto-generates screenshot if no image uploaded)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      GitHub URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--muted)]">
                      Thumbnail Image Override
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL or upload"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-medium text-[var(--text)]">
                        {uploadingImage ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleUploadThumbnail}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Role (optional)
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted)]">
                        Tech Stack (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Next.js, Tailwind, Supabase"
                        value={techStackInput}
                        onChange={(e) => setTechStackInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-sm text-[var(--text)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1 text-xs text-[var(--text)]">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                      />
                      <span>Published</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                      />
                      <span>Featured</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProject}
                    className="btn-primary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-medium"
                  >
                    {savingProject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>{editingId ? 'Save changes' : 'Create project'}</span>
                  </button>
                </form>
              </div>

              <div className="space-y-3 lg:col-span-7">
                <p className="text-xs text-[var(--muted)]">
                  Drag rows to reorder how projects appear on the site.
                </p>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnRow(p.id)}
                    className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <GripVertical
                        className="h-4 w-4 shrink-0 cursor-grab text-[var(--muted)]"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-serif-display text-2xl text-[var(--text)]">
                          {p.title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {p.category} · {p.year} ·{' '}
                          {p.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="btn-secondary px-3.5 py-1.5 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        aria-label={`Delete ${p.title}`}
                        className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] transition-colors hover:border-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MESSAGES INBOX */}
          {tab === 'messages' && (
            <div className="mt-8 space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
                  No contact messages yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <article
                    key={msg.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">
                          {msg.subject}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          From {msg.name} ({msg.email}) ·{' '}
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>

                      <select
                        value={msg.status}
                        aria-label={`Status for ${msg.subject}`}
                        onChange={(e) =>
                          handleMessageStatus(
                            msg.id,
                            e.target.value as ContactMessageStatus,
                          )
                        }
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)]"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-[var(--muted)]">
                      {msg.message}
                    </p>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TESTIMONIALS */}
          {tab === 'testimonials' && (
            <div className="mt-8 space-y-4">
              {testimonials.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
                  No testimonials submitted yet.
                </div>
              ) : (
                testimonials.map((t) => (
                  <article
                    key={t.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6"
                  >
                    <div className="max-w-2xl">
                      <p className="text-sm font-medium text-[var(--text)]">
                        {t.name} · {t.role}
                        {t.company ? ` (${t.company})` : ''}
                      </p>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTestimonial(t.id, !t.approved)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                          t.approved
                            ? 'bg-[var(--pop)] text-[var(--pop-contrast)]'
                            : 'btn-secondary'
                        }`}
                      >
                        {t.approved ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="rounded-full border border-[var(--border)] p-2 text-[var(--muted)] transition-colors hover:border-red-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB 4: NEWSLETTER */}
          {tab === 'newsletter' && (
            <div className="mt-8 space-y-5">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs text-[var(--muted)]">Total subscribers</p>
                  <p className="font-mono-tabular mt-0.5 text-2xl font-medium text-[var(--text)]">
                    {subscribers.length}
                  </p>
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                  <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]"
                      aria-hidden="true"
                    />
                    <label htmlFor="admin-newsletter-search" className="sr-only">
                      Search newsletter subscribers
                    </label>
                    <input
                      id="admin-newsletter-search"
                      type="search"
                      value={subscriberSearch}
                      onChange={(e) => setSubscriberSearch(e.target.value)}
                      placeholder="Search email, name, or source"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] py-2 pr-3 pl-9 text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExportSubscribersCsv}
                    disabled={subscribers.length === 0}
                    className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {filteredSubscribers.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
                  {subscribers.length === 0
                    ? 'No newsletter subscribers yet.'
                    : 'No subscribers match your search.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)]">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]">
                      <tr>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Source</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredSubscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[var(--surface)]/50">
                          <td className="px-5 py-3.5 font-medium text-[var(--text)]">
                            {sub.email}
                          </td>
                          <td className="px-5 py-3.5 text-[var(--muted)]">
                            {sub.name || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-[var(--muted)]">
                            {sub.source || 'website'}
                          </td>
                          <td className="font-mono-tabular px-5 py-3.5 text-[var(--muted)]">
                            {sub.created_at
                              ? new Date(sub.created_at).toLocaleDateString(
                                  'en-IN',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  },
                                )
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              aria-label={`Delete subscriber ${sub.email}`}
                              className="inline-flex rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] transition-colors hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {tab === 'analytics' && (
            <div className="mt-8 space-y-8">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7">
                <h2 className="font-serif-display text-2xl text-[var(--text)]">
                  Page views (last 7 days)
                </h2>
                <div className="mt-6 flex h-44 items-end gap-3">
                  {dailyViews.map((day) => {
                    const heightPct = Math.round((day.count / maxDailyCount) * 100);
                    return (
                      <div
                        key={day.date}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <span className="font-mono-tabular text-xs text-[var(--muted)]">
                          {day.count}
                        </span>
                        <div className="flex h-32 w-full items-end rounded-lg bg-[var(--surface)] p-1">
                          <div
                            className="w-full rounded-md bg-[var(--accent)] transition-all"
                            style={{height: `${Math.max(4, heightPct)}%`}}
                          />
                        </div>
                        <span className="font-mono-tabular text-[10px] text-[var(--muted)]">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHAT QUESTIONS */}
          {tab === 'chat' && (
            <div className="mt-8 space-y-4">
              {chatTableMissing && (
                <div className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text)]">
                  Run <code className="font-mono-tabular">supabase/migrations/002_chat_tables.sql</code> in the Supabase SQL Editor to persist visitor questions from Ask about Ojas.
                </div>
              )}

              {chatLogs.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted)]">
                  No chat questions logged yet.
                </div>
              ) : (
                chatLogs.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                      <span className="font-mono-tabular">
                        Visitor {entry.ip_hash ? entry.ip_hash.slice(0, 10) : 'anonymous'}
                      </span>
                      <time
                        dateTime={entry.created_at}
                        className="font-mono-tabular"
                      >
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[var(--text)]">
                      {entry.question}
                    </p>
                    <p className="mt-2 border-t border-[var(--border)] pt-3 text-sm leading-relaxed whitespace-pre-line text-[var(--muted)]">
                      {entry.answer}
                    </p>
                  </article>
                ))
              )}
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {tab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="mt-8 max-w-xl space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-7"
            >
              <h2 className="font-serif-display text-2xl text-[var(--text)]">
                Availability &amp; Hero Settings
              </h2>

              <label className="flex items-center gap-3 text-sm text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={settings.availability.enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                />
                <span>Show availability status on Hero</span>
              </label>

              <div>
                <label className="block text-xs text-[var(--muted)]">
                  Availability text
                </label>
                <input
                  type="text"
                  value={settings.availability.text}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      availability: {
                        ...prev.availability,
                        text: e.target.value,
                      },
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--muted)]">
                  Hero headline
                </label>
                <textarea
                  rows={3}
                  value={settings.hero.headline}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      hero: {headline: e.target.value},
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--text)]"
                />
              </div>

              <button
                type="submit"
                className="btn-primary px-6 py-2.5 text-sm font-medium"
              >
                Save settings
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
