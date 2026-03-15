const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'docs');

const CATEGORY_MAP = {
  '01-linux': 'linux', '02-networking': 'networking', '03-containers': 'docker',
  '04-kubernetes': 'k8s', '05-cloud-aws': 'aws', '06-iac': 'iac',
  '07-cicd': 'cicd', '08-observability': 'observability', '09-security': 'security',
  '10-sre': 'sre', '11-scripting': 'scripting', '12-distributed-systems': 'distributed-systems'
};

async function main() {
  // linux-commands 슬러그 검색
  const match = await prisma.blogPost.findMany({
    where: { slug: { contains: 'linux' } },
    select: { id: true, slug: true, categoryId: true, locale: true, title: true }
  });
  console.log('linux 포함 슬러그:');
  match.forEach(m => console.log(`  slug="${m.slug}" title="${m.title}" locale=${m.locale}`));

  // 카테고리 조회
  const cats = await prisma.blogCategory.findMany();
  const catSlugToId = {};
  cats.forEach(c => { catSlugToId[c.slug] = c.id; });

  // DB 전체 슬러그
  const all = await prisma.blogPost.findMany({
    select: { slug: true, categoryId: true, locale: true }
  });
  console.log('\nDB 총 게시물:', all.length);

  // categoryId + slug + locale 조합으로 Set 구성
  const dbKeys = new Set(all.map(p => `${p.categoryId}|${p.slug}|${p.locale}`));

  // 파일에서 누락된 것 찾기
  const notFound = [];
  const folders = Object.keys(CATEGORY_MAP).sort();
  for (const folder of folders) {
    const folderPath = path.join(DOCS_DIR, folder);
    if (!fs.existsSync(folderPath)) continue;
    const catSlug = CATEGORY_MAP[folder];
    const categoryId = catSlugToId[catSlug];
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const key = `${categoryId}|${slug}|ko`;
      if (!dbKeys.has(key)) {
        notFound.push({ folder, file, slug, catSlug });
      }
    }
  }

  console.log(`\nDB에 없는 파일 ${notFound.length}건:`);
  notFound.forEach(n => console.log(`  ${n.folder}/${n.file}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
