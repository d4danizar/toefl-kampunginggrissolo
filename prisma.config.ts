import { defineConfig } from '@prisma/config'
import { config } from 'dotenv'

// Paksa baca file .env
config()

export default defineConfig({
  datasource: {
    // Gunakan DIRECT_URL untuk push/migration (best practice Supabase)
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
