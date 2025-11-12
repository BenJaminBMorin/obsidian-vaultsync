# Publishing VaultSync to Obsidian Community Plugins

Complete guide to publishing the VaultSync plugin to the Obsidian Community Plugin marketplace.

## Prerequisites

Before you begin:

- [x] Plugin is fully functional and tested
- [x] README.md created with comprehensive documentation
- [x] manifest.json has all required fields
- [x] CHANGELOG.md documenting changes
- [x] GitHub repository is public
- [x] License file exists (MIT recommended)

## Step 1: Prepare Your Repository

### 1.1 Repository Setup

Your plugin code should be in a **public GitHub repository** with this structure:

```
obsidian-vaultsync/
├── main.js (built)
├── manifest.json
├── styles.css
├── README.md
├── CHANGELOG.md
├── LICENSE
└── src/ (source files)
```

### 1.2 Required Files

**manifest.json** - Already complete ✅
```json
{
  "id": "vaultsync",
  "name": "VaultSync",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "Real-time sync for your Obsidian vault...",
  "author": "VaultSync",
  "authorUrl": "https://vaultsync.io",
  "isDesktopOnly": false
}
```

**README.md** - Already created ✅

**LICENSE** - Required, MIT recommended

### 1.3 Build the Plugin

```bash
npm install
npm run build
```

This creates:
- `main.js` - Plugin code
- `styles.css` - Plugin styles
- `manifest.json` - Plugin manifest

## Step 2: Create Your First Release

### 2.1 Update Version

Update version in both files:

**manifest.json:**
```json
{
  "version": "1.0.0"
}
```

**versions.json:**
```json
{
  "1.0.0": "0.15.0"
}
```

### 2.2 Create Git Tag

```bash
# Tag the release
git tag -a plugin-1.0.0 -m "Release version 1.0.0"

# Push tag to GitHub
git push origin plugin-1.0.0
```

### 2.3 GitHub Actions Auto-Release

The GitHub Actions workflow will automatically:
1. Build the plugin
2. Create a GitHub release
3. Attach the required files

Alternatively, create the release manually:

```bash
# Go to GitHub → Releases → Create new release
# Tag: plugin-1.0.0
# Title: VaultSync Plugin 1.0.0
# Upload: main.js, manifest.json, styles.css
```

## Step 3: Submit to Obsidian

### 3.1 Fork the Community Plugins Repo

1. Go to: https://github.com/obsidianmd/obsidian-releases
2. Click **Fork** to create your fork
3. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/obsidian-releases.git
   cd obsidian-releases
   ```

### 3.2 Add Your Plugin

Create a new JSON file:

```bash
# Create plugin entry
cat > community-plugins.json << 'EOF'
{
  "id": "vaultsync",
  "name": "VaultSync",
  "author": "VaultSync",
  "description": "Real-time sync for your Obsidian vault with VaultSync platform. Keep your notes synchronized across devices with conflict resolution and version history.",
  "repo": "vaultsync/obsidian-vaultsync"
}
EOF
```

### 3.3 Update community-plugins.json

Edit `community-plugins.json` and add your plugin to the array:

```json
[
  {
    "id": "another-plugin",
    "name": "Another Plugin",
    ...
  },
  {
    "id": "vaultsync",
    "name": "VaultSync",
    "author": "VaultSync",
    "description": "Real-time sync for your Obsidian vault with VaultSync platform. Keep your notes synchronized across devices with conflict resolution and version history.",
    "repo": "vaultsync/obsidian-vaultsync"
  }
]
```

### 3.4 Submit Pull Request

```bash
# Commit your changes
git add community-plugins.json
git commit -m "Add VaultSync plugin"

# Push to your fork
git push origin main

# Create Pull Request on GitHub
# Go to: https://github.com/obsidianmd/obsidian-releases
# Click "New Pull Request"
# Click "compare across forks"
# Select your fork
# Create pull request
```

### 3.5 Pull Request Requirements

Your PR description should include:

```markdown
## Plugin Submission: VaultSync

