import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { workflowEngine } from '@/lib/workflow-engine'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_READ')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const rule = await workflowEngine.getRule(user.tenantId, params.id)
    if (!rule) {
      return ApiResponse.error('Workflow rule not found', 404)
    }

    return ApiResponse.success(rule)
  } catch (error) {
    console.error('Error fetching workflow rule:', error)
    return ApiResponse.error('Failed to fetch workflow rule', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_UPDATE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { name, description, trigger, actions, isActive, priority } = body

    const updatedRule = await workflowEngine.updateRule(user.tenantId, params.id, {
      ...(name && { name }),
      ...(description && { description }),
      ...(trigger && { trigger }),
      ...(actions && { actions }),
      ...(isActive !== undefined && { isActive }),
      ...(priority !== undefined && { priority })
    })

    if (!updatedRule) {
      return ApiResponse.error('Workflow rule not found', 404)
    }

    return ApiResponse.success(updatedRule)
  } catch (error) {
    console.error('Error updating workflow rule:', error)
    return ApiResponse.error('Failed to update workflow rule', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'WORKFLOW_DELETE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const deleted = await workflowEngine.deleteRule(user.tenantId, params.id)
    if (!deleted) {
      return ApiResponse.error('Workflow rule not found', 404)
    }

    return ApiResponse.success({ message: 'Workflow rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting workflow rule:', error)
    return ApiResponse.error('Failed to delete workflow rule', 500)
  }
}
