.PHONY: format lint dev build install

# Format and lint the codebase
format:
	npx eslint . --ext .ts,.tsx --fix
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

# Run linter only (no fixes)
lint:
	npx eslint . --ext .ts,.tsx

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Preview production build
preview:
	npm run preview
