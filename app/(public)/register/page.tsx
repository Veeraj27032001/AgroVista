'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Could not create your account.');
        setBusy(false);
        return;
      }
      window.location.href = '/';
    } catch {
      toast.error('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Full Name" required {...register('name', { required: true })} error={errors.name && 'Name is required'} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Email address" type="email" required {...register('email', { required: true })} error={errors.email && 'Email is required'} />
        </div>
        <Input
          label="Password"
          type="password"
          required
          {...register('password', { required: true, minLength: 8 })}
          error={errors.password && 'At least 8 characters'}
        />
        <Input
          label="Confirm Password"
          type="password"
          required
          {...register('confirmPassword', { validate: (v) => v === watch('password') || 'Passwords do not match' })}
          error={errors.confirmPassword?.message}
        />
        <Input label="Phone" {...register('phone')} />
        <Input label="Pincode" {...register('pincode')} />
        <div className="sm:col-span-2">
          <Input label="Address" {...register('address')} />
        </div>
        <Input label="City" {...register('city')} />
        <Input label="State" {...register('state')} />
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" loading={busy}>
            Create Account
          </Button>
        </div>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
