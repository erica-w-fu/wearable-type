import React, { useEffect, useState } from 'react';

export default function PosedView() {
  const [filenames, setFilenames] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetch(`${import.meta.env.BASE_URL}posed/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setFilenames([]);
          setLoadError('manifest must be a JSON array of filenames');
          return;
        }
        const names = data.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
        const safe = names.filter((n) => !n.includes('/') && !n.includes('\\') && !n.includes('..'));
        setFilenames(safe);
      })
      .catch(() => {
        if (!cancelled) {
          setFilenames([]);
          setLoadError(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="posedStage">
      <div className="posedGrid">
        {filenames.map((name) => (
          <figure key={name} className="posedCell">
            <img
              className="posedImg"
              src={`${import.meta.env.BASE_URL}posed/${encodeURIComponent(name)}`}
              alt={name}
              loading="lazy"
              draggable={false}
            />
          </figure>
        ))}
      </div>
      {filenames.length === 0 && (
        <p className="posedEmpty" role="status">
          {loadError ??
            'No posed images yet. Add files under public/posed/ and list their filenames in public/posed/manifest.json.'}
        </p>
      )}
    </section>
  );
}
