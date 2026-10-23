import { useState } from 'react';
import {
  GraduationCap,
  Phone,
  Plus,
  Trash2,
  Flag,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
  MapPin,
} from 'lucide-react';
import { Card, SectionTitle, Button, Input, Textarea, EmptyState, Notice, Badge } from '@/components/ui';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useData } from '@/lib/dataContext';
import type { CampusContact, IncidentReport } from '@/types';

const SAMPLE_CONTACTS: CampusContact[] = [
  { id: 's1', name: 'Campus Police', role: 'Emergency', phone: '555-0100', isSample: true },
  { id: 's2', name: 'Student Counseling Center', role: 'Counseling', phone: '555-0111', isSample: true },
  { id: 's3', name: 'Campus Health Services', role: 'Health', phone: '555-0122', isSample: true },
  { id: 's4', name: 'Title IX Office', role: 'Reporting', phone: '555-0133', isSample: true },
];

const CAMPUS_CHECKLIST = [
  'Save campus police number in your phone contacts.',
  'Know the locations of blue-light emergency phones on campus.',
  'Walk in well-lit areas at night; use the campus escort service.',
  'Keep your phone charged and share your schedule with a trusted friend.',
  'Familiarize yourself with building exits and shelter-in-place points.',
  'Report suspicious activity promptly to campus security.',
];

const INCIDENT_CATEGORIES = [
  'Theft / property damage',
  'Harassment',
  'Suspicious activity',
  'Safety hazard',
  'Wellbeing concern',
  'Other',
];

export function StudentSafety() {
  const [contacts, setContacts] = useLocalStorage<CampusContact[]>('ag_campus_contacts', SAMPLE_CONTACTS);
  const { incidents, addIncident, error: dataError } = useData();
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formErr, setFormErr] = useState('');

  function resetToSample() {
    setContacts(SAMPLE_CONTACTS);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTitle
        title="Student Safety Guardian"
        subtitle="A campus safety dashboard with emergency contacts, incident reporting, and guidance."
        icon={<GraduationCap size={18} />}
      />

      <Notice tone="info" title="About this dashboard">
        The contacts below are <strong>clearly labeled sample data</strong>. Replace
        them with your institution's official numbers in Settings or by editing them
        here. Incident reports are saved securely to your account — they are not
        submitted to your institution automatically.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contacts */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-blue-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Campus emergency contacts
              </h3>
            </div>
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add
            </Button>
          </div>

          {contacts.some((c) => c.isSample) && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <Info size={12} /> Showing sample contacts. Update with your campus's real numbers.
            </div>
          )}

          <ul className="space-y-2">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                    <Phone size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {c.name}
                      {c.isSample && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          Sample
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.role} · {c.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-300 hover:bg-blue-500/10"
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone size={14} />
                  </a>
                  <button
                    onClick={() => setContacts((list) => list.filter((x) => x.id !== c.id))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {contacts.length === 0 && !adding && (
            <EmptyState
              icon={<Phone size={18} />}
              title="No contacts configured"
              message="Add your campus's emergency numbers, or restore the sample list."
            />
          )}

          {contacts.length === 0 && (
            <button
              onClick={resetToSample}
              className="mt-3 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              Restore sample contacts
            </button>
          )}

          {adding && (
            <AddContactForm
              onAdd={(c) => {
                setContacts((list) => [...list, c]);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </Card>

        {/* Checklist */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Campus safety checklist
            </h3>
          </div>
          <CampusChecklist />
        </Card>
      </div>

      {/* Incident reports */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-blue-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Submit a safety incident report
            </h3>
          </div>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> {showForm ? 'Close' : 'New report'}
          </Button>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Reports are saved securely to your account. To officially file a report,
          contact your campus security or Title IX office directly.
        </p>

        {dataError && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> {dataError}
          </p>
        )}

        {showForm && (
          <IncidentForm
            onSubmit={async (r) => {
              try {
                setFormErr('');
                await addIncident(r);
                setShowForm(false);
              } catch (e) {
                setFormErr(e instanceof Error ? e.message : 'Failed to submit report.');
              }
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
        {formErr && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> {formErr}
          </p>
        )}

        {incidents.length === 0 ? (
          <EmptyState
            icon={<Flag size={18} />}
            title="No reports submitted"
            message="Filed reports appear here, saved securely to your account."
          />
        ) : (
          <ul className="space-y-2">
            {incidents.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{r.category}</Badge>
                  <Badge
                    tone={r.urgency === 'high' ? 'red' : r.urgency === 'medium' ? 'amber' : 'green'}
                  >
                    {r.urgency} urgency
                  </Badge>
                  <span className="ml-auto text-[10px] text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                {r.location && (
                  <p className="mb-1 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={12} /> {r.location}
                  </p>
                )}
                <p className="text-sm text-slate-300">{r.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function CampusChecklist() {
  const [checked, setChecked] = useLocalStorage<boolean[]>(
    'ag_campus_checklist',
    CAMPUS_CHECKLIST.map(() => false),
  );
  return (
    <ol className="space-y-2">
      {CAMPUS_CHECKLIST.map((step, i) => {
        const done = checked[i] ?? false;
        return (
          <li key={step}>
            <button
              onClick={() => setChecked((arr) => arr.map((v, idx) => (idx === i ? !v : v)))}
              className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left text-sm transition-colors hover:bg-white/5"
            >
              {done ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle size={17} className="mt-0.5 shrink-0 text-slate-600" />
              )}
              <span className={done ? 'text-slate-500 line-through' : 'text-slate-200'}>
                {step}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function AddContactForm({
  onAdd,
  onCancel,
}: {
  onAdd: (c: CampusContact) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  function submit() {
    if (!name.trim()) return setErr('Name is required.');
    if (!/^[0-9+\-\s()]{4,}$/.test(phone.trim())) return setErr('Enter a valid phone.');
    onAdd({
      id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      role: role.trim() || 'Contact',
      phone: phone.trim(),
      isSample: false,
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Name</label>
          <Input value={name} onChange={setName} placeholder="Campus Police" ariaLabel="Contact name" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Role / category</label>
          <Input value={role} onChange={setRole} placeholder="Emergency" ariaLabel="Role" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-400">Phone</label>
          <Input value={phone} onChange={setPhone} placeholder="555-0100" ariaLabel="Phone" />
        </div>
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={submit}>Save</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function IncidentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (r: IncidentReport) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState(INCIDENT_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [err, setErr] = useState('');

  function submit() {
    if (!description.trim()) return setErr('Please describe what happened.');
    if (description.trim().length < 10) return setErr('Please provide at least 10 characters.');
    onSubmit({
      id: '',
      category,
      location: location.trim(),
      description: description.trim(),
      urgency,
      status: 'submitted',
      createdAt: 0,
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#060d1f]/60 px-4 py-2.5 text-sm text-white focus:border-blue-400/60 focus:outline-none"
          >
            {INCIDENT_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0a1428]">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Urgency</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUrgency(u)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-colors ${
                  urgency === u
                    ? u === 'high'
                      ? 'border-red-500/40 bg-red-500/15 text-red-200'
                      : u === 'medium'
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-400">Location (optional)</label>
          <Input value={location} onChange={setLocation} placeholder="Library, 2nd floor" ariaLabel="Location" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-400">Description</label>
          <Textarea value={description} onChange={setDescription} placeholder="Describe what happened…" rows={4} ariaLabel="Description" />
        </div>
      </div>
      {err && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertTriangle size={12} /> {err}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button onClick={submit}>Submit report</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
