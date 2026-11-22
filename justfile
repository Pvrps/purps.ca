default:
    @just --list

# Update devenv inputs (nixpkgs, devenv module versions) and sync deps
update:
    devenv update
    bun install

# Garbage collect old devenv generations
gc:
    devenv gc

# Clean devenv cache (forces full rebuild on next shell)
clean:
    rm -rf .devenv devenv.lock

# Enter the devenv shell
shell:
    devenv shell

# Install dependencies
install:
    devenv shell -- bun install

# Start dev server
dev:
    devenv shell -- bun run dev

# Build for production
build:
    devenv shell -- bun run build

# Preview built app
preview:
    devenv shell -- bun run preview

# Run the tests
test:
    devenv shell -- bun test

# Type check
check:
    devenv shell -- bun run check

# Lint
lint:
    devenv shell -- bun run lint

# Format
format:
    devenv shell -- bun run format
