import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { workflowEngine } from '@/lib/workflow-engine'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_READ')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const rules = await workflowEngine.getRules(user.tenantId)
    return ApiResponse.success(rules)
  } catch (error) {
    console.error('Error fetching workflow rules:', error)
    return ApiResponse.error('Failed to fetch workflow rules', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_CREATE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { name, description, trigger, actions, isActive = true, priority = 1 } = body

    // Validate required fields
    if (!name || !trigger || !actions || actions.length === 0) {
      return ApiResponse.error('Name, trigger, and actions are required', 400)
    }

    // Create new rule
    const rule = await workflowEngine.addRule(user.tenantId, {
      name,
      description,
      trigger,
      actions,
      isActive,
      priority
    })

    return ApiResponse.success(rule)
  } catch (error) {
    console.error('Error creating workflow rule:', error)
    return ApiResponse.error('Failed to create workflow rule', 500)
  }
}
