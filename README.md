# Image Creator App

A minimal image generator web app that turns text prompts into images using OpenAI's `gpt-image-1` model.

## Setup

1. Copy env vars:

```bash
cp .env.example .env
```

2. Add your API key in `.env` or export it in your shell.

3. Start the app:

```bash
npm start
```

4. Open `http://localhost:3000`.

## Notes

- The backend calls OpenAI's image generation API directly.
- Prompt processing and generation are subject to the API provider's policies and safeguards.
