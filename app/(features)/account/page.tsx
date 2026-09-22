'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { User } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          window.location.href = `/login?redirect=${encodeURIComponent('/account')}`;
          return;
        }
        setUser(data.user);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error('Could not save changes.');
      return;
    }
    setUser(data.user);
    toast.success('Profile updated');
  }

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <form onSubmit={handleSave} className="grid max-w-lg gap-4">
        <Input label="Full Name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
        <Input label="Email" value={user.email} disabled />
        <Input label="Phone" value={user.phone || ''} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
        <Input label="Address" value={user.address || ''} onChange={(e) => setUser({ ...user, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" value={user.city || ''} onChange={(e) => setUser({ ...user, city: e.target.value })} />
          <Input label="State" value={user.state || ''} onChange={(e) => setUser({ ...user, state: e.target.value })} />
        </div>
        <Input label="Pincode" value={user.pincode || ''} onChange={(e) => setUser({ ...user, pincode: e.target.value })} />
        <Button type="submit" loading={busy} className="w-fit">
          Save Changes
        </Button>
      </form>
    </div>
  );
}