**Plugin Name:** VaultSync
**Repository:** https://github.com/vaultsync/obsidian-vaultsync
**Initial Version:** 1.0.0

### Description
Real-time synchronization plugin for Obsidian that keeps your notes synchronized across all your devices through the VaultSync platform.

### Checklist
- [x] I have read the plugin guidelines
- [x] Plugin follows Obsidian's design principles
- [x] Plugin is fully functional
- [x] No malicious code
- [x] Public GitHub repository
- [x] MIT License
- [x] README.md with documentation
- [x] Initial release created (v1.0.0)

### Screenshots
![VaultSync Settings](link-to-screenshot-1.png)
![Sync Status](link-to-screenshot-2.png)
```

## Step 4: Review Process

### 4.1 What Obsidian Team Reviews

- Code quality and security
- Plugin functionality
- User experience
- Documentation
- License compliance
- Performance impact

### 4.2 Timeline

- **Review time:** 1-4 weeks typically
- **Approval:** Plugin goes live immediately
- **Rejection:** You'll get feedback to address issues

### 4.3 Common Rejection Reasons

❌ **Missing files** - Ensure all required files present
❌ **Build errors** - Test build before submitting
❌ **Poor documentation** - Complete README required
❌ **Security issues** - No malicious or suspicious code
❌ **License issues** - MIT or compatible license needed
❌ **Broken functionality** - Plugin must work as described

## Step 5: Post-Approval

### 5.1 Updates

For future updates:

1. Update version in `manifest.json` and `versions.json`
2. Update `CHANGELOG.md`
3. Create new GitHub release
4. Obsidian auto-detects new releases from your repo

**No PR needed for updates** - just create GitHub releases!

### 5.2 Version Numbers

Use semantic versioning:
- `1.0.0` - Initial release
- `1.0.1` - Bug fixes
- `1.1.0` - New features
- `2.0.0` - Breaking changes

### 5.3 Maintenance

- Monitor GitHub issues
- Respond to user feedback
- Keep plugin updated for new Obsidian versions
- Update documentation as needed

## Step 6: Marketing (Optional)

### 6.1 Announce Your Plugin

- Obsidian Forum: https://forum.obsidian.md
- Obsidian Discord: https://discord.gg/obsidianmd
- Reddit: r/ObsidianMD
- Twitter: #ObsidianMD
- Your blog/website

### 6.2 Create Demo Content

- Video walkthrough
- Blog post tutorial
- Screenshots and GIFs
- Example vaults

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
cd packages/obsidian-plugin
rm -rf node_modules
npm install
npm run build
```

### Release Not Creating

Check GitHub Actions:
- Go to Actions tab in your repo
- Find the failed workflow
- Check logs for errors

### PR Gets Rejected

Common fixes:
1. Address all reviewer feedback
2. Update files as requested
3. Push changes to your fork
4. Comment on PR when ready for re-review

## Quick Commands Reference

```bash
# Build plugin
cd packages/obsidian-plugin && npm run build

# Create release tag
git tag -a plugin-1.0.0 -m "Release version 1.0.0"
git push origin plugin-1.0.0

# Update version
node version-bump.mjs 1.0.1

# Fork and submit
git clone https://github.com/YOUR_USERNAME/obsidian-releases.git
cd obsidian-releases
# Edit community-plugins.json
git add community-plugins.json
git commit -m "Add VaultSync plugin"
git push origin main
```

## Resources

- **Obsidian Plugin Guidelines:** https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Community Plugins Repo:** https://github.com/obsidianmd/obsidian-releases
- **Plugin Developer Docs:** https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **Sample Plugin:** https://github.com/obsidianmd/obsidian-sample-plugin
- **Obsidian API:** https://github.com/obsidianmd/obsidian-api

## Support

If you need help:
- **Obsidian Discord** - #plugin-dev channel
- **Forum** - Plugin Development category
- **GitHub Discussions** - In your plugin repo

---

**Good luck with your plugin submission!** 🎉
