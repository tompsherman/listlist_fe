/**
 * Data Explorer Page
 * Schema browser with live database data
 * Protected by DATA_SECRET env var
 */

import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import CollapsibleCard from '../components/ui/CollapsibleCard';
import api from '../services/api';

const DATA_SECRET = import.meta.env.VITE_DATA_SECRET || '';
const STORAGE_KEY = 'data_explorer_unlocked';

export default function Data() {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelData, setModelData] = useState({}); // { modelName: { documents, page, total, loading } }

  // Check if already unlocked
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setUnlocked(true);
    }
  }, []);

  // Fetch models when unlocked
  useEffect(() => {
    if (unlocked) {
      fetchModels();
    }
  }, [unlocked]);

  const fetchModels = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/schema/models', {
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setModels(response);
    } catch (err) {
      setError(err.message || 'Failed to fetch models');
      // If unauthorized, clear session
      if (err.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchModelData = useCallback(async (modelName, page = 1) => {
    setModelData((prev) => ({
      ...prev,
      [modelName]: { ...prev[modelName], loading: true },
    }));

    try {
      const response = await api.get(`/api/schema/data/${modelName}`, {
        params: { page, limit: 10 },
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setModelData((prev) => ({
        ...prev,
        [modelName]: {
          documents: response,
          page: response._meta?.page || page,
          total: response._meta?.total || 0,
          pages: response._meta?.pages || 1,
          loading: false,
        },
      }));
    } catch (err) {
      setModelData((prev) => ({
        ...prev,
        [modelName]: { error: err.message, loading: false },
      }));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (secret === DATA_SECRET) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
    } else {
      setError('Invalid secret');
      setSecret('');
    }
  };

  // Password gate
  if (!unlocked) {
    return (
      <>
        <SEO title="Data Explorer" description="Database schema explorer" path="/data" noIndex />
        <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--space-12)' }}>
          <h1>🗄️ Data Explorer</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
            Enter the data secret to continue.
          </p>
          <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-8)', maxWidth: '400px', margin: 'var(--space-8) auto 0' }}>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter secret..."
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                fontSize: 'var(--text-base)',
                border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                outline: 'none',
              }}
            />
            {error && (
              <p style={{ color: 'var(--color-error)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-4)', padding: 'var(--space-3)' }}
              disabled={!secret}
            >
              Enter
            </button>
          </form>
        </div>
      </>
    );
  }

  // Main explorer view
  return (
    <>
      <SEO title="Data Explorer" description="Database schema explorer" path="/data" noIndex />
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-12)' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1>🗄️ Data Explorer</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
            Browse database schemas and live data
          </p>
        </div>

        {loading && <p>Loading models...</p>}
        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {models.map((model) => (
            <CollapsibleCard key={model.name} title={`${model.name} (${model.documentCount})`} icon="📋">
              {/* Schema Fields */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Schema Fields
                </h4>
                <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Field</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Required</th>
                      <th style={{ textAlign: 'left', padding: 'var(--space-2)', fontWeight: 'var(--font-semibold)' }}>Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.fields.map((field) => (
                      <tr key={field.name} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-2)', fontFamily: 'var(--font-mono, monospace)' }}>{field.name}</td>
                        <td style={{ padding: 'var(--space-2)' }}>
                          <code style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                            {field.type}
                            {field.arrayType && `<${field.arrayType}>`}
                          </code>
                        </td>
                        <td style={{ padding: 'var(--space-2)' }}>
                          {field.required ? '✓' : '—'}
                        </td>
                        <td style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {field.enum && `enum: ${field.enum.join(', ')}`}
                          {field.default !== undefined && `default: ${JSON.stringify(field.default)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Documents */}
              <CollapsibleCard
                title={`📦 Documents (${model.collection})`}
                className="nested-card"
                icon=""
              >
                <DataViewer
                  modelName={model.name}
                  data={modelData[model.name]}
                  onLoad={() => fetchModelData(model.name)}
                  onPageChange={(page) => fetchModelData(model.name, page)}
                />
              </CollapsibleCard>
            </CollapsibleCard>
          ))}
        </div>
      </div>

      <style>{`
        .nested-card {
          margin-top: var(--space-4);
          background-color: var(--color-bg-secondary);
        }
        .nested-card .collapsible-card-header {
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
        }
      `}</style>
    </>
  );
}

/**
 * DataViewer Component
 * Displays paginated documents for a model
 */
function DataViewer({ modelName, data, onLoad, onPageChange }) {
  // Load data on first render
  useEffect(() => {
    if (!data) {
      onLoad();
    }
  }, [data, onLoad]);

  if (!data || data.loading) {
    return <p style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Loading...</p>;
  }

  if (data.error) {
    return <p style={{ padding: 'var(--space-4)', color: 'var(--color-error)' }}>{data.error}</p>;
  }

  if (!data.documents || data.documents.length === 0) {
    return <p style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>No documents found</p>;
  }

  return (
    <div>
      {/* Documents list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {data.documents.map((doc, index) => (
          <details key={doc.id || doc._id || index} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <summary style={{ padding: 'var(--space-3)', cursor: 'pointer', fontFamily: 'var(--font-mono, monospace)', fontSize: 'var(--text-sm)' }}>
              {doc.id || doc._id || `Document ${index + 1}`}
              {doc.email && ` — ${doc.email}`}
              {doc.name && ` — ${doc.name}`}
              {doc.title && ` — ${doc.title}`}
            </summary>
            <pre style={{
              padding: 'var(--space-4)',
              margin: 0,
              fontSize: 'var(--text-xs)',
              overflow: 'auto',
              maxHeight: '300px',
              backgroundColor: 'var(--color-bg-secondary)',
              borderTop: '1px solid var(--color-border)',
            }}>
              {JSON.stringify(doc, null, 2)}
            </pre>
          </details>
        ))}
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(data.page - 1)}
            disabled={data.page <= 1}
            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Page {data.page} of {data.pages} ({data.total} total)
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(data.page + 1)}
            disabled={data.page >= data.pages}
            style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
