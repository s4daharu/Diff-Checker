import type { SamplePreset } from './types';

export const SAMPLE_ORIGINAL = `def greet(name):
    # Say hello to the user
    message = "Hello, " + name + "!"
    print(message)


def calculate(a, b):
    return a * b


if __name__ == "__main__":
    greet("World")`;

export const SAMPLE_CHANGED = `def greet(name):
    """Print a friendly greeting."""
    message = f"Hello, {name}!"
    print(message)


def multiply(a, b, c=1):
    return a * b * c


def square(x):
    return multiply(x, x)


if __name__ == "__main__":
    greet("World")
    print(square(7))`;

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'python',
    label: 'Python Functions',
    category: 'Code',
    oldName: 'math_utils.py',
    newName: 'math_utils.py',
    oldText: SAMPLE_ORIGINAL,
    newText: SAMPLE_CHANGED,
  },
  {
    id: 'json',
    label: 'API Config (JSON)',
    category: 'Data',
    oldName: 'config.v1.json',
    newName: 'config.v2.json',
    oldText: `{
  "appName": "CloudMetrics",
  "version": "1.4.0",
  "environment": "staging",
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "ssl": false
  },
  "database": {
    "client": "postgres",
    "pool": { "min": 2, "max": 10 },
    "timeoutMs": 5000
  },
  "features": {
    "rateLimiting": true,
    "betaDashboard": false,
    "experimentalAi": false
  },
  "allowedOrigins": [
    "https://staging.cloudmetrics.io"
  ]
}`,
    newText: `{
  "appName": "CloudMetrics Pro",
  "version": "2.0.0",
  "environment": "production",
  "server": {
    "host": "0.0.0.0",
    "port": 443,
    "ssl": true,
    "http2": true
  },
  "database": {
    "client": "postgres",
    "pool": { "min": 5, "max": 25 },
    "timeoutMs": 3000,
    "sslMode": "require"
  },
  "features": {
    "rateLimiting": true,
    "betaDashboard": true,
    "experimentalAi": true,
    "vectorSearch": true
  },
  "allowedOrigins": [
    "https://cloudmetrics.io",
    "https://app.cloudmetrics.io"
  ]
}`,
  },
  {
    id: 'typescript',
    label: 'React Hook (TypeScript)',
    category: 'Code',
    oldName: 'useUser.ts',
    newName: 'useUser.ts',
    oldText: `import { useState, useEffect } from 'react';

export function useUser(userId: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users/' + userId)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  return { user, loading };
}`,
    newText: `import { useState, useEffect, useTransition } from 'react';
import type { UserProfile } from './types';

export function useUser(userId: string) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    startTransition(async () => {
      try {
        setError(null);
        const res = await fetch(\`/api/v2/users/\${userId}\`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    });

    return () => controller.abort();
  }, [userId]);

  return { user, loading: isPending, error };
}`,
  },
  {
    id: 'markdown',
    label: 'Release Notes (Markdown)',
    category: 'Docs',
    oldName: 'CHANGELOG_v1.md',
    newName: 'CHANGELOG_v2.md',
    oldText: `# Changelog

## [1.2.0] - 2024-03-10
### Features
- Added basic text diffing
- Added side-by-side mode

### Bug Fixes
- Fixed file upload encoding issue
- Fixed scroll jumping on large texts`,
    newText: `# Changelog

## [2.0.0] - 2024-04-01
### Features
- Complete UI redesign with modern dark & light themes
- Added interactive context gap expansion
- Added diff jump navigation with minimap
- Added Markdown and HTML report export options
- Added JSON formatting and text transform tools

### Performance
- Offloaded all diff calculations to Web Workers
- Added fast intra-line diff highlighting with char & word granularity

### Bug Fixes
- Fixed unified inline diff grid column alignment
- Fixed file name persistence in patch headers`,
  },
  {
    id: 'sql',
    label: 'SQL Migration',
    category: 'Database',
    oldName: 'schema_v1.sql',
    newName: 'schema_v2.sql',
    oldText: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);`,
    newText: `CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;`,
  },
];
