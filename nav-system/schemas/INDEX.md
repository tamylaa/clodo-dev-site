# Navigation System - Schemas Index

**Location:** `nav-system/schemas/`  
**Total Schema Files:** 2  
**Total Size:** 11.85 KB  
**Total Lines:** 400  

---

## 📋 Schema Files Overview

### Blog Data Schemas

#### 1. Blog Data Schema
**File:** `nav-system/schemas/blog-data.schema.json`  
**Original:** `data/json-schemas/blog-data.schema.json`  
**Size:** 3.72 KB | **Lines:** 124  
**Status:** ACTIVE

**Purpose:**
JSON Schema defining the structure and validation rules for blog collection data, ensuring data consistency and enabling automated validation.

**Schema Structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://clodo.dev/schemas/blog-data.json",
  "title": "Blog Data Schema",
  "description": "Validates blog post collection data",
  "type": "object",
  "properties": {
    "posts": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/post"
      },
      "minItems": 0
    },
    "categories": {
      "type": "array",
      "items": { "type": "string" }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "lastUpdated": { "type": "string", "format": "date-time" },
        "totalPosts": { "type": "integer" }
      }
    }
  },
  "required": ["posts"],
  "definitions": {
    "post": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "slug": { "type": "string" },
        "excerpt": { "type": "string" },
        "content": { "type": "string" },
        "author": { "type": "string" },
        "date": { "type": "string", "format": "date" },
        "categories": { "type": "array", "items": { "type": "string" } },
        "tags": { "type": "array", "items": { "type": "string" } },
        "featured": { "type": "boolean" }
      },
      "required": ["id", "title", "slug", "content", "date"]
    }
  }
}
```

**Key Properties:**

| Property | Type | Description | Example |
|---|---|---|---|
| `$schema` | string | JSON Schema version | "http://json-schema.org/draft-07/schema#" |
| `$id` | string | Unique schema identifier | "https://clodo.dev/schemas/blog-data.json" |
| `title` | string | Human-readable title | "Blog Data Schema" |
| `description` | string | Schema purpose | "Validates blog post collection data" |
| `type` | string | Root data type | "object" |
| `properties` | object | Allowed properties | { "posts": {...}, "categories": {...} } |
| `required` | array | Required properties | ["posts"] |
| `definitions` | object | Reusable schemas | { "post": {...} } |

**Validated Data Example:**
```json
{
  "posts": [
    {
      "id": "intro-to-web-perf",
      "title": "Introduction to Web Performance",
      "slug": "intro-to-web-perf",
      "excerpt": "Learn the basics...",
      "content": "# Introduction\n\nWeb performance is...",
      "author": "Jane Doe",
      "date": "2026-01-01",
      "categories": ["performance", "tutorial"],
      "tags": ["web", "performance", "optimization"],
      "featured": true
    }
  ],
  "categories": ["performance", "tutorial", "guide"],
  "metadata": {
    "lastUpdated": "2026-01-05T10:30:00Z",
    "totalPosts": 1
  }
}
```

**Validation Usage:**

**With Ajv (JavaScript Validator):**
```javascript
import Ajv from 'ajv';
import schema from './nav-system/schemas/blog-data.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const data = require('../../data/blog/blog-data.json');
const valid = validate(data);

if (!valid) {
  console.error('Validation errors:', validate.errors);
} else {
  console.log('Data is valid');
}
```

**In Build Process:**
```javascript
// webpack/vite config
import schema from './nav-system/schemas/blog-data.schema.json';

