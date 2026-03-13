const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'docs');
const AUTHOR_ID = 'ddd1156d-cfa9-4848-8e39-a40e4180edd7'; // bj132403@gmail.com

// 카테고리 매핑: 폴더명 → { name, slug, sortOrder }
const CATEGORY_MAP = {
  '01-linux':               { name: 'Linux',               slug: 'linux',               sortOrder: 1 },
  '02-networking':          { name: 'Networking',           slug: 'networking',           sortOrder: 2 },
  '03-containers':          { name: 'Docker',               slug: 'docker',               sortOrder: 3 },
  '04-kubernetes':          { name: 'Kubernetes',           slug: 'k8s',                  sortOrder: 4 },
  '05-cloud-aws':           { name: 'AWS',                  slug: 'aws',                  sortOrder: 5 },
  '06-iac':                 { name: 'IaC',                  slug: 'iac',                  sortOrder: 6 },
  '07-cicd':                { name: 'CI/CD',                slug: 'cicd',                 sortOrder: 7 },
  '08-observability':       { name: 'Observability',        slug: 'observability',        sortOrder: 8 },
  '09-security':            { name: 'Security',             slug: 'security',             sortOrder: 9 },
  '10-sre':                 { name: 'SRE',                  slug: 'sre',                  sortOrder: 10 },
  '11-scripting':           { name: 'Scripting',            slug: 'scripting',            sortOrder: 11 },
  '12-distributed-systems': { name: 'Distributed Systems',  slug: 'distributed-systems',  sortOrder: 12 },
};

// 파일명 → 제목 변환: "02-vpc.md" → "02 vpc"
function fileToTitle(filename) {
  return filename
    .replace(/\.md$/, '')
    .replace(/-/g, ' ');
}

// 파일명 → 슬러그: "02-vpc.md" → "02-vpc"
function fileToSlug(filename) {
  return filename.replace(/\.md$/, '');
}

// content에서 excerpt 추출 (첫 번째 > 인용문 또는 첫 문단)
function extractExcerpt(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('> ')) {
      return trimmed.slice(2).trim().substring(0, 200);
    }
  }
  // > 인용문이 없으면 첫 번째 일반 텍스트 문단
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('---') && !trimmed.startsWith('|')) {
      return trimmed.substring(0, 200);
    }
  }
  return '';
}

// 읽기 시간 계산 (한국어 기준 분당 ~500자)
function calcReadingTime(content) {
  const charCount = content.replace(/```[\s\S]*?```/g, '').replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(charCount / 500));
}

// 파일번호 추출: "02-vpc.md" → 2
function extractOrder(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function main() {
  console.log('=== 강의 파일 DB 임포트 시작 ===\n');

  // 1. 카테고리 upsert (기존 것 업데이트 + 신규 생성)
  console.log('[1/3] 카테고리 생성/업데이트...');
  const categoryIds = {};

  for (const [folder, cat] of Object.entries(CATEGORY_MAP)) {
    const result = await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder },
    });
    categoryIds[folder] = result.id;
    console.log(`  ${cat.sortOrder < 10 ? ' ' : ''}${cat.sortOrder}. ${cat.name} (${cat.slug}) → ${result.id.substring(0, 8)}...`);
  }

  // 2. 각 폴더의 .md 파일 읽어서 블로그 포스트로 삽입
  console.log('\n[2/3] 강의 파일 임포트...');
  let created = 0;
  let skipped = 0;

  const folders = Object.keys(CATEGORY_MAP).sort();
  for (const folder of folders) {
    const folderPath = path.join(DOCS_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`  ⚠️  ${folder}/ 폴더 없음 — 건너뜀`);
      continue;
    }

    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.md'))
      .sort();

    const catInfo = CATEGORY_MAP[folder];

    for (const file of files) {
      const slug = fileToSlug(file);
      const title = fileToTitle(file);
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const excerpt = extractExcerpt(content);
      const readingTime = calcReadingTime(content);
      const seriesOrder = extractOrder(file);

      // 이미 존재하면 건너뜀
      const existing = await prisma.blogPost.findUnique({ where: { slug } });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.blogPost.create({
        data: {
          slug,
          title,
          content,
          excerpt,
          tags: [catInfo.slug],
          categoryId: categoryIds[folder],
          series: catInfo.slug,
          seriesOrder,
          published: true,
          publishedAt: new Date(),
          readingTime,
          authorId: AUTHOR_ID,
        },
      });
      created++;
      console.log(`  ✅ [${catInfo.name}] ${title}`);
    }
  }

  // 3. 루트 파일 처리 (00-overview.md)
  const overviewPath = path.join(DOCS_DIR, '00-overview.md');
  if (fs.existsSync(overviewPath)) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: '00-overview' } });
    if (!existing) {
      const content = fs.readFileSync(overviewPath, 'utf-8');
      await prisma.blogPost.create({
        data: {
          slug: '00-overview',
          title: '00 overview',
          content,
          excerpt: extractExcerpt(content),
          tags: ['devops', 'roadmap'],
          series: 'overview',
          seriesOrder: 0,
          published: true,
          publishedAt: new Date(),
          readingTime: calcReadingTime(content),
          authorId: AUTHOR_ID,
        },
      });
      created++;
      console.log(`  ✅ [Overview] 00 overview`);
    }
  }

  console.log(`\n[3/3] 완료!`);
  console.log(`  생성: ${created}건`);
  console.log(`  건너뜀(이미 존재): ${skipped}건`);

  // 최종 확인
  const totalPosts = await prisma.blogPost.count();
  const totalCats = await prisma.blogCategory.count();
  console.log(`\n  DB 총 카테고리: ${totalCats}개`);
  console.log(`  DB 총 포스트: ${totalPosts}개`);
}

main()
  .catch(e => { console.error('오류:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
