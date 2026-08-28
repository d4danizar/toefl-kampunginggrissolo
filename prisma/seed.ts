import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";

// ============================================================
// Prisma Client Setup (standalone — tidak pakai @/lib/prisma)
// ============================================================

const pool = new Pool({ connectionString: process.env.DIRECT_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================================
// Types
// ============================================================

type QuestionData = {
  section: "LISTENING" | "STRUCTURE" | "READING";
  text: string;
  passage?: string;
  audioUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

// ============================================================
// Seed
// ============================================================

async function main() {
  console.log("🌱 Mulai seeding database...\n");

  // -------------------------------------------------------
  // 1. Buat Admin User
  // -------------------------------------------------------
  const adminEmail = "admin@email.com";
  const adminPassword = "password123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      institution: "TOEFL CBT Admin",
    },
  });
  console.log(`✅ Admin user: ${admin.email} (role: ${admin.role})`);

  // -------------------------------------------------------
  // 1.5. Buat Dummy Student User
  // -------------------------------------------------------
  const studentEmail = "student@email.com";
  const studentPassword = "password123";
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: "Peserta Simulasi",
      email: studentEmail,
      password: hashedStudentPassword,
      role: "USER",
      institution: "Universitas Simulasi",
    },
  });
  console.log(`✅ Student user: ${student.email} (role: ${student.role})`);

  // -------------------------------------------------------
  // 2. Buat Batch Aktif
  // -------------------------------------------------------
  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1); // 1 bulan dari sekarang

  const batch = await prisma.batch.upsert({
    where: { id: "seed-batch-1" },
    update: {},
    create: {
      id: "seed-batch-1",
      name: "TOEFL Longman Simulation",
      description: "Simulasi tes TOEFL menggunakan standar buku Longman. Terdapat 15 soal.",
      isActive: true,
      sharedToken: "TF-SEED99",
      startDate: now,
      endDate: oneMonthLater,
    },
  });
  console.log(`✅ Batch: "${batch.name}" (ID: ${batch.id})`);

  // -------------------------------------------------------
  // 3. Baca dan Insert Soal dari JSON
  // -------------------------------------------------------
  const templatePath = join(__dirname, "..", "src", "data", "longman-template.json");
  const rawData = readFileSync(templatePath, "utf-8");
  const questions: QuestionData[] = JSON.parse(rawData);

  let inserted = 0;
  for (const q of questions) {
    await prisma.question.create({
      data: {
        text: q.text,
        section: q.section,
        passage: q.passage ?? null,
        audioUrl: q.audioUrl ?? null,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        batchId: batch.id,
      },
    });
    inserted++;
  }

  console.log(`✅ ${inserted} soal berhasil di-insert`);
  console.log(
    `   - Listening: ${questions.filter((q) => q.section === "LISTENING").length}`
  );
  console.log(
    `   - Structure: ${questions.filter((q) => q.section === "STRUCTURE").length}`
  );
  console.log(
    `   - Reading:   ${questions.filter((q) => q.section === "READING").length}`
  );

  // -------------------------------------------------------
  // 4. Generate 10 Token untuk Batch
  // -------------------------------------------------------
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const tokens: string[] = [];
  for (let i = 0; i < 10; i++) {
    let code = "TOEFL-";
    for (let j = 0; j < 6; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    tokens.push(code);
  }

  await prisma.token.createMany({
    data: tokens.map((code) => ({
      code,
      batchId: batch.id,
    })),
  });

  console.log(`✅ ${tokens.length} token di-generate:`);
  tokens.forEach((t) => console.log(`   ${t}`));

  console.log("\n🎉 Seeding selesai!");
  console.log(`\n📋 Kredensial Admin:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n🎓 Kredensial Peserta:`);
  console.log(`   Email:    student@email.com`);
  console.log(`   Password: password123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error saat seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
