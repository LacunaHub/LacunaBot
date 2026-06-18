# Lacuna Website

Web Dashboard for the Lacuna Discord bot. Built with Vue 3 and Quasar Framework.

## Tech Stack

- **Framework:** Vue 3 with Composition API
- **UI Framework:** Quasar 2
- **Build Tool:** Vite (via @quasar/app-vite)
- **State Management:** Pinia
- **Routing:** vue-router
- **Internationalization:** vue-i18n

## Prerequisites

- Node.js v22

## Getting Started

### Install Dependencies

```bash
npm ci
```

### Development

Start the development server with hot-reload:

```bash
quasar dev
```

### Production Build

```bash
quasar build
```

## Code Quality

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Project Structure

```
src/
├── assets/          # Static assets (images, SVGs)
├── boot/            # App initialization plugins
├── components/      # Reusable Vue components
│   └── dialogs/     # Dialog/modal components
├── css/             # Global styles and fonts
├── layouts/         # Page layout components
├── pages/           # Route page components
├── router/          # Vue Router configuration
├── stores/          # Pinia stores
└── utils/           # Utility functions
```

## Configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js) for customization options.
