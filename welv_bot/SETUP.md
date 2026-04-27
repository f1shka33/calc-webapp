# welv_bot — quick setup

This subdirectory contains the full welv_bot Next.js scaffold. Treat it as the project root once you `cd` into it.

```bash
cd welv_bot
cp .env.example .env
# edit DATABASE_URL, NEXTAUTH_SECRET, etc.
npm install
npm run prisma:migrate     # apply the included `init` migration
npm run db:seed            # 10 categories, 10 products, admin user
npm run dev
# http://localhost:3000
```

See `welv_bot/README.md` for the full feature list and deployment notes.
