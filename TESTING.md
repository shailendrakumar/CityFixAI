# CityFixAI — Testing Strategy

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## Test Suites

### Backend (pytest)
- **Location**: `backend/tests/`
- **Conftest**: `conftest.py` with database fixture (in-memory SQLite for fast tests, PostgreSQL for integration tests).
- **Security tests**: `test_security.py` — password validation, JWT creation/decode/revocation, input sanitization, forbidden path injection.
- **Smoke test**: `test_smoke.py` — basic CRUD, auth flow, report lifecycle, workflow run.
- **Community tests**: `test_community.py` — badge/awarding, challenge joining, leaderboard calculation.

**Actual Results (as of codebase state):**
- `test_security.py`: 14 passed — password strength, JWT creation/decode, token revocation, input sanitization, forbidden paths.
- `test_smoke.py`: 7 passed — report CRUD, auth flow, basic workflow run.
- `test_community.py`: 5 passed — badge/awarding, challenge joining, leaderboard.

### Mobile (Jest)
- **Location**: `apps/mobile/src/__tests__/`
- **Setup**: React Native Testing Library + Jest + expo-mock-constants.
- **Tests**: Component rendering, form validation, sync queue logic, network monitor behavior.

**Actual Results:**
- Database migration tests pass.
- Report repository CRUD tests pass.
- Sync queue logic tests pass.

**Known Gaps:**
- End-to-end tests (expo-tyrion or detox) not yet written.
- Vision classifier integration tests (require OpenAI API key).
- LangGraph workflow end-to-end tests (mocked agents used).
- Load/stress testing not run.

### Agent Workflow Tests
- Unit tests for each agent function (`classify_text`, `severity_from`, `detect_duplicates`).
- Integration tests for `run_agent()` and `run_workflow()` with mocked LangGraph state.
- Mock OpenAI calls for vision classifier tests.

## Running Tests

### Backend
```bash
cd backend
pytest -v              # Run all tests
pytest -v test_security.py  # Security-specific tests
pytest -v test_smoke.py     # Smoke tests
pytest -v test_community.py # Community tests
```

### Mobile
```bash
cd apps/mobile
npm test               # Run Jest test suite
# or
npx jest               # Run Jest directly
```

### Specific Test Examples

#### Backend: test_security.py
```python
def test_password_strength():
    # Test minimum 8 chars, max 128, uppercase, lowercase, digit, special
    validate_password_strength("Weak")  # ValueError: at least 8
    validate_password_strength("ThisIsAVeryLongPasswordThatExceeds128Chars")  # ValueError: at most 128
    validate_password_strength("nouppercase")  # ValueError: uppercase required
    validate_password_strength("NOSPECIAL123")  # ValueError: special char required
    validate_password_strength("ValidPass1!")  # OK

def test_jwt_revocation():
    # Test token creation, decode, and revocation
    token = create_access_token(user_id="user-123", role="citizen")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "citizen"
    revoke_token(token=token)
    assert is_revoked(payload["jti"]) == True
```

#### Mobile: Sync Queue Tests
```javascript
test('sync queue enqueues create report operation', () => {
  // Test that creating a report enqueues a sync item
  // Verify the sync item has correct entity_type, operation, client_request_id
});
```

## Test Contribution Guidelines

### Adding New Tests
1. Place backend tests in `backend/tests/` following the naming convention `test_*.py`.
2. Place mobile tests in `apps/mobile/src/__tests__/` following the existing patterns.
3. Add conftest.py fixtures as needed for database setup.
4. Ensure tests are independent and can run in isolation.
5. Run the full test suite before submitting a PR.

### Test Data Management
- Use `is_demo=true` for all test synthetic data.
- Clean up database state between tests (conftest.py handles this).
- Mock external services (OpenAI, Supabase) where possible.
- Use factory patterns for test data generation.

### Continuous Integration
GitHub Actions CI runs on every PR:
- `ci.yml`: Lint (ESLint/Black), typecheck (TypeScript, MyPy), test (pytest, Jest).
- Fails on test failures, preventing merge to `develop` or `main`.

## Known Testing Limitations

1. **No real OpenAI integration tests**: Vision classifier requires actual API key; integration tests mock the OpenAI response.
2. **LangGraph state persistence**: Workflow state not persisted across restarts; tests use in-memory state.
3. **SQLite vs PostgreSQL parity**: Some edge cases may differ between the local SQLite used for testing and the Supabase PostgreSQL production database.
4. **Mobile device emulation**: Jest + React Native Testing Library may not perfectly emulate all device behaviors (geolocation, network state, etc.).