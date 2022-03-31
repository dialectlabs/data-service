dotenv -e ../.env.dev -- yarn prisma migrate dev
dotenv -e ../.env.dev -- yarn prisma db seed