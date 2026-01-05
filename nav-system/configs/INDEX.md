# Navigation System - Configs Index

**Location:** `nav-system/configs/`  
**Total Config Files:** 2  
**Total Size:** 15.78 KB  
**Total Lines:** 637  

---

## 📋 Configuration Files Overview

### Navigation Configuration

#### 1. Navigation Configuration
**File:** `nav-system/configs/navigation.json`  
**Original:** `config/navigation.json`  
**Size:** 13.57 KB | **Lines:** 553  
**Status:** ACTIVE

**Purpose:**
Centralized navigation data configuration defining site structure, menu items, hierarchies, and navigation metadata.

**Structure:**
```json
{
  "version": "1.0.0",
  "site": {
    "title": "Clodo",
    "description": "Modern web development guides"
  },
  "navigation": {
    "main": [
      {
        "id": "home",
        "label": "Home",
        "href": "/",
        "icon": "home",
        "children": []
      },
      {
        "id": "blog",
        "label": "Blog",
        "href": "/blog",
        "children": [
          {
            "id": "all-posts",
            "label": "All Posts",
            "href": "/blog"
          },
          {
            "id": "categories",
            "label": "Categories",
            "href": "/blog/categories"
          }
        ]
      }
    ],
    "footer": [
      {
        "section": "Products",
        "links": [...]
      }
    ],
    "breadcrumbs": {
      "enabled": true,
      "separator": "/"
    }
  },
  "paths": {
    "excludeFromNav": ["/admin", "/api"]
  }
}
```

**Key Sections:**

| Section | Purpose | Contains |
|---|---|---|
| `version` | Config format version | Semantic version |
| `site` | Site metadata | Title, description |
| `navigation.main` | Main menu structure | Menu items, hierarchy |
| `navigation.footer` | Footer structure | Link sections |
| `navigation.breadcrumbs` | Breadcrumb settings | Enable flag, separator |
| `paths` | Path-based settings | Exclusions, patterns |

**Schema:**
```typescript
interface NavigationConfig {
  version: string;
  site: {
    title: string;
    description: string;
  };
  navigation: {
    main: MenuItem[];
    footer: FooterSection[];
    breadcrumbs: {
      enabled: boolean;
      separator: string;
    };
  };
  paths: {
    excludeFromNav: string[];
  };
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: MenuItem[];
  metadata?: Record<string, any>;
}

interface FooterSection {
  section: string;
  links: Array<{ label: string; href: string }>;
}
```

**Usage:**

**In JavaScript:**
```javascript
import navigationConfig from './nav-system/configs/navigation.json' assert { type: 'json' };

console.log(navigationConfig.navigation.main);
// Output: [{ id: 'home', label: 'Home', ... }]

const menuItems = navigationConfig.navigation.main;
```

**In Navigation Component:**
```javascript
import { NavigationComponent } from './nav-system/js/ui/navigation-component.js';
import navigationConfig from './nav-system/configs/navigation.json';

const nav = new NavigationComponent({
  items: navigationConfig.navigation.main
});
nav.mount(document.querySelector('nav'));
```

**In HTML Templates:**
```html
<!-- Via build process or template engine -->
<nav id="main-nav" data-config="navigation.json">
  <!-- Populated by JavaScript or build process -->
</nav>
```

**How It's Loaded:**
1. Bundler/build process imports JSON
2. JSON is embedded or loaded dynamically
3. JavaScript parses and uses for rendering
4. Templates are rendered based on config

**Dependencies:**
- `nav-system/js/ui/navigation-component.js` (uses config)
- `nav-system/js/core/navigation.js` (may reference paths)

**Modification Guide:**

**To Add Menu Item:**
```json
{
  "id": "guides",
  "label": "Guides",
  "href": "/guides",
  "children": []
}
```

**To Add Submenu:**
```json
{
  "id": "blog",
  "label": "Blog",
  "href": "/blog",
  "children": [
    {
      "id": "latest",
      "label": "Latest",
      "href": "/blog/latest"
    }
  ]
}
```

**To Add Footer Section:**
```json
{
  "section": "Resources",
  "links": [
    { "label": "Docs", "href": "/docs" }
  ]
}
```

---

### Announcements Configuration

#### 2. Announcements Configuration
**File:** `nav-system/configs/announcements.json`  
**Original:** `config/announcements.json`  
**Size:** 2.21 KB | **Lines:** 84  
**Status:** ACTIVE

**Purpose:**
Centralized management of site announcements, banners, and notifications with page-specific targeting and global settings.

**Structure:**
```json
{
  "version": "1.0.0",
  "announcements": [
    {
      "id": "maintenance",
      "type": "warning",
      "title": "Scheduled Maintenance",
      "message": "Site will be down on Sunday at 2 AM",
      "icon": "alert",
      "dismissible": true,
      "global": true,
      "excludePages": ["/admin"],
      "startDate": "2026-01-05",
      "endDate": "2026-01-10",
      "priority": 1
    },
    {
      "id": "new-feature",
      "type": "info",
      "title": "New Feature",
      "message": "Check out our new guides section!",
      "icon": "star",
      "dismissible": true,
      "pages": ["/"],
      "priority": 2
    }
  ],
  "settings": {
    "maxVisibleCount": 3,
    "position": "top",
    "animation": "slide"
  }
}
```

**Key Sections:**

| Section | Purpose | Contains |
|---|---|---|
| `version` | Config format version | Semantic version |
| `announcements` | Array of announcements | Announcement objects |
| `settings` | Global announcement settings | Display options |

