const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'docs');

const CATEGORY_MAP = {
  '01-linux':               { name: 'Linux',               slug: 'linux'               },
  '02-networking':          { name: 'Networking',           slug: 'networking'           },
  '03-containers':          { name: 'Docker',               slug: 'containers'           },
  '04-kubernetes':          { name: 'Kubernetes',           slug: 'kubernetes'            },
  '05-cloud-aws':           { name: 'AWS',                  slug: 'cloud-aws'             },
  '06-iac':                 { name: 'IaC',                  slug: 'iac'                  },
  '07-cicd':                { name: 'CI/CD',                slug: 'cicd'                 },
  '08-observability':       { name: 'Observability',        slug: 'observability'        },
  '09-security':            { name: 'Security',             slug: 'security'             },
  '10-sre':                 { name: 'SRE',                  slug: 'sre'                  },
  '11-scripting':           { name: 'Scripting',            slug: 'scripting'            },
  '12-distributed-systems': { name: 'Distributed Systems',  slug: 'distributed-systems'  },
};

function fileToSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function extractExcerpt(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('> ')) {
      return trimmed.slice(2).trim().substring(0, 200);
    }
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('---') && !trimmed.startsWith('|')) {
      return trimmed.substring(0, 200);
    }
  }
  return '';
}

function calcReadingTime(content) {
  const charCount = content.replace(/```[\s\S]*?```/g, '').replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(charCount / 500));
}

async function main() {
  console.log('=== 강의 콘텐츠 업데이트 시작 ===\n');

  // 1. DB에서 카테고리 ID 조회
  const categories = await prisma.blogCategory.findMany();
  const catSlugToId = {};
  for (const cat of categories) {
    catSlugToId[cat.slug] = cat.id;
  }
  console.log(`카테고리 ${categories.length}개 로드\n`);

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  const folders = Object.keys(CATEGORY_MAP).sort();
  for (const folder of folders) {
    const folderPath = path.join(DOCS_DIR, folder);
    if (!fs.existsSync(folderPath)) continue;

    const catInfo = CATEGORY_MAP[folder];
    const categoryId = catSlugToId[catInfo.slug];
    if (!categoryId) {
      console.log(`  [SKIP] ${catInfo.name} - 카테고리 없음`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md')).sort();

    for (const file of files) {
      const slug = fileToSlug(file);
      const filePath = path.join(folderPath, file);
      const newContent = fs.readFileSync(filePath, 'utf-8');
      const newExcerpt = extractExcerpt(newContent);
      const newReadingTime = calcReadingTime(newContent);

      // slug + categoryId + locale로 기존 게시물 찾기
      const existing = await prisma.blogPost.findFirst({
        where: { slug, categoryId, locale: 'ko' },
        select: { id: true, content: true },
      });

      if (!existing) {
        notFound++;
        continue;
      }

      // content가 동일하면 건너뜀
      if (existing.content === newContent) {
        unchanged++;
        continue;
      }

      // content, excerpt, readingTime만 업데이트 (나머지 유지)
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          content: newContent,
          excerpt: newExcerpt,
          readingTime: newReadingTime,
        },
      });
      updated++;
      console.log(`  [UPDATE] [${catInfo.name}] ${slug}`);
    }
  }

  // 루트 overview 처리
  const overviewPath = path.join(DOCS_DIR, '00-overview.md');
  if (fs.existsSync(overviewPath)) {
    const newContent = fs.readFileSync(overviewPath, 'utf-8');
    const existing = await prisma.blogPost.findFirst({
      where: { slug: '00-overview', locale: 'ko' },
      select: { id: true, content: true },
    });
    if (existing && existing.content !== newContent) {
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          content: newContent,
          excerpt: extractExcerpt(newContent),
          readingTime: calcReadingTime(newContent),
        },
      });
      updated++;
      console.log(`  [UPDATE] [Overview] 00-overview`);
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`  업데이트: ${updated}건`);
  console.log(`  변경 없음: ${unchanged}건`);
  console.log(`  DB에 없음: ${notFound}건`);
}

main()
  .catch(e => { console.error('오류:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
