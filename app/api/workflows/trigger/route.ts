import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { workflowEngine } from '@/lib/workflow-engine'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_EXECUTE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { eventType, data } = body

    // Validate required fields
    if (!eventType || !data) {
      return ApiResponse.error('Event type and data are required', 400)
    }

    // Trigger workflow rules
    const executions = await workflowEngine.triggerEvent(user.tenantId, eventType, data)

    return ApiResponse.success({
      message: 'Workflow triggered successfully',
      executions: executions.map(exec => ({
        id: exec.id,
        ruleId: exec.ruleId,
        status: exec.status,
        executedAt: exec.executedAt
      }))
    })
  } catch (error) {
    console.error('Error triggering workflow:', error)
    return ApiResponse.error('Failed to trigger workflow', 500)
  }
}
