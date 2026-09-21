/**
 * Reads and validates content/blog/*.md.
 *
 * Every validation failure throws. A post that is malformed must break the
 * build, never silently vanish from the index.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  CONTENT_DIR,
  DATE_PATTERN,
  SLUG_PATTERN,
  WORDS_PER_MINUTE,
  fail,
  postUrl,
  type BlogPost,
} from './config';
import { countWords, renderMarkdown } from './markdown';

/**
 * House style is enforced mechanically, not in review. Em and en dashes are
 * banned in published prose. Fenced and inline code are exempt, because a code
 * sample is not prose.
 */
function assertNoEmDash(file: string, markdown: string): void {
  const lines = markdown.split('\n');
  let inFence = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const withoutInlineCode = line.replace(/`[^`]*`/g, '');
    if (/[\u2014\u2013]/.test(withoutInlineCode)) {
      fail(
        file,
        `em dash or en dash on body line ${index + 1}, counting from the first line ` +
        `after the frontmatter. House style bans both in prose. ` +
          'Use "to" for number ranges and a comma or full stop otherwise.',
      );
    }
  });
}

function requireString(file: string, data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    fail(file, `frontmatter field "${key}" is required and must be a non empty string`);
  }
  return value.trim();
}

function optionalString(
  file: string,
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = data[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    fail(file, `frontmatter field "${key}", when present, must be a non empty string`);
  }
  return value.trim();
}

function assertDate(file: string, key: string, value: string): void {
  if (!DATE_PATTERN.test(value)) {
    fail(file, `frontmatter field "${key}" must be YYYY-MM-DD, got "${value}"`);
  }
  if (Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    fail(file, `frontmatter field "${key}" is not a real date: "${value}"`);
  }
}

async function loadOne(dir: string, fileName: string): Promise<BlogPost> {
  const fullPath = path.join(dir, fileName);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const body = parsed.content.trim();

  if (body === '') fail(fileName, 'post body is empty');
  assertNoEmDash(fileName, body);

  const title = requireString(fileName, data, 'title');
  const slug = requireString(fileName, data, 'slug');
  const description = requireString(fileName, data, 'description');

  if (!SLUG_PATTERN.test(slug)) {
    fail(fileName, `slug "${slug}" must be lowercase words joined by single hyphens`);
  }
  const expected = fileName.replace(/\.md$/, '');
  if (expected !== slug) {
    fail(fileName, `slug "${slug}" must match the file name "${expected}.md"`);
  }

  const dateValue = data.date;
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : requireString(fileName, data, 'date');
  assertDate(fileName, 'date', date);

  const updatedValue = data.updated;
  const updated =
    updatedValue instanceof Date
      ? updatedValue.toISOString().slice(0, 10)
      : optionalString(fileName, data, 'updated');
  if (updated) assertDate(fileName, 'updated', updated);

  if (typeof data.draft !== 'boolean') {
    fail(fileName, 'frontmatter field "draft" is required and must be true or false');
  }
  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    fail(fileName, 'frontmatter field "tags" is required and must be a non empty list');
  }
  const tags = data.tags.map((tag) => {
    if (typeof tag !== 'string' || tag.trim() === '') {
      fail(fileName, 'every entry in "tags" must be a non empty string');
    }
    return tag.trim();
  });

  const { html, toc } = await renderMarkdown(body);
  const wordCount = countWords(body);

  return {
    slug,
    title,
    description,
    date,
    updated,
    tags,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    canonical: optionalString(fileName, data, 'canonical') ?? postUrl(slug),
    ogImage: optionalString(fileName, data, 'ogImage'),
    toc,
    html,
    draft: data.draft as boolean,
    sourceFile: path.join(CONTENT_DIR, fileName),
  };
}

export async function loadPosts(root: string, includeDrafts: boolean): Promise<BlogPost[]> {
  const dir = path.join(root, CONTENT_DIR);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort();

  const posts: BlogPost[] = [];
  for (const file of files) {
    posts.push(await loadOne(dir, file));
  }

  const seen = new Map<string, string>();
  for (const post of posts) {
    const previous = seen.get(post.slug);
    if (previous) {
      fail(post.sourceFile, `duplicate slug "${post.slug}", already used by ${previous}`);
    }
    seen.set(post.slug, post.sourceFile);
  }

  return posts
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}
