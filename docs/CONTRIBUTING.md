# CityFixAI — Contributing

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## Development Workflow

### 1. Branch Setup
- All work happens on feature branches created from `develop`
- Feature branches: `git checkout -b feature/xxxx develop`
- Hotfix branches: `git checkout -b hotfix/xxxx main`

### 2. Local Development
```bash
# Clone the repository
git clone https://github.com/yourorg/cityfixai.git
cd cityfixai

# Backend development
cd backend
cp .env.example .env  # Fill in your Supabase credentials
uvicorn app.main:app --reload

# Mobile development
cd apps/mobile
cp .env.example .env  # Fill in your Supabase and API URLs
npm install
npx expo start
```

### 3. Making Changes
1. Create a new branch from `develop`
2. Implement your feature or bug fix
3. Follow the existing code patterns and style
4. Add or update tests as appropriate
5. Update documentation if user-facing behavior changes

### 4. Submitting Changes
1. Commit with a clear message: `git commit -m "feat: add new feature"`
2. Push to your fork: `git push origin feature/xxxx`
3. Open a Pull Request against the `develop` branch
4. PR description should include:
   - Summary of changes
   - Reason for the change
   - Tests added/updated
   - Screenshots (if UI changes)
   - Any breaking changes

### 5. Code Review
All PRs require code review from at least one maintainer before merging.
- Address reviewer feedback with additional commits
- Keep PRs focused (one feature/bug per PR)
- Run the full test suite before requesting review

### 6. Merging
Once approved, maintainers merge to `develop`:
```bash
git checkout develop
git pull origin develop
git merge feature/xxxx
git push origin develop
```

Then, on `main`:
```bash
# CI/CD automatically deploys on main branch push
# No manual merge needed for deployment
```

## Code Style Guidelines

### Python (Backend)
- Follow [PEP 8](https://pep8.org/) style
- Use Black formatter: `black .`
- Use isort for imports: `isort .`
- Type hints for all functions (mypy: `mypy app/`)

### TypeScript (Mobile)
- Follow [Airbnb JavaScript Style Guide](https://airbnb.io/javascript/)
- Use ESLint: `npm run lint`
- Use Prettier: `npm run format`
- TypeScript strict mode enabled

### Commit Message Convention
```
type: concise description

# Types:
feat:     new feature
fix:      bug fix
docs:     documentation changes
style:    formatting, missing semicolons, etc.
refactor: code refactor
test:     adding missing tests
chore:    updating build scripts, etc.

# Scope is optional but encouraged:
feat(api): add new endpoint
feat(ui): add new screen

# Example:
feat(reports): add image upload endpoint
fix(auth): fix JWT token expiration bug
```

## Project Structure Guidelines

### Adding New Routes
1. Add route handler in `backend/app/api/` (e.g., `new_route.py`)
2. Add Pydantic schemas in `backend/app/schemas/` if request/response models needed
3. Add RLS policies if needed in Supabase dashboard
4. Add API documentation in `API_DOCUMENTATION.md`
5. Add OpenAPI examples if needed

### Adding New Agents
1. Add agent function in `backend/app/agents/` (e.g., `new_agent.py`)
2. Register agent in `workflow.py` AGENTS list
3. Add workflow node in `build_workflow()`
4. Update `run_workflow()` if payload changes
5. Add audit logging in `persist_audit_entries()`

## Branch Protection Rules

### `develop` Branch
- Require PR review from at least one maintainer
- Require successful CI pipeline (lint, typecheck, test)
- No direct pushes allowed

### `main` Branch
- Require PR review from at least two maintainers (or one maintainer + one code owner)
- Require successful CI pipeline plus deployment verification
- Automatic deployment to production on merge
- No force pushes allowed

## Recognition

Contributors who make significant contributions will be recognized in:
- The `CONTRIBUTORS.md` file (to be created)
- The project's README (updated periodically)
- The GitHub repository contributors graph

## QA Checklist

Before marking a PR as ready for review, ensure:
- [ ] All new and existing tests pass
- [ ] Code follows the project's style guidelines
- [ ] Documentation is updated for user-facing changes
- [ ] No secret keys or API tokens are committed
- [ ] Changelog or notes updated if appropriate
- [ ] Manual testing performed (at minimum, the health check and report creation flow)