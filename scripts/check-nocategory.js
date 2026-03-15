const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 카테고리 없는 게시물
  const noCat = await prisma.blogPost.findMany({
    where: { categoryId: null, locale: 'ko' },
    select: { slug: true, title: true, published: true }
  });
  console.log('카테고리 없는 게시물 (' + noCat.length + '건):');
  noCat.forEach(p => console.log('  ' + p.slug + ' | ' + p.title + ' | published=' + p.published));

  // 카테고리별 게시물 수
  const cats = await prisma.blogCategory.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { sortOrder: 'asc' }
  });
  console.log('\n카테고리별 게시물:');
  cats.forEach(c => console.log('  ' + c.sortOrder + '. ' + c.name + ' (' + c.slug + '): ' + c._count.posts + '건'));

  const total = await prisma.blogPost.count({ where: { locale: 'ko' } });
  const totalAll = await prisma.blogPost.count();
  console.log('\n총 게시물(ko):', total);
  console.log('총 게시물(전체):', totalAll);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
