import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { workflowEngine } from '@/lib/workflow-engine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_READ')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let executions = ruleId
      ? await workflowEngine.getExecutionsByRule(user.tenantId, ruleId)
      : await workflowEngine.getExecutions(user.tenantId)

    // Filter by rule
    if (status) {
      executions = executions.filter(exec => exec.status === status)
    }

    // Sort by executedAt descending
    executions.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())

    // Limit results
    executions = executions.slice(0, limit)

    return ApiResponse.success(executions)
  } catch (error) {
    console.error('Error fetching workflow executions:', error)
    return ApiResponse.error('Failed to fetch workflow executions', 500)
  }
}
