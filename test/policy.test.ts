import { Policy } from '../src';

describe('Policy', () => {
  let sdk: Policy;
  const schema = { users: {}, orders: {} };

  beforeEach(() => {
    sdk = new Policy(schema);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('addPolicy should add a policy', () => {
    sdk.addPolicy('user1', 'users', 'SELECT');
    expect(sdk.policies).toHaveLength(1);
  });

  test('generateRegoFile should generate a correct Rego file', () => {
    sdk.addPolicy('user1', 'users', 'SELECT');
    sdk.generateRegoFile('./test/policy.rego');
  });
});
