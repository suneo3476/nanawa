# Configuration Reference

This document provides a reference for the core configuration settings used in the 七輪アーカイブ project.

## Next.js Configuration

File: `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static Site Generation (SSG) output setting
  output: 'export',
  
  // Required for Amplify deployment
  trailingSlash: true,
  
  // TypeScript build error handling
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint error handling
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // React strict mode
  reactStrictMode: true,

  // Webpack configuration
  webpack: (config) => {
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...config.resolve.extensions];
    return config;
  },
};

export default nextConfig;
```

## Tailwind CSS Configuration

File: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## AWS Amplify Configuration

File: `amplify.yml`

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - echo "AMPLIFY_DIFF_DEPLOY=false" >> .env
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Redirect Configuration

File: `public/_redirects`

```
/*    /index.html   200
/lives/*    /search    301
/songs/*    /search    301
```

## Package.json Scripts

File: `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build",
    "verify-ssg": "node bin/verify-ssg.js",
    "yaml-to-tsv": "./script/yaml-tsv.sh to-tsv",
    "tsv-to-yaml": "./script/yaml-tsv.sh to-yaml"
  }
}
```

## Data Conversion Scripts

### YAML-TSV Converter Script

File: `script/yaml-tsv-converter.js`

This script converts between YAML and TSV formats for data management:

- Convert YAML to TSV: `node yaml-tsv-converter.js to-tsv`
- Convert TSV to YAML: `node yaml-tsv-converter.js to-yaml`

Key functions:
- `loadYamlFile<T>(filePath)`: Loads and parses a YAML file
- `arrayToTsv(array)`: Converts an array of objects to TSV format
- `tsvToArray(tsv)`: Converts TSV text to an array of objects

### YAML-TSV Shell Script

File: `script/yaml-tsv.sh`

Shell script wrapper for the converter:

- Convert to TSV: `./script/yaml-tsv.sh to-tsv`
- Convert to YAML: `./script/yaml-tsv.sh to-yaml`

This script:
1. Checks dependencies
2. Verifies file existence
3. Runs conversion
4. Displays results

## TypeScript Configuration

File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Directory Structure

```
.
├── data_yaml/         # YAML data source files
│   ├── lives.yml      # Live performance data
│   ├── songs.yml      # Song data
│   ├── setlists.yml   # Setlist data
│   ├── albums.yml     # Album data
│   └── album_tracks.yml # Album track data
├── data_tsv/          # TSV format for editing
├── public/            # Static public assets
│   └── _redirects     # Redirect configuration
├── script/            # Utility scripts
│   ├── yaml-tsv-converter.js
│   └── yaml-tsv.sh
├── src/               # Source code
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── next.config.mjs    # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── amplify.yml        # AWS Amplify configuration
```

## Key Dependencies

From package.json:

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",
    "lucide-react": "^0.476.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.1"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.20",
    "eslint": "^9",
    "eslint-config-next": "15.1.7",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  }
}
```

## Static Data Loader Configuration

File: `src/utils/static-data-loader.ts`

The static data loader implements a custom caching mechanism:

```typescript
// Data cache (loaded only once during build)
let cachedLives: Live[] | null = null;
let cachedSongs: Song[] | null = null;
let cachedSetlists: SetlistItem[] | null = null;
let cachedAlbums: Album[] | null = null;
let cachedAlbumTracks: AlbumTrack[] | null = null;
```

Key functions:
- `loadLivesData()`: Loads live performance data
- `loadSongsData()`: Loads song data
- `loadSetlistsData()`: Loads setlist data
- `loadAlbumsData()`: Loads album data
- `loadAlbumTracksData()`: Loads album track data
- `preloadAllData()`: Preloads all data at once for build

## Component Naming Conventions

The project follows these component naming conventions:

1. **File Structure**:
   - Component files: PascalCase (e.g., `LiveCard.tsx`)
   - Utility files: camelCase (e.g., `searchUtils.ts`)
   - Type definitions: camelCase (e.g., `live.ts`)

2. **Directory Structure**:
   - Component directory: PascalCase (e.g., `LiveCard/`)
   - Each component has its own directory with:
     - Main component file (e.g., `LiveCard.tsx`)
     - Index file for exports (e.g., `index.ts`)
     - Utility files as needed

3. **Component Declaration**:
   - Functional components with explicit React.FC typing:
   ```tsx
   export const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
     // Implementation
   };
   ```

4. **Component Export Pattern**:
   - Default export through index.ts:
   ```tsx
   // index.ts
   export { ComponentName } from './ComponentName';
   export default ComponentName;
   ```

## Settings Context Configuration

The application uses React Context for settings management:

```tsx
// src/components/Settings/SettingsContext.tsx
type SettingsContextType = {
  breadcrumbsMode: 'history' | 'location';
  setBreadcrumbsMode: (mode: 'history' | 'location') => void;
  isBreadcrumbsEnabled: boolean;
  setIsBreadcrumbsEnabled: (enabled: boolean) => void;
};

// Settings are stored in localStorage
localStorage.setItem('breadcrumbsMode', mode);
localStorage.setItem('isBreadcrumbsEnabled', String(enabled));
```
