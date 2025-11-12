# Integration Tests

Integration tests verify that multiple components work together correctly and that the plugin integrates properly with external services.

## Running Integration Tests

Integration tests are skipped by default because they require:
- A running VaultSync backend service
- Proper API credentials
- Network connectivity
- Mock Obsidian vault environment

To run integration tests:

```bash
# Set up environment variables
export TEST_API_KEY="your_test_api_key"
export TEST_API_URL="http://localhost:3000"

# Run integration tests
npm test -- --testPathPattern="integration" --testNamePattern="^((?!skip).)*$"
```

## Test Categories

### Authentication Flow (`auth-flow.test.ts`)
Tests the complete authentication workflow including:
- API key storage and retrieval
- Token expiration handling
- Authentication state management

### Sync Workflow (`sync-workflow.test.ts`)
Tests file synchronization including:
- Local to remote sync
- Remote to local sync
- Conflict detection and resolution
- Offline mode and queue management

### Collaboration Features (`collaboration.test.ts`)
Tests real-time collaboration including:
- Presence tracking
- Collaborative editing with Yjs
- Active user management
- File viewer tracking

## Writing Integration Tests

Integration tests should:
1. Test real interactions between components
2. Use actual backend services (not mocks)
3. Verify end-to-end workflows
4. Be marked with `describe.skip()` by default
5. Include setup/teardown for test data
6. Clean up after themselves

## Best Practices

- Keep integration tests separate from unit tests
- Use environment variables for configuration
- Implement proper cleanup to avoid test pollution
- Document any special setup requirements
- Consider using test containers for backend services