**Announcement Properties:**

| Property | Type | Purpose | Example |
|---|---|---|---|
| `id` | string | Unique identifier | "maintenance-2026-01" |
| `type` | string | Announcement type | "info", "warning", "success", "error" |
| `title` | string | Display title | "System Maintenance" |
| `message` | string | Main message | "Site will be unavailable..." |
| `icon` | string | Icon name/class | "alert", "info", "check" |
| `dismissible` | boolean | Can be closed | true/false |
| `global` | boolean | Show on all pages | true/false |
| `pages` | string[] | Specific pages | ["/blog", "/guides"] |
| `excludePages` | string[] | Exclude from pages | ["/admin", "/api"] |
| `startDate` | string | Display start date | "2026-01-05" |
| `endDate` | string | Display end date | "2026-01-10" |
| `priority` | number | Display order (1=highest) | 1, 2, 3 |

**Schema:**
```typescript
interface AnnouncementsConfig {
  version: string;
  announcements: Announcement[];
  settings: AnnouncementSettings;
}

interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  icon?: string;
  dismissible: boolean;
  global?: boolean;
  pages?: string[];
  excludePages?: string[];
  startDate?: string;
  endDate?: string;
  priority?: number;
  action?: {
    label: string;
    href: string;
  };
}

interface AnnouncementSettings {
  maxVisibleCount: number;
  position: 'top' | 'bottom';
  animation: 'slide' | 'fade' | 'pop';
}
```

**Usage:**

**Display Announcements:**
```javascript
import announcementsConfig from './nav-system/configs/announcements.json';

// Filter for current page
const pageAnnouncements = announcementsConfig.announcements.filter(a => {
  if (a.global && !a.excludePages?.includes(window.location.pathname)) {
    return true;
  }
  if (a.pages?.includes(window.location.pathname)) {
    return true;
  }
  return false;
});

// Sort by priority
pageAnnouncements.sort((a, b) => (b.priority || 0) - (a.priority || 0));

// Show announcements
pageAnnouncements.forEach(announcement => {
  displayAnnouncement(announcement);
});
```

**Dismissal Handling:**
```javascript
// Store dismissed announcements in localStorage
function dismissAnnouncement(announcementId) {
  const dismissed = JSON.parse(
    localStorage.getItem('dismissed-announcements') || '[]'
  );
  dismissed.push(announcementId);
  localStorage.setItem('dismissed-announcements', JSON.stringify(dismissed));
}
```

**Dependencies:**
- `nav-system/js/*` (announcement display logic)
- `nav-system/css/*` (announcement styling)

**Modification Guide:**

**To Add Global Announcement:**
```json
{
  "id": "new-announcement",
  "type": "info",
  "title": "Title",
  "message": "Message",
  "dismissible": true,
  "global": true,
  "priority": 1
}
```

**To Add Page-Specific Announcement:**
```json
{
  "id": "page-specific",
  "type": "warning",
  "title": "Title",
  "message": "Message",
  "pages": ["/blog", "/guides"],
  "dismissible": true,
  "priority": 2
}
```

**To Exclude Pages:**
```json
{
  "id": "exclude-test",
  "type": "info",
  "title": "Title",
  "message": "Message",
  "global": true,
  "excludePages": ["/admin", "/api", "/test"]
}
```

**To Set Date Range:**
```json
{
  "id": "timed-announcement",
  "type": "info",
  "title": "Limited Time",
  "message": "This offer ends soon",
  "startDate": "2026-01-05",
  "endDate": "2026-01-15",
  "priority": 1
}
```

---

## 📊 Configuration Files Organization

```
nav-system/configs/
├── navigation.json      (Menu structure - 13.57 KB)
├── announcements.json   (Site announcements - 2.21 KB)
├── legacy/
│   └── [Original location references]
└── INDEX.md            (This file)
```

---

## 🔗 Config Dependencies

### Import Chain:
```
navigation.json
  ├── navigation-component.js (renders from config)
  ├── nav-main.html (populated by config)
  └── navigation.js (may reference paths)

announcements.json
  ├── announcements-manager.js (display logic)
  ├── footer.html (may include announcements)
  └── CSS (styling announcements)
```

---

## ✅ Configuration Checklist

- [x] All config files organized in nav-system/configs/
- [x] Both JSON files copied and validated
- [x] Schemas documented
- [x] Usage examples provided
- [x] Modification guides created
- [x] Dependencies mapped
- [x] Backwards compatible

---

## 📝 Notes & Best Practices

**Validation:**
- Use JSON schema validation before deployment
- Check for required fields (id, type, message, etc.)
- Validate dates are in correct format

**Performance:**
- Keep config files under 50 KB
- Cache config in application state
- Preload critical announcements

**Maintenance:**
- Update navigation.json when adding new pages
- Regular review of announcements (remove expired)
- Test configuration before deploying

**Security:**
- Escape HTML in announcements
- Validate URLs before linking
- Don't include sensitive data in config

---

## 🔄 Workflow

**Updating Navigation:**
1. Edit `nav-system/configs/navigation.json`
2. Add/modify menu items
3. Test in browser
4. Deploy configuration

**Creating Announcements:**
1. Edit `nav-system/configs/announcements.json`
2. Add announcement object
3. Set dates, pages, priority
4. Test display
5. Deploy configuration

---

*Navigation System - Configs Index*  
*Created: January 5, 2026*  
*Files: 2 JSON config files | 637 lines | 15.78 KB*
