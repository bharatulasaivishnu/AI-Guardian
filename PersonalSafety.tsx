import { useState } from 'react';
import {
  HeartPulse,
  Phone,
  Plus,
  Trash2,
  MapPin,
  CheckCircle2,
  Circle,
  Siren,
  X,
  AlertTriangle,
  Info,
  UserPlus,
} from 'lucide-react';
import { Card, SectionTitle, Button, Input, EmptyState, Notice, Badge } from '@/components/ui';
import { useData } from '@/lib/dataContext';
import { useLocalStorage } from '@/lib/useLocalStorage';
import type { TrustedContact } from '@/types';

const EMERGENCY_CHECKLIST = [
  'Get to a safe location if you are able to move.',
  'Call emergency services (911 in the US) if you are in immediate danger.',
  'Trigger SOS to prepare an alert with your trusted contacts.',
  'Share your live location (optional, requires your permission).',
  'Note any details: descriptions, license plates, direction of travel.',
  'Stay on the line with emergency services until help arrives.',
];

export function PersonalSafety() {
  const { contacts, addContact, removeContact, error } = useData();
  const [adding, setAdding] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [sosStage, setSosStage] = useState<'idle' | 'prepared' | 'countdown'>('idle');
  const [saveErr, setSaveErr] = useState('');

  function requestLocation() {
    setLocating(true);
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported on this device.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. You can still use SOS without location.'
            : 'Could not retrieve location. Try again.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function startSos() {
    setSosStage('prepared');
  }

  function cancelSos() {
    setSosStage('idle');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTitle
        title="Personal Safety Guardian"
        subtitle="Prepare and trigger an emergency alert, manage trusted contacts, and follow an action checklist."
        icon={<HeartPulse size={18} />}
      />

      <Notice tone="warning" title="Important">
        This app does <strong>not</strong> automatically contact emergency services or
        trusted contacts, and it does <strong>not</strong> monitor your device, SMS, or
        calls. SOS prepares an alert you can review and send yourself. No delivery is
        ever faked.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SOS panel */}
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                SOS
              </h3>
              <Badge tone={sosStage !== 'idle' ? 'red' : 'neutral'}>
                {sosStage === 'idle' ? 'Standby' : 'Active'}
              </Badge>
            </div>

            <div className="my-6 flex flex-col items-center">
              <button
                onClick={startSos}
                disabled={sosStage !== 'idle'}
                className={`relative flex h-32 w-32 items-center justify-center rounded-full text-white transition-all duration-300 ${
                  sosStage === 'idle'
                    ? 'bg-red-500 shadow-2xl shadow-red-500/40 hover:scale-105 active:scale-95'
                    : 'bg-red-600'
                }`}
                aria-label="Activate SOS"
              >
                {sosStage === 'idle' && <span className="pulse-ring absolute inset-0 rounded-full" />}
                <Siren size={40} />
              </button>
              <p className="mt-4 text-xs text-slate-400">
                {sosStage === 'idle'
                  ? 'Press to prepare an emergency alert'
                  : 'Alert prepared — review below'}
              </p>
            </div>

            {sosStage !== 'idle' && (
              <div className="animate-fade-in-up space-y-3">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <p className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={14} /> Alert prepared — not yet sent
                  </p>
                  <p className="mt-1 text-xs text-red-200/80">
                    Review the details below. Nothing has been sent to your contacts.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm">
                  <p className="font-medium text-slate-200">Message preview</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    "This is an emergency alert from AI Guardian. I may need help.
                    {location
                      ? ` My location: https://maps.google.com/?q=${location.lat},${location.lng}`
                      : ' Location not shared.'}
                    Please try to reach me."
                  </p>
                </div>

                <LocationBlock
                  location={location}
                  locating={locating}
                  error={locError}
                  onRequest={requestLocation}
                />

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-300">
                    Trusted contacts to notify manually ({contacts.length})
                  </p>
                  {contacts.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No contacts configured. Add them on the right.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {contacts.map((c) => (
                        <li key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-200">
                            {c.name} <span className="text-slate-500">· {c.relationship}</span>
                          </span>
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                          >
                            <Phone size={12} /> {c.phone}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => {
                      // Honest: we do not auto-send. Provide quick dial to 911.
                      window.location.href = 'tel:911';
                    }}
                  >
                    <Phone size={15} /> Call 911 now
                  </Button>
                  <Button variant="secondary" onClick={cancelSos}>
                    <X size={15} /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Emergency checklist */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-blue-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Emergency action checklist
            </h3>
          </div>
          <Checklist />
        </Card>
      </div>

      {/* Trusted contacts */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-blue-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Trusted contacts
            </h3>
          </div>
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={15} /> Add contact
          </Button>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          These are stored securely in your account. AI Guardian never sends
          messages to them automatically.
        </p>

        {error && (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> {error}
          </p>
        )}

        {contacts.length === 0 && !adding ? (
          <EmptyState
            icon={<UserPlus size={18} />}
            title="No trusted contacts yet"
            message="Add a few people you'd reach out to in an emergency so they're ready in the SOS panel."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {c.relationship} · {c.phone}
                  </p>
                </div>
                <button
                  onClick={() => removeContact(c.id).catch((e) => setSaveErr(e.message))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                  aria-label={`Remove ${c.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {adding && (
          <AddContactForm
            onAdd={async (c) => {
              try {
                setSaveErr('');
                await addContact(c);
                setAdding(false);
              } catch (e) {
                setSaveErr(e instanceof Error ? e.message : 'Failed to save contact.');
              }
            }}
            onCancel={() => setAdding(false)}
          />
        )}
        {saveErr && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle size={12} /> {saveErr}
          </p>
        )}
      </Card>
    </div>
  );
}

function Checklist() {
  const [checked, setChecked] = useLocalStorage<boolean[]>('ag_sos_checklist', EMERGENCY_CHECKLIST.map(() => false));
  return (
    <ol className="space-y-2">
      {EMERGENCY_CHECKLIST.map((step, i) => {
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

function LocationBlock({
  location,
  locating,
  error,
  onRequest,
}: {
  location: { lat: number; lng: number } | null;
  locating: boolean;
  error: string;
  onRequest: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <MapPin size={13} /> Location sharing
        </p>
        {!location && (
          <Button variant="secondary" onClick={onRequest} disabled={locating}>
            {locating ? 'Locating…' : 'Share location'}
          </Button>
        )}
      </div>
      {location ? (
        <div className="mt-2 text-xs text-slate-300">
          <p>
            Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
          </p>
          <a
            href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-blue-300 hover:text-blue-200"
          >
            Open in Google Maps
          </a>
        </div>
      ) : error ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300">
          <Info size={12} /> {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          Optional. Requires your explicit permission. Not shared automatically.
        </p>
      )}
    </div>
  );
}

function AddContactForm({
  onAdd,
  onCancel,
}: {
  onAdd: (c: TrustedContact) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [err, setErr] = useState('');

  function submit() {
    if (!name.trim()) return setErr('Name is required.');
    if (!/^[0-9+\-\s()]{7,}$/.test(phone.trim()))
      return setErr('Enter a valid phone number.');
    onAdd({
      id: '',
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim() || 'Contact',
    });
  }

  return (
    <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Name</label>
          <Input value={name} onChange={setName} placeholder="Jane Doe" ariaLabel="Contact name" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Relationship</label>
          <Input value={relationship} onChange={setRelationship} placeholder="Parent" ariaLabel="Relationship" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-slate-400">Phone</label>
          <Input value={phone} onChange={setPhone} placeholder="+1 555 123 4567" ariaLabel="Phone number" />
        </div>
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={submit}>Save contact</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
