const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'docs');
const AUTHOR_ID = '2173ef86-0f8d-4fe7-9438-d39bf362dcc2';

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

function fileToTitle(filename) {
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

function fileToSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function extractExcerpt(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('> ')) return trimmed.slice(2).trim().substring(0, 200);
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

function extractOrder(filename) {
  const match = filename.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function main() {
  console.log('=== 누락 게시물 추가 ===\n');

  const cats = await prisma.blogCategory.findMany();
  const catSlugToId = {};
  cats.forEach(c => { catSlugToId[c.slug] = c.id; });

  // DB의 기존 게시물 키 Set
  const all = await prisma.blogPost.findMany({
    select: { slug: true, categoryId: true, locale: true }
  });
  const dbKeys = new Set(all.map(p => `${p.categoryId}|${p.slug}|ko`));

  let created = 0;

  const folders = Object.keys(CATEGORY_MAP).sort();
  for (const folder of folders) {
    const folderPath = path.join(DOCS_DIR, folder);
    if (!fs.existsSync(folderPath)) continue;

    const catInfo = CATEGORY_MAP[folder];
    const categoryId = catSlugToId[catInfo.slug];
    if (!categoryId) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const slug = fileToSlug(file);
      const key = `${categoryId}|${slug}|ko`;
      if (dbKeys.has(key)) continue; // 이미 있으면 건너뜀

      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      await prisma.blogPost.create({
        data: {
          slug,
          title: fileToTitle(file),
          content,
          excerpt: extractExcerpt(content),
          tags: [catInfo.slug],
          categoryId,
          locale: 'ko',
          series: catInfo.slug,
          seriesOrder: extractOrder(file),
          published: true,
          publishedAt: new Date(),
          readingTime: calcReadingTime(content),
          authorId: AUTHOR_ID,
        },
      });
      created++;
      console.log(`  [CREATE] [${catInfo.name}] ${slug}`);
    }
  }

  console.log(`\n=== 완료: ${created}건 생성 ===`);
}

main()
  .catch(e => { console.error('오류:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
