'use client';

import { useEffect, useState } from 'react';
type LocationOption = { id: string; name: string };

export default function LocationSelects({
  stateId,
  districtId,
  talukId,
  onChange,
  wrapperClassName = 'col-md-4',
  selectClassName = 'form-control',
  labelClassName = 'form-label mb-2'
}: {
  stateId: string;
  districtId: string;
  talukId: string;
  onChange: (next: { stateId: string; districtId: string; talukId: string }) => void;
  wrapperClassName?: string;
  selectClassName?: string;
  labelClassName?: string;
}) {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [taluks, setTaluks] = useState<LocationOption[]>([]);

  useEffect(() => {
    fetch('/api/states')
      .then((r) => r.json())
      .then((data) => setStates(data.states || []));
  }, []);

  useEffect(() => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    fetch(`/api/districts?stateId=${stateId}`)
      .then((r) => r.json())
      .then((data) => setDistricts(data.districts || []));
  }, [stateId]);

  useEffect(() => {
    if (!districtId) {
      setTaluks([]);
      return;
    }
    fetch(`/api/taluks?districtId=${districtId}`)
      .then((r) => r.json())
      .then((data) => setTaluks(data.taluks || []));
  }, [districtId]);

  return (
    <>
      <div className={wrapperClassName}>
        <label className={labelClassName}>State</label>
        <select
          className={selectClassName}
          value={stateId}
          onChange={(e) => onChange({ stateId: e.target.value, districtId: '', talukId: '' })}
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className={wrapperClassName}>
        <label className={labelClassName}>District</label>
        <select
          className={selectClassName}
          value={districtId}
          onChange={(e) => onChange({ stateId, districtId: e.target.value, talukId: '' })}
          disabled={!stateId}
        >
          <option value="">Select district</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className={wrapperClassName}>
        <label className={labelClassName}>Taluk</label>
        <select
          className={selectClassName}
          value={talukId}
          onChange={(e) => onChange({ stateId, districtId, talukId: e.target.value })}
          disabled={!districtId}
        >
          <option value="">Select taluk</option>
          {taluks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
