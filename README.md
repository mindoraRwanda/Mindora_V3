# Mindora V3

A monorepo project built with Node.js, TypeScript, and npm workspaces for managing multiple applications, packages, and services.

## Project Overview

Mindora V3 is organized as a monorepo using npm workspaces, allowing you to manage multiple related projects within a single repository. The structure includes:

- **apps/** - Application projects
- **packages/** - Reusable packages and libraries
- **services/** - Backend services and microservices

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher, comes with Node.js)
- **Git** (for version control)

You can verify your installations with:

```bash
node --version
npm --version
git --version
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mindoraRwanda/Mindora_V3.git
cd Mindora_V3
```

### 2. Install Dependencies

Install all dependencies for the monorepo and its workspaces:

```bash
npm install
```

This command will:
- Install root-level dependencies (ESLint, Prettier, TypeScript)
- Set up npm workspaces
- Prepare all packages in `apps/`, `packages/`, and `services/` directories

### 3. Verify Installation

Run the linter to verify everything is set up correctly:

```bash
npm run lint
```

If you see "No errors", the installation was successful.

## Project Structure

```
Mindora_V3/
├── apps/                    # Application projects
├── packages/                # Reusable packages and libraries
├── services/                # Backend services
├── .git/                    # Git repository
├── .gitignore              # Git ignore rules
├── .prettierrc              # Prettier code formatting config
├── eslint.config.js         # ESLint configuration
├── package.json             # Root package configuration with workspaces
├── package-lock.json        # Locked dependency versions
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## Available Scripts

The following npm scripts are available at the root level:

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm test` | Run tests (currently not configured) |
| `npm run lint` | Run ESLint to check code quality |

### Running Scripts in Workspaces

To run a script in a specific workspace:

```bash
npm run <script> -w apps/<app-name>
npm run <script> -w packages/<package-name>
npm run <script> -w services/<service-name>
```

## Development Tools

### ESLint
Code linting tool configured in `eslint.config.js`:
- Enforces single quotes
- Warns about unused variables
- Allows console statements
- Uses semicolons

### Prettier
Code formatter configured in `.prettierrc`:
- 2-space indentation
- Single quotes
- Semicolons enabled
- Trailing commas in ES5-compatible syntax

To format your code:

```bash
npx prettier --write .
```

## TypeScript Configuration

The project includes a `tsconfig.json` with:
- **Target**: ES2022
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **ES Module Interop**: Enabled

**Note**: When adding TypeScript files, ensure they are in the `apps/`, `packages/`, or `services/` directories to be picked up by the TypeScript compiler.

## Getting Started with Development

1. **Create a new app/package/service**:
   ```bash
   mkdir -p apps/my-app
   cd apps/my-app
   npm init -y
   ```

2. **Add a package.json** to the new workspace with a `name` field

3. **Create TypeScript files** in the appropriate directories

4. **Run linting** to ensure code quality:
   ```bash
   npm run lint
   ```

## Troubleshooting

### Issue: "No inputs were found in config file"

**Problem**: TypeScript compiler can't find any input files.

**Solution**: 
- Ensure you have `.ts` or `.tsx` files in the `apps/`, `packages/`, or `services/` directories
- Or create at least one placeholder file:
  ```bash
  mkdir -p apps/example
  echo "console.log('Hello, Mindora!');" > apps/example/index.ts
  ```

### Issue: Node modules not found after clone

**Solution**:
```bash
npm install
```

### Issue: ESLint errors on startup

**Solution**:
```bash
npm run lint
```

Review the output and fix any linting issues in your code.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run `npm run lint` to ensure code quality
4. Commit and push your changes
5. Create a pull request

## License

ISC

## Repository

[GitHub: mindoraRwanda/Mindora_V3](https://github.com/mindoraRwanda/Mindora_V3)

## Support

For issues and questions, visit the [GitHub Issues](https://github.com/mindoraRwanda/Mindora_V3/issues) page.
