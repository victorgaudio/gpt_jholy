# Documentation Structure

## Branch-Based Organization

This project uses a branch-specific documentation structure to track development progress and decisions per feature.

### Structure
```
docs/
├── README.md                    # This file
├── [branch-name]/              # Branch-specific documentation
│   ├── sessao-*.md             # Complete session documentation
│   ├── desenvolvimento-*.md    # Development guides
│   ├── troubleshooting-*.md    # Troubleshooting guides
│   └── prompts-utilizados.md   # Prompt knowledge base
└── main/                       # Main branch documentation (after merge)
```

### Current Branch: feat_deploy_local
```
docs/feat_deploy_local/
├── sessao-setup-local.md              # Complete session documentation
├── desenvolvimento-local.md           # Local development guide
├── troubleshooting-cors-portas.md     # CORS and port issues
└── prompts-utilizados.md              # Prompt knowledge base
```

## Documentation Guidelines

### When Working on a Feature Branch
1. Create documentation in `docs/[branch-name]/`
2. Document session objectives, problems, and solutions
3. Include commit messages ready for use
4. Create troubleshooting guides for specific issues
5. Document prompts used for future reference

### When Merging to Main
1. Review documentation for relevance to main branch
2. Move relevant docs to `docs/main/` or update existing docs
3. Archive branch-specific docs or delete if no longer needed
4. Update links in README.md and CLAUDE.md

### File Naming Conventions
- `sessao-[topic].md` - Complete session documentation
- `desenvolvimento-[context].md` - Development guides
- `troubleshooting-[specific-issue].md` - Problem-solving guides
- `prompts-utilizados.md` - Prompt knowledge base
- `deploy-[platform].md` - Deployment guides

## Benefits of This Structure

1. **Progress Tracking**: Each branch documents its development journey
2. **Context Preservation**: Decisions and problems are documented with context
3. **Knowledge Base**: Prompts and solutions are preserved for reuse
4. **Clean Main Branch**: Only relevant, tested documentation in main
5. **Collaboration**: Team members can understand branch progress through docs

## Example Usage

### Starting New Feature Branch
```bash
git checkout -b feat/new-feature
mkdir -p docs/feat_new_feature
```

### Documenting Session
```bash
# Create session documentation
echo "# Session: New Feature Implementation" > docs/feat_new_feature/sessao-new-feature.md

# Document development guide
echo "# Development Guide: New Feature" > docs/feat_new_feature/desenvolvimento-new-feature.md
```

### After Merge
```bash
# Move relevant docs to main
mv docs/feat_new_feature/desenvolvimento-new-feature.md docs/main/

# Update links in README.md
# Archive or delete branch-specific docs
```

---

**Current Branch**: `feat_deploy_local`
**Documentation Path**: `docs/feat_deploy_local/`
**Status**: Active development documentation