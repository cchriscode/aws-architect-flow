const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prereqs = await prisma.blogPost.findMany({
    where: { slug: { contains: 'prerequisites' }, locale: 'ko' },
    select: { slug: true, updatedAt: true, category: { select: { name: true } } },
    orderBy: { slug: 'asc' }
  });
  console.log('prerequisites 게시물 (' + prereqs.length + '건):');
  prereqs.forEach(p => console.log('  [' + (p.category?.name || '?') + '] ' + p.slug + ' | updated: ' + p.updatedAt.toISOString().slice(0, 19)));

  const linuxCmd = await prisma.blogPost.findFirst({
    where: { slug: '00-linux-commands', locale: 'ko' },
    select: { slug: true, updatedAt: true, category: { select: { name: true } } }
  });
  console.log('\n00-linux-commands:', linuxCmd ? '[' + linuxCmd.category?.name + '] updated: ' + linuxCmd.updatedAt.toISOString().slice(0, 19) : 'NOT FOUND');

  const total = await prisma.blogPost.count({ where: { locale: 'ko' } });
  console.log('\nProd DB 총 게시물(ko):', total);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
