# Setup Guide for VaultSync Obsidian Plugin Repository

This guide will help you set up the GitHub repository for publishing to Obsidian Community Plugins.

## 1. Create GitHub Repository

Create a new **public** repository on GitHub:

1. Go to https://github.com/new
2. **Owner**: `vaultsync` (or your organization/username)
3. **Repository name**: `obsidian-vaultsync`
4. **Visibility**: **Public** (required for Obsidian)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## 2. Push Local Repository to GitHub

The plugin repository is ready at `/tmp/vaultsync-obsidian-plugin`

Run these commands to push it to GitHub:

```bash
cd /tmp/vaultsync-obsidian-plugin

# Add GitHub as remote
git remote add origin https://github.com/vaultsync/obsidian-vaultsync.git

# Push main branch and tags
git push -u origin main
git push origin --tags
```

## 3. Verify GitHub Actions

After pushing the `1.0.0` tag, the GitHub Actions workflow will automatically:
- Build the plugin
- Create a release
- Upload `main.js`, `manifest.json`, and `styles.css`

Check: https://github.com/vaultsync/obsidian-vaultsync/actions

## 4. Verify Release

Check that the release was created successfully:

https://github.com/vaultsync/obsidian-vaultsync/releases/tag/1.0.0

It should contain:
- ✅ main.js
- ✅ manifest.json
- ✅ styles.css

## 5. Submit to Obsidian Community Plugins

Now you're ready to submit! Follow the steps in [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md):

1. Fork https://github.com/obsidianmd/obsidian-releases
2. Add your plugin to `community-plugins.json`:
   ```json
   {
     "id": "vaultsync",
     "name": "VaultSync",
     "author": "VaultSync",
     "description": "Real-time sync for your Obsidian vault with VaultSync platform. Keep your notes synchronized across devices with conflict resolution and version history.",
     "repo": "vaultsync/obsidian-vaultsync"
   }
   ```
3. Create a Pull Request
4. Wait for Obsidian team review (typically 1-4 weeks)

## 6. Future Updates

For future releases:

1. Update version in `manifest.json` and `versions.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create and push new tag:
   ```bash
   git tag -a 1.0.1 -m "Release version 1.0.1"
   git push origin 1.0.1
   ```
5. GitHub Actions will automatically create the release

**No Pull Request needed for updates** - Obsidian auto-detects new releases!

## Repository Structure

```
obsidian-vaultsync/
├── .github/
│   └── workflows/
│       └── release.yml          # Automated release workflow
├── src/                         # Source code
├── main.ts                      # Plugin entry point
├── manifest.json                # Plugin metadata
├── versions.json                # Version compatibility
├── styles.css                   # Plugin styles
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── esbuild.config.mjs           # Build config
├── README.md                    # Marketplace documentation
├── CHANGELOG.md                 # Version history
├── PUBLISHING_GUIDE.md          # Submission guide
├── LICENSE                      # MIT License
└── .gitignore                   # Git ignore rules
```

## Troubleshooting

### GitHub Actions fails
- Check the Actions tab for error logs
- Ensure Node.js version is compatible
- Verify build succeeds locally: `npm run build`

### Release missing files
- Ensure workflow has write permissions
- Check that build creates `main.js`
- Verify file paths in workflow

### Can't push to GitHub
- Ensure repository is public
- Check you have write permissions
- Verify remote URL is correct

## Next Steps

After the plugin is live on Obsidian Community Plugins:

- [ ] Announce on Obsidian forum
- [ ] Share on Discord
- [ ] Post on r/ObsidianMD
- [ ] Create demo video
- [ ] Write blog post tutorial
- [ ] Monitor GitHub issues for bug reports

## Support

Need help? Check:
- [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) - Detailed submission guide
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Obsidian Discord](https://discord.gg/obsidianmd) - #plugin-dev channel

---

**Ready to publish?** Follow steps 1-5 above to get your plugin on the marketplace! 🚀
