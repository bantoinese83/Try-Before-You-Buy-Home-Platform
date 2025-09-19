/**
 * @interface RoutingRule
 * Defines the structure for a single routing rule.
 * Rules specify how incoming requests are matched and routed to target services.
 */
export interface RoutingRule {
  id: string;
  pathPrefix?: string; // Matches if request.path starts with this prefix. e.g., /users
  exactPath?: string;  // Matches if request.path is exactly this path. e.g., /health
  method?: string;     // Optional HTTP method (GET, POST, etc.). If specified, must match.
  targetService: string; // The identifier of the microservice to route to.
  priority?: number;   // Higher numbers indicate higher precedence. Default to 0.
}

/**
 * @interface IncomingRequest
 * Represents an incoming request to the API Gateway.
 */
export interface IncomingRequest {
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * @interface RoutingResult
 * Represents the outcome of a successful routing operation.
 */
export interface RoutingResult {
  targetService: string; // The service to forward the request to.
  targetPath: string;    // The path to use when forwarding to the target service (prefix stripped if applicable).
  // Potentially other forwarding details like headers
}

/**
 * @class ApiGatewayRouter
 * Manages a set of routing rules and provides functionality to route incoming requests
 * based on these rules, respecting priority and specificity.
 */
export class ApiGatewayRouter {
  private _rules: RoutingRule[];

  /**
   * Initializes the ApiGatewayRouter with a set of routing rules.
   * Rules are internally sorted upon initialization for efficient lookup.
   * @param rules An array of RoutingRule objects.
   */
  constructor(rules: RoutingRule[]) {
    this._rules = []; // Initialize to an empty array first
    this.updateRules(rules); // Use updateRules to ensure sorting happens
  }

  /**
   * Returns the currently configured routing rules.
   * Note: This getter exposes the internal state for debugging/display purposes.
   * In a production system, you might provide a deep clone or more controlled access.
   */
  public get rules(): RoutingRule[] {
    return this._rules;
  }

  /**
   * Sorts the internal rules based on priority and specificity.
   * Rules are sorted in descending order of priority.
   * Tie-breaking rules for equal priority:
   * 1. Exact path matches take precedence over path prefix matches.
   * 2. Longer path segments (for either exact or prefix) take precedence over shorter ones.
   */
  private _sortRules(): void {
    this._rules.sort((a, b) => {
      // 1. Priority (descending: higher priority comes first)
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityB !== priorityA) {
        return priorityB - priorityA;
      }

      // 2. Specificity: Exact path over Path prefix
      const aIsExact = !!a.exactPath;
      const bIsExact = !!b.exactPath;
      if (aIsExact && !bIsExact) return -1; // a is exact, b is prefix -> a comes first
      if (!aIsExact && bIsExact) return 1;  // b is exact, a is prefix -> b comes first

      // 3. Path length (descending: longer paths are more specific)
      // This applies if both are exact OR both are prefixes.
      const pathA = a.exactPath || a.pathPrefix || '';
      const pathB = b.exactPath || b.pathPrefix || '';
      if (pathB.length !== pathA.length) {
        return pathB.length - pathA.length;
      }

      // 4. Fallback: If still tied, maintain original relative order (stable sort).
      // Or by ID for deterministic, if needed. For now, 0 is fine for stable sort.
      return 0;
    });
  }

  /**
   * Routes an incoming request to the appropriate microservice based on the configured rules.
   * It iterates through the sorted rules and returns the first matching rule's target service and path.
   * @param request The incoming request object.
   * @returns A RoutingResult object if a matching rule is found, otherwise null.
   */
  routeRequest(request: IncomingRequest): RoutingResult | null {
    for (const rule of this._rules) {
      // Check HTTP method if specified in the rule
      if (rule.method && rule.method.toUpperCase() !== request.method.toUpperCase()) {
        continue; // Method mismatch, try next rule
      }

      let pathMatches = false;
      let targetPathForService = request.path;

      // Check for exact path match
      if (rule.exactPath) {
        if (request.path === rule.exactPath) {
          pathMatches = true;
          targetPathForService = request.path; // Exact path implies no prefix stripping
        }
      }
      // Check for path prefix match (only if not an exact path rule or if exact path didn't match)
      else if (rule.pathPrefix) {
        if (request.path.startsWith(rule.pathPrefix)) {
          pathMatches = true;
          // Calculate targetPath by stripping the prefix
          let strippedPath = request.path.substring(rule.pathPrefix.length);
          if (strippedPath === '') {
            targetPathForService = '/'; // e.g., /users with prefix /users should become /
          } else if (!strippedPath.startsWith('/')) {
            targetPathForService = '/' + strippedPath; // Ensure it always starts with '/'
          } else {
            targetPathForService = strippedPath;
          }
        }
      }

      if (pathMatches) {
        return {
          targetService: rule.targetService,
          targetPath: targetPathForService,
        };
      }
    }

    // No matching rule found
    return null;
  }

  /**
   * Updates the router's rules with a new set.
   * The new rules are immediately sorted to reflect updated priorities and specificities.
   * @param newRules An array of new RoutingRule objects.
   */
  updateRules(newRules: RoutingRule[]): void {
    this._rules = [...newRules]; // Create a shallow copy to prevent external modification
    this._sortRules();
  }
}