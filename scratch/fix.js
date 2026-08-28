const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const questions = await prisma.question.findMany({
    where: { section: 'STRUCTURE' },
    orderBy: { createdAt: 'asc' }
  });
  
  if (questions.length > 1 && questions[0].optionA !== 'INSTRUCTION' && questions[1].optionA === 'INSTRUCTION') {
    const t0 = questions[0].createdAt;
    const t1 = questions[1].createdAt;
    
    await prisma.question.update({ where: { id: questions[0].id }, data: { createdAt: t1 } });
    await prisma.question.update({ where: { id: questions[1].id }, data: { createdAt: t0 } });
    
    console.log('Fixed DB!');
  } else {
    console.log('No fix needed in DB');
  }
}

fix().then(() => prisma.$disconnect());