function validateBlogData(data) {
  // Validate before building
  const valid = validate(data);
  if (!valid) throw new Error('Invalid blog data');
  return data;
}
```

**Constraints:**
- `posts` - Required, minimum 0 items
- `post.id` - Required, unique string
- `post.title` - Required, non-empty string
- `post.slug` - Required, URL-safe string
- `post.content` - Required, markdown or HTML
- `post.date` - Required, ISO 8601 date format
- `categories` - Optional, array of strings
- `tags` - Optional, array of strings
- `featured` - Optional, boolean

**Dependencies:**
- Validation library (Ajv, tv4, etc.)
- `data/blog-data.json` (data being validated)

---

#### 2. Blog Post Schema
**File:** `nav-system/schemas/blog-post.schema.json`  
**Original:** `data/json-schemas/blog-post.schema.json`  
**Size:** 8.13 KB | **Lines:** 276  
**Status:** ACTIVE

**Purpose:**
Detailed JSON Schema for individual blog post structure with rich metadata support, SEO fields, and content validation.

**Schema Structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://clodo.dev/schemas/blog-post.json",
  "title": "Blog Post Schema",
  "description": "Validates individual blog post data",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "title": { "type": "string", "minLength": 1, "maxLength": 200 },
    "slug": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "excerpt": { "type": "string", "maxLength": 500 },
    "content": { "type": "string", "minLength": 100 },
    "author": { "type": "string" },
    "date": { "type": "string", "format": "date" },
    "updated": { "type": "string", "format": "date" },
    "categories": { "type": "array", "items": { "type": "string" } },
    "tags": { "type": "array", "items": { "type": "string" }, "maxItems": 10 },
    "featured": { "type": "boolean", "default": false },
    "status": { "enum": ["draft", "published", "archived"], "default": "draft" },
    "seo": {
      "type": "object",
      "properties": {
        "keywords": { "type": "array", "items": { "type": "string" }, "maxItems": 5 },
        "description": { "type": "string", "maxLength": 160 },
        "image": { "type": "string", "format": "uri" },
        "canonical": { "type": "string", "format": "uri" }
      }
    },
    "relatedPosts": {
      "type": "array",
      "items": { "type": "string" }
    },
    "toc": {
      "type": "boolean",
      "description": "Generate table of contents"
    }
  },
  "required": ["id", "title", "slug", "content", "date", "author"],
  "additionalProperties": false
}
```

**Key Properties:**

| Property | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | string | Lowercase, hyphens only | Unique identifier |
| `title` | string | 1-200 chars | Post title |
| `slug` | string | Lowercase, hyphens | URL slug |
| `excerpt` | string | Max 500 chars | Short summary |
| `content` | string | Min 100 chars | Main content |
| `author` | string | Required | Author name |
| `date` | string | ISO 8601 format | Publish date |
| `updated` | string | ISO 8601 format | Last updated |
| `categories` | array | Strings | Content categories |
| `tags` | array | Max 10 items | Content tags |
| `featured` | boolean | Default: false | Featured flag |
| `status` | enum | draft/published/archived | Post status |
| `seo` | object | - | SEO metadata |
| `seo.keywords` | array | Max 5 items | SEO keywords |
| `seo.description` | array | Max 160 chars | Meta description |
| `seo.image` | string | Valid URI | OG image URL |
| `seo.canonical` | string | Valid URI | Canonical URL |

**Validated Data Example:**
```json
{
  "id": "web-performance-tips",
  "title": "10 Web Performance Tips for 2026",
  "slug": "web-performance-tips",
  "excerpt": "Learn the top 10 performance optimization techniques...",
  "content": "# Web Performance Tips\n\n## Introduction\n\nWeb performance is critical...",
  "author": "Jane Doe",
  "date": "2026-01-01",
  "updated": "2026-01-05",
  "categories": ["performance", "tutorial"],
  "tags": ["web", "optimization", "core-web-vitals", "lcp", "cls"],
  "featured": true,
  "status": "published",
  "seo": {
    "keywords": ["performance", "web", "optimization", "speed", "core-web-vitals"],
    "description": "Learn 10 essential web performance tips to improve your site speed and user experience.",
    "image": "https://example.com/images/perf-tips.jpg",
    "canonical": "https://clodo.dev/blog/web-performance-tips"
  },
  "relatedPosts": ["intro-to-web-perf", "lcp-optimization"],
  "toc": true
}
```

**Validation Usage:**

**JavaScript:**
```javascript
import Ajv from 'ajv';
import schema from './nav-system/schemas/blog-post.schema.json';

const validate = Ajv().compile(schema);

function validatePost(post) {
  const valid = validate(post);
  return {
    valid,
    errors: valid ? null : validate.errors
  };
}

const post = require('./content/blog/my-post.json');
const result = validatePost(post);
```

