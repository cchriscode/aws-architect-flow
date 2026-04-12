const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DOCS_EN_DIR = path.join(__dirname, '..', 'docs', 'docs-en');

function fileToSlug(filename) {
  return filename.replace(/\.md$/, '');
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : '';
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

// Map folder names to category slugs (try multiple candidates)
const FOLDER_TO_SLUG_CANDIDATES = {
  '01-linux':               ['linux'],
  '02-networking':          ['networking'],
  '03-containers':          ['containers', 'docker'],
  '04-kubernetes':          ['kubernetes', 'k8s'],
  '05-cloud-aws':           ['cloud-aws', 'aws'],
  '06-iac':                 ['iac'],
  '07-cicd':                ['cicd'],
  '08-observability':       ['observability'],
  '09-security':            ['security'],
  '10-sre':                 ['sre'],
  '11-scripting':           ['scripting'],
  '12-distributed-systems': ['distributed-systems'],
};

async function main() {
  console.log('=== English Lecture Sync Start ===\n');

  // 1. Load categories from DB
  const categories = await prisma.blogCategory.findMany();
  const catSlugToId = {};
  for (const cat of categories) {
    catSlugToId[cat.slug] = cat.id;
  }
  console.log(`Categories loaded: ${categories.length}`);
  console.log(`  Slugs: ${Object.keys(catSlugToId).join(', ')}\n`);

  // 2. Load all existing Korean posts for reference
  const koPosts = await prisma.blogPost.findMany({
    where: { locale: 'ko' },
    select: { id: true, slug: true, categoryId: true, tags: true, series: true, seriesOrder: true, authorId: true, published: true, publishedAt: true },
  });
  const koPostMap = {};
  for (const p of koPosts) {
    koPostMap[`${p.categoryId}|${p.slug}`] = p;
  }
  console.log(`Korean posts loaded: ${koPosts.length}\n`);

  // 3. Load existing English posts
  const enPosts = await prisma.blogPost.findMany({
    where: { locale: 'en' },
    select: { id: true, slug: true, categoryId: true, content: true },
  });
  const enPostMap = {};
  for (const p of enPosts) {
    enPostMap[`${p.categoryId}|${p.slug}`] = p;
  }
  console.log(`Existing English posts: ${enPosts.length}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let noKoRef = 0;

  const folders = Object.keys(FOLDER_TO_SLUG_CANDIDATES).sort();
  for (const folder of folders) {
    const folderPath = path.join(DOCS_EN_DIR, folder);
    if (!fs.existsSync(folderPath)) continue;

    // Find matching category ID
    const candidates = FOLDER_TO_SLUG_CANDIDATES[folder];
    let categoryId = null;
    let matchedSlug = null;
    for (const slug of candidates) {
      if (catSlugToId[slug]) {
        categoryId = catSlugToId[slug];
        matchedSlug = slug;
        break;
      }
    }
    if (!categoryId) {
      console.log(`  [SKIP] ${folder} - no matching category in DB`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md')).sort();
    for (const file of files) {
      const slug = fileToSlug(file);
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const key = `${categoryId}|${slug}`;

      // Find corresponding Korean post
      const koPost = koPostMap[key];
      if (!koPost) {
        noKoRef++;
        continue;
      }

      const existingEn = enPostMap[key];

      if (existingEn) {
        // Update if content changed
        if (existingEn.content === content) {
          skipped++;
          continue;
        }
        await prisma.blogPost.update({
          where: { id: existingEn.id },
          data: {
            content,
            title: extractTitle(content) || slug,
            excerpt: extractExcerpt(content),
            readingTime: calcReadingTime(content),
          },
        });
        updated++;
        console.log(`  [UPDATE] [${matchedSlug}] ${slug}`);
      } else {
        // Create new English post
        await prisma.blogPost.create({
          data: {
            slug,
            title: extractTitle(content) || slug,
            content,
            excerpt: extractExcerpt(content),
            tags: koPost.tags,
            categoryId,
            locale: 'en',
            series: koPost.series,
            seriesOrder: koPost.seriesOrder,
            published: koPost.published,
            publishedAt: koPost.publishedAt,
            readingTime: calcReadingTime(content),
            authorId: koPost.authorId,
          },
        });
        created++;
        console.log(`  [CREATE] [${matchedSlug}] ${slug}`);
      }
    }
  }

  // Handle root overview
  const overviewPath = path.join(DOCS_EN_DIR, '00-overview.md');
  if (fs.existsSync(overviewPath)) {
    const content = fs.readFileSync(overviewPath, 'utf-8');
    const koOverview = await prisma.blogPost.findFirst({
      where: { slug: '00-overview', locale: 'ko' },
      select: { id: true, categoryId: true, tags: true, series: true, seriesOrder: true, authorId: true, published: true, publishedAt: true },
    });
    if (koOverview) {
      const enOverview = await prisma.blogPost.findFirst({
        where: { slug: '00-overview', locale: 'en' },
        select: { id: true, content: true },
      });
      if (enOverview) {
        if (enOverview.content !== content) {
          await prisma.blogPost.update({
            where: { id: enOverview.id },
            data: {
              content,
              title: extractTitle(content) || '00-overview',
              excerpt: extractExcerpt(content),
              readingTime: calcReadingTime(content),
            },
          });
          updated++;
          console.log(`  [UPDATE] [overview] 00-overview`);
        }
      } else {
        await prisma.blogPost.create({
          data: {
            slug: '00-overview',
            title: extractTitle(content) || 'Overview',
            content,
            excerpt: extractExcerpt(content),
            tags: koOverview.tags,
            categoryId: koOverview.categoryId,
            locale: 'en',
            series: koOverview.series,
            seriesOrder: koOverview.seriesOrder,
            published: koOverview.published,
            publishedAt: koOverview.publishedAt,
            readingTime: calcReadingTime(content),
            authorId: koOverview.authorId,
          },
        });
        created++;
        console.log(`  [CREATE] [overview] 00-overview`);
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Unchanged: ${skipped}`);
  console.log(`  No Korean ref: ${noKoRef}`);
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
