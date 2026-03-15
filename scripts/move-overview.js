const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Notice 카테고리 찾기
  const notice = await prisma.blogCategory.findFirst({
    where: { name: { contains: 'Notice', mode: 'insensitive' } }
  });

  if (!notice) {
    console.log('Notice 카테고리를 찾을 수 없습니다.');
    const all = await prisma.blogCategory.findMany({ orderBy: { sortOrder: 'asc' } });
    console.log('현재 카테고리:');
    all.forEach(c => console.log('  ' + c.sortOrder + '. ' + c.name + ' (' + c.slug + ')'));
    return;
  }

  console.log('Notice 카테고리:', notice.id.substring(0, 8), notice.slug);

  // 카테고리 없는 게시물 이동
  const result = await prisma.blogPost.updateMany({
    where: { categoryId: null },
    data: { categoryId: notice.id }
  });

  console.log(result.count + '건 Notice 카테고리로 이동 완료');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