**In Build Process:**
```javascript
// Validate all blog posts
const posts = fs.readdirSync('./content/blog/')
  .filter(f => f.endsWith('.json'))
  .map(f => require(`./content/blog/${f}`))
  .map(validatePost)
  .filter(r => !r.valid)
  .map(r => r.errors);

if (posts.length > 0) {
  throw new Error(`Invalid blog posts: ${JSON.stringify(posts)}`);
}
```

**Validation Rules:**

**Pattern Validation:**
- `id`: `^[a-z0-9-]+$` - Only lowercase letters, numbers, hyphens
- `slug`: `^[a-z0-9-]+$` - Only lowercase letters, numbers, hyphens

**Size Constraints:**
- `title`: 1-200 characters
- `excerpt`: Max 500 characters
- `content`: Min 100 characters (actual content)
- `tags`: Max 10 items
- `seo.keywords`: Max 5 items
- `seo.description`: Max 160 characters

**Format Validation:**
- `date`: ISO 8601 format (YYYY-MM-DD)
- `updated`: ISO 8601 format
- `seo.image`: Valid URI format
- `seo.canonical`: Valid URI format

**Enum Validation:**
- `status`: Only "draft", "published", "archived"

**Required Fields:**
- `id`, `title`, `slug`, `content`, `date`, `author`

**Dependencies:**
- Validation library (Ajv, tv4, etc.)
- `content/blog/*.json` (blog post files)

---

## 🔗 Schema Dependencies

### Usage Chain:
```
blog-data.schema.json
└── Validates data/blog-data.json
    └── Used in build process
        ├── Blog rendering
        └── Navigation generation

blog-post.schema.json
└── Validates content/blog/*.json
    └── Used in build process
        ├── Blog post rendering
        ├── Navigation generation
        └── SEO optimization
```

---

## 📊 Schema Organization

```
nav-system/schemas/
├── blog-data.schema.json      (Collection schema - 3.72 KB)
├── blog-post.schema.json      (Individual post - 8.13 KB)
├── legacy/
│   └── [Original location references]
└── INDEX.md                   (This file)
```

---

## ✅ Schema Validation Checklist

- [x] All schema files organized in nav-system/schemas/
- [x] Both JSON schemas copied
- [x] Validation rules documented
- [x] Usage examples provided
- [x] Constraints listed
- [x] Dependencies mapped
- [x] Error handling defined

---

## 🔧 How to Add New Schema Fields

**To Blog Post Schema:**

1. Add property definition:
```json
"newField": {
  "type": "string",
  "description": "Field description"
}
```

2. Add to required (if needed):
```json
"required": ["id", "title", ..., "newField"]
```

3. Test validation:
```javascript
const valid = validate(postWithNewField);
console.log(valid ? 'Valid' : validate.errors);
```

**To Blog Data Schema:**

1. Add to properties:
```json
"newProperty": {
  "type": "array",
  "items": { ... }
}
```

2. Update references if needed

3. Re-validate all blog data

---

## 📝 Best Practices

**Schema Maintenance:**
- Keep schemas up-to-date with data changes
- Version schemas with `$id` field
- Document constraints clearly
- Test schema changes before deploying

**Validation:**
- Validate in build process
- Validate on data updates
- Provide clear error messages
- Log validation failures

**Performance:**
- Cache compiled schemas
- Validate early in pipeline
- Use efficient validator libraries
- Avoid runtime schema compilation

**Documentation:**
- Document all required fields
- Document field constraints
- Provide valid examples
- Link to validator documentation

---

## 🔄 Workflow

**Validating Blog Data:**
1. Load blog-data.schema.json
2. Compile validator
3. Validate `data/blog-data.json`
4. Report errors or proceed

**Validating Blog Posts:**
1. Load blog-post.schema.json
2. For each blog post file:
   - Load JSON
   - Validate against schema
   - Report errors
3. Fail build if any invalid

**Adding New Fields:**
1. Update schema file
2. Test schema validity
3. Update blog data files
4. Re-validate all data
5. Deploy

---

*Navigation System - Schemas Index*  
*Created: January 5, 2026*  
*Files: 2 JSON schema files | 400 lines | 11.85 KB*
