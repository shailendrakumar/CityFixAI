
#  👥 Night Hero – Team Members & Responsibilities

#    Team Member                    Responsibilities

1.    Shailendra Kumar Gupta        - Android Application Development
                                    - Backend Development & API Integration
                                    - Web Application Development
                                    - Brand Kit & Branding
                                    - Project Documentation
                                    - Social Media Engagement & Promotion

2.    Ronak Chavan                  - Explainer Video Creation
                                    - Social Media Posts (3 Posts)
                                    - Creative Content & Visual Storytelling

3.   Gaurav Kumar                   - Application Icon Design
                                    - App Branding & Icon Assets

4.   Sathasivam                     - Landing Page Design & Development
                                    - Website UI/UX

# 🤝 Team Collaboration

The Night Hero team collaborated across application development, backend engineering, branding, documentation, creative content, and web design to build and present the solution.
Each team member contributed to a different aspect of the project, ensuring a complete product experience.


# CityFixAI

CityFixAI is a community-driven pothole and infrastructure reporting platform that leverages AI to categorize and prioritize repairs.

## Project Structure

```
CityFixAI/
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml              # CI: lint, typecheck, tests
│       ├── deploy-web.yml      # Deploy Expo Web to Vercel
│       ├── deploy-mobile.yml   # Deploy mobile builds via Expo EAS
│       └── deploy-backend.yml  # Deploy FastAPI to Vercel
├── apps/
│   └── mobile/                 # Expo React Native application
│       ├── .env.example        # Mobile environment variables
│       ├── .gitignore
│       ├── app.json            # Expo configuration
│       ├── package.json        # Dependencies
│       ├── tsconfig.json       # TypeScript config
│       ├── jest.config.js      # Test configuration
│       └── src/                # Source code
├── backend/                    # FastAPI backend
│   ├── .env.example            # Backend environment variables
│   ├── requirements.txt        # Python dependencies
│   ├── main.py                 # FastAPI application entry point
│   ├── app/                    # Application source code
│   ├── tests/                  # Test suite
│   └── supabase/               # Supabase configuration
└── docs/                       # Documentation
```

## Branches

- `main` - Production branch: Deployed code is always production-ready
- `develop` - Development branch: Integration branch for features and bug fixes
- Feature branches: Created from `develop`, merged back via Pull Requests

## CI/CD Pipeline

### Continuous Integration (CI)

Every push and pull request triggers the CI pipeline:

1. **Lint** - Runs ESLint/Style checks on mobile code
2. **TypeScript** - Type checks the mobile codebase
3. **Frontend Tests** - Runs Jest test suite
4. **Backend Tests** - Runs pytest suite against FastAPI
5. **Build** - Runs `expo prebuild` to prepare native code
6. **Deploy** - Deploys to Expo only on `main` branch merges

### Workflows

- `.github/workflows/ci.yml` - Lint, typecheck, and test on all PRs
- `.github/workflows/deploy-web.yml` - Deploy web to Vercel on `main` push
- `.github/workflows/deploy-mobile.yml` - Build Android on `main` push
- `.github/workflows/deploy-backend.yml` - Deploy FastAPI to Vercel on `main` push


### Mobile (Expo EAS)

1. **Android**: `eas build -p android --profile preview` creates APK
3. Builds are triggered on `main` branch pushes
4. Artifacts are available as GitHub Actions workflow artifacts

### Backend (FastAPI + Vercel)

1. FastAPI deployed as a Vercel Serverless Function
2. HTTPS enforced via Vercel HTTPS configuration
3. CORS configured with production allowlist
4. Production database connection via Supabase
5. Health check endpoint: `GET /health`

## Security

- **Never commit API keys or production secrets** to version control
- Use GitHub Actions secrets for all production credentials
- Branch protection rules on `main` require PR reviews
- Production CORS origins are explicitly allowlisted
- HTTPS enforced on all deployed endpoints
- Security headers via middleware (X-Content-Type-Options, X-Frame-Options, etc.)

## Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Expo CLI
- EAS CLI
- Vercel CLI
- Supabase account

### Local Development

```bash
# Mobile
cd apps/mobile
cp .env.example .env
# Fill in local Supabase/ API values
npm install
npx expo start

# Backend
cd backend
cp .env.example .env
# Fill in local values
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## License

MIT
EOF

## Working solution
https://drive.google.com/file/d/1ulotiB2u8uKY6oHP_I8TG8_e5tCiRU7F/view?usp=sharing

## Project documentation
https://docs.google.com/document/d/1wvTuwYWwnvTb6Hrk2TEonHe-CUGKPn6-7frZPGDLYYI/edit?tab=t.0#heading=h.zfmor7fbhk9a

## Landing page
https://drive.google.com/file/d/1CvoEucU_YLf_4X7OimeCzzn8k-lbhJLe/view?usp=sharing

## Brand kit
https://drive.google.com/file/d/1DrOVxBiE77ETrRAjUWoHAMKfaKLWFXun/view?usp=sharing

## Launch film
https://www.instagram.com/reels/DgNWmDMRWCt/

## Explainer video
https://drive.google.com/file/d/1caWi-K_LQrhyY21VR60oHWzY71RwfXLu/view?usp=sharing

## Social media posts
https://www.instagram.com/reels/DgIPxw8R2Mx/

https://x.com/cityfixai/status/2125172782325797291?a=OvmEFcrUl3byDrr2qGU&s=08

## Social media engagement

<img width="677" height="517" alt="Screenshot 2026-11-28 at 1 50 10 PM" src="https://github.com/user-attachments/assets/5e3866b0-291b-4254-a370-eede3464d3c7" />


## Tools and technologies
 * React Native
* Expo
* TypeScript
* Expo Router
* NativeWind
* Expo SQLite
* Expo Camera
* Expo Image Picker
* Expo Location
* Expo Network
* Python
* FastAPI
* Pydantic
* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* LangGraph
* OpenAI API (Vision-capable model)
* Scikit-learn
* pgvector
* OpenStreetMap
* Leaflet
* React Native Maps
* Next.js
* Tailwind CSS
* Recharts
* Git
* GitHub
* VS Code
* Postman
* Pytest
* Jest
* Expo Go
* Expo EAS
* Vercel
* Render / Railway
* Sentry
