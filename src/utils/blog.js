/**
 * Blog Data Loader
 * 
 * Loads and parses blog posts from data/posts JSON files.
 * Provides utilities for sorting, filtering, and formatting blog content.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../data/posts');

/**
 * Load a single blog post by slug
 */
export function getBlogPost(slug) {
  try {
    const filePath = path.join(postsDir, `${slug}.json`);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading blog post "${slug}":`, error.message);
    return null;
  }
}

/**
 * Load all blog posts
 */
export function getAllBlogPosts() {
  try {
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.json'));
    return files
      .map(file => {
        const slug = file.replace('.json', '');
        return getBlogPost(slug);
      })
      .filter(post => post !== null);
  } catch (error) {
    console.error('Error loading blog posts:', error.message);
    return [];
  }
}

/**
 * Get sorted blog posts (newest first)
 */
export function getSortedBlogPosts() {
  return getAllBlogPosts().sort((a, b) => {
    return new Date(b.publishedDate) - new Date(a.publishedDate);
  });
}

/**
 * Get blog posts by category
 */
export function getBlogPostsByCategory(category) {
  return getSortedBlogPosts().filter(post => post.category === category);
}

/**
 * Get blog posts by tag
 */
export function getBlogPostsByTag(tag) {
  return getSortedBlogPosts().filter(post => post.tags && post.tags.includes(tag));
}

/**
 * Get blog post excerpt (first N words)
 */
export function getExcerpt(post, wordCount = 50) {
  // Extract text from first section if available
  let text = '';
  if (post.content && post.content.sections && post.content.sections.length > 0) {
    text = post.content.sections[0].title || '';
  }
  
  // Fallback to description
  if (!text) {
    text = post.description || '';
  }
  
  // Get first N words
  const words = text.split(/\s+/).slice(0, wordCount);
  return words.join(' ') + (words.length === wordCount ? '...' : '');
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get related posts (same category or tags)
 */
export function getRelatedPosts(post, limit = 3) {
  const allPosts = getSortedBlogPosts();
  
  const related = allPosts
    .filter(p => p.slug !== post.slug && (
      p.category === post.category ||
      (p.tags && post.tags && p.tags.some(tag => post.tags.includes(tag)))
    ))
    .slice(0, limit);
  
  return related;
}

/**
 * Get all categories
 */
export function getAllCategories() {
  const posts = getSortedBlogPosts();
  const categories = new Set(posts.map(p => p.category).filter(Boolean));
  return Array.from(categories);
}

/**
 * Get all tags
 */
export function getAllTags() {
  const posts = getSortedBlogPosts();
  const tagSet = new Set();
  posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => tagSet.add(tag));
    }
  });
  return Array.from(tagSet).sort();
}
