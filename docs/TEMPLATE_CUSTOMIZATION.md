# JSDoc Template Customization Guide

This guide explains how to customize the JSDoc documentation generation for the Fantoccini Animation Engine.

## Available Templates

### 1. Custom Fantoccini Template (Default)
- **Config**: `jsdoc.json`
- **Location**: `./jsdoc-template/`
- **Features**: 
  - Custom Fantoccini branding and styling
  - Dark/light theme toggle
  - Search functionality
  - Copy-to-clipboard for code blocks
  - Responsive design
  - Scroll progress indicator
  - Keyboard navigation (Ctrl+K for search)

```bash
bun run docs
```

### 2. Better-Docs Template
- **Config**: `jsdoc.better-docs.json`
- **Features**: Modern, feature-rich template with TypeScript support

```bash
jsdoc -c jsdoc.better-docs.json
```

### 3. DocDash Template
- **Config**: `jsdoc.docdash.json`
- **Features**: Clean, minimal template

```bash
jsdoc -c jsdoc.docdash.json
```

## Custom Template Structure

```
jsdoc-template/
├── publish.js           # Main template logic
├── static/             # Static assets
│   ├── styles/
│   │   └── fantoccini.css
│   └── scripts/
│       └── fantoccini-custom.js
└── tmpl/               # Template files
    └── layout.tmpl     # Main HTML layout
```

## Customization Options

### 1. Styling (CSS Variables)

Edit `jsdoc-template/static/styles/fantoccini.css`:

```css
:root {
  --fantoccini-primary: #6b46c1;     /* Primary color */
  --fantoccini-secondary: #7c3aed;   /* Secondary color */
  --fantoccini-accent: #a855f7;      /* Accent color */
  --fantoccini-background: #fafafa;  /* Background */
  --fantoccini-surface: #ffffff;     /* Surface color */
  /* ... more variables */
}
```

### 2. Layout Customization

Edit `jsdoc-template/tmpl/layout.tmpl`:

```html
<nav class="wrap">
    <div class="nav-header">
        <h2><a href="index.html">🎭 Your Brand</a></h2>
        <p class="nav-subtitle">Your Subtitle</p>
    </div>
    <?js= this.nav ?>
</nav>
```

### 3. JavaScript Features

Add custom functionality in `jsdoc-template/static/scripts/fantoccini-custom.js`:

```javascript
// Add your custom JavaScript here
function addCustomFeature() {
    // Implementation
}
```

### 4. Configuration Options

In your JSDoc config file:

```json
{
  "better-docs": {
    "name": "Your Project Name",
    "title": "Your Documentation Title",
    "hideGenerator": true,
    "navigation": [
      {
        "label": "Custom Link",
        "href": "https://your-site.com"
      }
    ]
  }
}
```

## Creating a New Template

### 1. Template Structure

Create a new directory with these required files:

```
my-template/
├── publish.js          # Required: Main template engine
├── static/            # Optional: Static assets
└── tmpl/              # Optional: Template files
    ├── layout.tmpl
    ├── container.tmpl
    └── ...
```

### 2. Basic publish.js

```javascript
exports.publish = function(taffyData, opts, tutorials) {
    // Your template logic here
    // See existing publish.js for reference
};
```

### 3. Template Configuration

```json
{
  "opts": {
    "template": "./path/to/my-template"
  }
}
```

## Advanced Customization

### 1. Custom JSDoc Tags

Add custom tags in your config:

```json
{
  "tags": {
    "allowUnknownTags": ["customTag", "example", "feature"]
  }
}
```

Use in your code:

```javascript
/**
 * @customTag This is a custom tag
 * @feature animation
 */
class MyClass {}
```

### 2. Custom Plugins

Create a plugin file:

```javascript
// my-plugin.js
exports.handlers = {
    newDoclet: function(e) {
        // Process each doclet
    }
};
```

Add to config:

```json
{
  "plugins": ["./my-plugin.js"]
}
```

### 3. Template Helpers

Add helper functions to your template:

```javascript
// In publish.js
view.myHelper = function(data) {
    return processData(data);
};
```

Use in templates:

```html
<?js= this.myHelper(data) ?>
```

## Package Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "docs": "jsdoc -c jsdoc.json",
    "docs:better": "jsdoc -c jsdoc.better-docs.json", 
    "docs:docdash": "jsdoc -c jsdoc.docdash.json",
    "docs:watch": "nodemon --watch src --ext js,ts --exec 'npm run docs'"
  }
}
```

## Tips and Best Practices

1. **Keep templates modular** - Separate concerns into different template files
2. **Use CSS variables** - Makes theming much easier
3. **Mobile-first design** - Ensure your docs work on all devices
4. **Performance** - Optimize CSS and JavaScript for fast loading
5. **Accessibility** - Use semantic HTML and proper ARIA labels
6. **SEO** - Add proper meta tags and structured data

## Troubleshooting

### Template not loading
- Check the template path in your config
- Ensure `publish.js` exists and exports the `publish` function

### Styles not applying
- Verify CSS files are in the `static/styles/` directory
- Check that CSS is referenced in your layout template

### JavaScript errors
- Check browser console for errors
- Ensure script files are properly loaded in the layout

### Missing content
- Verify your JSDoc comments are properly formatted
- Check the `source.include` paths in your config

## Example Configurations

See the provided example configs:
- `jsdoc.json` - Custom Fantoccini template
- `jsdoc.better-docs.json` - Better-docs template
- `jsdoc.docdash.json` - DocDash template

Each demonstrates different customization approaches and features.