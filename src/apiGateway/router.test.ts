import { ApiGatewayRouter, RoutingRule, IncomingRequest, RoutingResult } from './router';

// Mock routing rules for testing
const mockRules: RoutingRule[] = [
  { id: 'rule-users-prefix', pathPrefix: '/users', targetService: 'userService', priority: 10 },
  { id: 'rule-health-exact', exactPath: '/health', targetService: 'healthService', method: 'GET', priority: 20 },
  { id: 'rule-products-prefix', pathPrefix: '/products', targetService: 'productService', priority: 5 },
  { id: 'rule-admin-post', exactPath: '/admin', targetService: 'adminService', method: 'POST', priority: 15 },
  { id: 'rule-admin-get-prefix', pathPrefix: '/admin', targetService: 'adminDashboardService', method: 'GET', priority: 10 }, // Overlaps with #4 but different method/priority
  { id: 'rule-root-default', pathPrefix: '/', targetService: 'defaultService', priority: 0 } // Default fallback
];

describe('ApiGatewayRouter - Request Routing', () => {

  let router: ApiGatewayRouter;

  beforeEach(() => {
    // Initialize router with a fresh set of rules for each test
    router = new ApiGatewayRouter([...mockRules]);
  });

  // --- Unit Tests ---

  describe('Unit Tests: Individual Routing Logic', () => {
    it('should initialize with rules sorted by priority (highest first)', () => {
      // Assuming the constructor sorts the rules internally.
      // We can't directly test internal private state, so we'll infer this from routing behavior later.
      // For now, we'll check if the highest priority rule is considered first.
      const request: IncomingRequest = { path: '/admin', method: 'POST' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'adminService', targetPath: '/admin' });
      // If rule-admin-post (priority 15) wasn't prioritized over rule-admin-get-prefix (priority 10), this would fail.
    });

    it('should match an exact path rule with correct method', () => {
      const request: IncomingRequest = { path: '/health', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'healthService', targetPath: '/health' });
    });

    it('should not match an exact path rule if method does not match', () => {
      const request: IncomingRequest = { path: '/health', method: 'POST' }; // Health is GET only
      const result = router.routeRequest(request);
      expect(result).not.toEqual({ targetService: 'healthService', targetPath: '/health' });
      // It should fall through to a lower priority rule or null
      expect(result).toEqual({ targetService: 'defaultService', targetPath: '/health' });
    });

    it('should match a path prefix rule', () => {
      const request: IncomingRequest = { path: '/users/123/profile', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'userService', targetPath: '/123/profile' });
    });

    it('should match a path prefix rule for the root path', () => {
      const request: IncomingRequest = { path: '/', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'defaultService', targetPath: '/' });
    });

    it('should return null if no matching rule is found and no default fallback exists', () => {
      const routerWithoutDefault = new ApiGatewayRouter([
        { id: 'r1', pathPrefix: '/test', targetService: 'testService', priority: 10 }
      ]);
      const request: IncomingRequest = { path: '/nomatch', method: 'GET' };
      const result = routerWithoutDefault.routeRequest(request);
      expect(result).toBeNull();
    });

    it('should strip the path prefix correctly for targetPath', () => {
      const request: IncomingRequest = { path: '/users/settings', method: 'PUT' };
      const result = router.routeRequest(request);
      expect(result?.targetService).toBe('userService');
      expect(result?.targetPath).toBe('/settings'); // Path /users/settings -> /settings
    });

    it('should keep original path if prefix is root and rule matches', () => {
      const request: IncomingRequest = { path: '/anything', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result?.targetService).toBe('defaultService');
      expect(result?.targetPath).toBe('/anything');
    });

    it('should keep original path for exact path matches', () => {
      const request: IncomingRequest = { path: '/health', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result?.targetService).toBe('healthService');
      expect(result?.targetPath).toBe('/health');
    });
  });

  // --- Integration Tests ---

  describe('Integration Tests: Complex Routing Scenarios', () => {
    it('should prioritize an exact path match over a prefix match with lower priority', () => {
      // Request: /admin, Method: POST
      // rule-admin-post: exactPath: /admin, method: POST, priority: 15 (target: adminService) - EXPECTED
      // rule-admin-get-prefix: pathPrefix: /admin, method: GET, priority: 10 (target: adminDashboardService) - Not matching method
      // rule-root-default: pathPrefix: /, priority: 0
      const request: IncomingRequest = { path: '/admin', method: 'POST' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'adminService', targetPath: '/admin' });
    });

    it('should prioritize a higher priority prefix rule over a lower priority prefix rule', () => {
      // Adding a new rule that overlaps with /users but has higher priority
      const customRules: RoutingRule[] = [
        ...mockRules,
        { id: 'rule-users-high-priority', pathPrefix: '/users/admin', targetService: 'userAdminService', priority: 25 },
      ];
      const customRouter = new ApiGatewayRouter(customRules);

      const request: IncomingRequest = { path: '/users/admin/dashboard', method: 'GET' };
      const result = customRouter.routeRequest(request);
      expect(result).toEqual({ targetService: 'userAdminService', targetPath: '/dashboard' });
    });

    it('should correctly route when multiple rules could potentially match, respecting priority and specificity', () => {
      // Request: /admin/config, Method: GET
      // rule-admin-post: exactPath: /admin, method: POST, priority: 15 (Does not match path or method)
      // rule-admin-get-prefix: pathPrefix: /admin, method: GET, priority: 10 (target: adminDashboardService) - EXPECTED
      // rule-root-default: pathPrefix: /, priority: 0
      const request: IncomingRequest = { path: '/admin/config', method: 'GET' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'adminDashboardService', targetPath: '/config' });
    });

    it('should route to the default service if no specific rule matches', () => {
      const request: IncomingRequest = { path: '/unknown/path', method: 'PUT' };
      const result = router.routeRequest(request);
      expect(result).toEqual({ targetService: 'defaultService', targetPath: '/unknown/path' });
    });

    it('should handle dynamic rule updates', () => {
      const newRules: RoutingRule[] = [
        { id: 'new-rule-test', pathPrefix: '/test', targetService: 'testServiceUpdated', priority: 100 },
        { id: 'new-rule-default', pathPrefix: '/', targetService: 'newDefaultService', priority: 0 }
      ];
      router.updateRules(newRules);

      // Test a request that matches the new rule
      const request1: IncomingRequest = { path: '/test/route', method: 'GET' };
      const result1 = router.routeRequest(request1);
      expect(result1).toEqual({ targetService: 'testServiceUpdated', targetPath: '/route' });

      // Test a request that would have matched an old rule but now matches the new default
      const request2: IncomingRequest = { path: '/users/1', method: 'GET' };
      const result2 = router.routeRequest(request2);
      expect(result2).toEqual({ targetService: 'newDefaultService', targetPath: '/users/1' }); // old rule-users-prefix is gone
    });

    it('should handle an empty rules array gracefully', () => {
      const emptyRouter = new ApiGatewayRouter([]);
      const request: IncomingRequest = { path: '/any', method: 'GET' };
      const result = emptyRouter.routeRequest(request);
      expect(result).toBeNull();
    });

    it('should handle rules with only pathPrefix "/" and exactPath "/" correctly', () => {
      const rulesWithRootSpecifics: RoutingRule[] = [
        { id: 'root-exact', exactPath: '/', targetService: 'exactRootService', method: 'GET', priority: 20 },
        { id: 'root-prefix', pathPrefix: '/', targetService: 'prefixRootService', priority: 10 },
      ];
      const customRouter = new ApiGatewayRouter(rulesWithRootSpecifics);

      // Should hit exact path rule
      const request1: IncomingRequest = { path: '/', method: 'GET' };
      const result1 = customRouter.routeRequest(request1);
      expect(result1).toEqual({ targetService: 'exactRootService', targetPath: '/' });

      // Should hit prefix rule (because exact path rule doesn't match method)
      const request2: IncomingRequest = { path: '/', method: 'POST' };
      const result2 = customRouter.routeRequest(request2);
      expect(result2).toEqual({ targetService: 'prefixRootService', targetPath: '/' });

      // Should hit prefix rule for sub-paths
      const request3: IncomingRequest = { path: '/subpath', method: 'GET' };
      const result3 = customRouter.routeRequest(request3);
      expect(result3).toEqual({ targetService: 'prefixRootService', targetPath: '/subpath' });
    });
  });
});
