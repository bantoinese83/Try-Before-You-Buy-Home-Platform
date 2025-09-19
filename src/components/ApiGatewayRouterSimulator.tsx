'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ApiGatewayRouter, RoutingRule, IncomingRequest, RoutingResult } from '../apiGateway/router'

// --- Default Rules for Demonstration ---
const defaultRules: RoutingRule[] = [
  { id: 'rule-users-prefix', pathPrefix: '/users', targetService: 'userService', priority: 10 },
  { id: 'rule-health-exact', exactPath: '/health', targetService: 'healthService', method: 'GET', priority: 20 },
  { id: 'rule-properties-prefix', pathPrefix: '/properties', targetService: 'propertyService', priority: 5 },
  { id: 'rule-bookings-prefix', pathPrefix: '/bookings', targetService: 'bookingService', priority: 8 },
  { id: 'rule-admin-post', exactPath: '/admin', targetService: 'adminService', method: 'POST', priority: 15 },
  { id: 'rule-admin-get-prefix', pathPrefix: '/admin', targetService: 'adminDashboardService', method: 'GET', priority: 10 },
  { id: 'rule-root-default', pathPrefix: '/', targetService: 'defaultService', priority: 0 }
]

/**
 * @function ApiGatewayRouterSimulator
 * @description A React component to simulate and visualize the ApiGatewayRouter's behavior.
 * It allows users to input request details and see the routing result,
 * as well as view and update the routing rules.
 */
const ApiGatewayRouterSimulator: React.FC = () => {
  // useRef to persist the ApiGatewayRouter instance across renders
  const routerRef = useRef<ApiGatewayRouter>(new ApiGatewayRouter(defaultRules))

  // State for displaying rules, request input, and routing result
  const [currentRules, setCurrentRules] = useState<RoutingRule[]>(routerRef.current.rules)
  const [requestPath, setRequestPath] = useState<string>('/properties/123/details')
  const [requestMethod, setRequestMethod] = useState<string>('GET')
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null)
  const [rulesJsonInput, setRulesJsonInput] = useState<string>(
    JSON.stringify(defaultRules, null, 2)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  /**
   * Updates the displayed rules whenever the router's internal state potentially changes.
   * This is called after construction and after `updateRules`.
   */
  const updateDisplayedRules = useCallback(() => {
    setCurrentRules([...routerRef.current.rules]) // Ensure a new array reference for state update
  }, [])

  useEffect(() => {
    updateDisplayedRules()
  }, [updateDisplayedRules])

  /**
   * Handles the simulation of a request through the ApiGatewayRouter.
   */
  const handleRouteRequest = () => {
    const request: IncomingRequest = {
      path: requestPath,
      method: requestMethod.toUpperCase(), // Normalize method to uppercase
    }
    const result = routerRef.current.routeRequest(request)
    setRoutingResult(result)
  }

  /**
   * Handles updating the router's rules from a JSON input.
   */
  const handleUpdateRules = () => {
    try {
      const newRules: RoutingRule[] = JSON.parse(rulesJsonInput)
      if (!Array.isArray(newRules) || !newRules.every(rule => rule.id && rule.targetService)) {
        throw new Error('JSON must be an array of valid RoutingRule objects (id and targetService required).')
      }
      routerRef.current.updateRules(newRules)
      updateDisplayedRules() // Refresh displayed rules
      setJsonError(null) // Clear any previous error
    } catch (error: unknown) {
      setJsonError(`Invalid JSON or rule format: ${error instanceof Error ? error.message : String(error)}`)
      console.error('Error updating rules:', error)
    }
  }

  const exampleRequests = [
    { path: '/users/123/profile', method: 'GET', description: 'User profile request' },
    { path: '/properties/456/book', method: 'POST', description: 'Property booking request' },
    { path: '/health', method: 'GET', description: 'Health check request' },
    { path: '/admin', method: 'POST', description: 'Admin action request' },
    { path: '/admin/dashboard', method: 'GET', description: 'Admin dashboard request' },
    { path: '/unknown/endpoint', method: 'PUT', description: 'Unknown endpoint (fallback)' }
  ]

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Try-Before-You-Buy Platform</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-8">API Gateway Router Simulator</h2>

        {/* Request Simulation Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">🚀 Simulate API Request</h3>
          
          {/* Example Requests */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-600 mb-3">Quick Examples:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {exampleRequests.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setRequestPath(example.path)
                    setRequestMethod(example.method)
                  }}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors duration-150"
                >
                  <div className="font-mono text-sm text-blue-600">{example.method} {example.path}</div>
                  <div className="text-xs text-gray-500 mt-1">{example.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label htmlFor="requestPath" className="block text-sm font-medium text-gray-700 mb-1">Request Path</label>
              <input
                type="text"
                id="requestPath"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                value={requestPath}
                onChange={(e) => setRequestPath(e.target.value)}
                placeholder="/api/v1/resource"
              />
            </div>
            <div>
              <label htmlFor="requestMethod" className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
              <select
                id="requestMethod"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                value={requestMethod}
                onChange={(e) => setRequestMethod(e.target.value)}
              >
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleRouteRequest}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-150 ease-in-out"
          >
            🎯 Route Request
          </button>

          {/* Routing Result Display */}
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
            <h4 className="text-lg font-medium text-indigo-800 mb-2">Routing Result:</h4>
            {routingResult ? (
              <div>
                <pre className="bg-indigo-100 p-3 rounded-md text-sm text-indigo-900 overflow-x-auto">
                  <code>{JSON.stringify(routingResult, null, 2)}</code>
                </pre>
                <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-md">
                  <div className="text-green-800">
                    <strong>✅ Request routed successfully!</strong>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Target Service: <span className="font-mono bg-green-200 px-1 rounded">{routingResult.targetService}</span>
                  </div>
                  <div className="text-sm text-green-700">
                    Target Path: <span className="font-mono bg-green-200 px-1 rounded">{routingResult.targetPath}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-100 border border-red-200 rounded-md">
                <div className="text-red-800">
                  <strong>❌ No route found</strong>
                </div>
                <div className="text-sm text-red-700 mt-1">
                  No matching routing rule found for this request.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Current Rules Display Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">📋 Current Routing Rules (Priority Order)</h3>
          {currentRules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path Prefix</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exact Path</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Service</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRules.map((rule, index) => (
                    <tr key={rule.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {rule.priority ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.pathPrefix ? (
                          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {rule.pathPrefix}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.exactPath ? (
                          <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {rule.exactPath}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {rule.method || 'ANY'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-semibold text-purple-600">{rule.targetService}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No routing rules configured.</p>
          )}
        </div>

        {/* Update Rules Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">⚙️ Update Routing Rules</h3>
          <p className="text-gray-600 mb-4">
            Modify the JSON below to update the router&apos;s rules. Ensure valid JSON format with required fields: <code>id</code> and <code>targetService</code>.
          </p>
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
            value={rulesJsonInput}
            onChange={(e) => setRulesJsonInput(e.target.value)}
            spellCheck="false"
          ></textarea>
          {jsonError && (
            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{jsonError}</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleUpdateRules}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out"
            >
              ✅ Apply New Rules
            </button>
            <button
              onClick={() => {
                setRulesJsonInput(JSON.stringify(defaultRules, null, 2))
                setJsonError(null)
                routerRef.current.updateRules(defaultRules)
                updateDisplayedRules()
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out"
            >
              🔄 Reset to Default Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiGatewayRouterSimulator
