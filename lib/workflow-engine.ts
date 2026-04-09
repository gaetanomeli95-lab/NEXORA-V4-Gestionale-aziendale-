import type { AuditLog, Template } from '@prisma/client'

import { prisma } from '@/lib/prisma'

type WorkflowTriggerType = 'INVOICE_CREATED' | 'PAYMENT_RECEIVED' | 'ORDER_STATUS_CHANGED' | 'STOCK_LOW' | 'CUSTOMER_CREATED'
type WorkflowActionType = 'SEND_EMAIL' | 'SEND_SMS' | 'CREATE_TASK' | 'UPDATE_STATUS' | 'NOTIFY_ADMIN' | 'CREATE_INVOICE'

export interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: {
    type: WorkflowTriggerType
    conditions: Record<string, any>
  }
  actions: Array<{
    type: WorkflowActionType
    parameters: Record<string, any>
  }>
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowExecution {
  id: string
  ruleId: string
  triggerData: any
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  result?: any
  error?: string
  executedAt: Date
}

type WorkflowRulePayload = {
  description: string
  trigger: WorkflowRule['trigger']
  actions: WorkflowRule['actions']
  priority: number
}

const WORKFLOW_TEMPLATE_TYPE = 'WORKFLOW_RULE'
const WORKFLOW_EXECUTION_ACTION = 'WORKFLOW_EXECUTION'
const WORKFLOW_EXECUTION_ENTITY = 'WORKFLOW_EXECUTION'
const WORKFLOW_EXECUTION_LIMIT = 200

export class WorkflowEngine {
  constructor() {
  }

  private initializeDefaultRules() {
    return [
      {
        // Rule 1: Send invoice email when invoice is created
        name: 'Invia email fattura',
        description: 'Invia automaticamente email con fattura quando viene creata',
        trigger: {
          type: 'INVOICE_CREATED',
          conditions: {}
        },
        actions: [
          {
            type: 'SEND_EMAIL',
            parameters: {
              template: 'invoice-created',
              recipient: '{{customer.email}}',
              subject: 'Fattura {{invoice.number}} - NEXORA v4',
              includePdf: true
            }
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        // Rule 2: Payment confirmation email
        name: 'Conferma pagamento',
        description: 'Invia email di conferma quando viene ricevuto un pagamento',
        trigger: {
          type: 'PAYMENT_RECEIVED',
          conditions: {}
        },
        actions: [
          {
            type: 'SEND_EMAIL',
            parameters: {
              template: 'payment-confirmation',
              recipient: '{{customer.email}}',
              subject: 'Conferma pagamento - NEXORA v4',
              includeReceipt: true
            }
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        // Rule 3: Low stock alert
        name: 'Alert scorte basse',
        description: 'Invia notifica quando le scorte sono basse',
        trigger: {
          type: 'STOCK_LOW',
          conditions: {
            threshold: 10
          }
        },
        actions: [
          {
            type: 'SEND_EMAIL',
            parameters: {
              template: 'low-stock-alert',
              recipient: 'admin@nexora.com',
              subject: '⚠️ Alert scorte basse - {{product.name}}'
            }
          },
          {
            type: 'NOTIFY_ADMIN',
            parameters: {
              message: 'Scorte basse per prodotto {{product.name}}: {{stock.quantity}} unità'
            }
          }
        ],
        isActive: true,
        priority: 2
      },
      {
        // Rule 4: Order status update
        name: 'Aggiornamento stato ordine',
        description: 'Notifica cliente quando cambia stato ordine',
        trigger: {
          type: 'ORDER_STATUS_CHANGED',
          conditions: {
            excludeStatuses: ['DRAFT']
          }
        },
        actions: [
          {
            type: 'SEND_EMAIL',
            parameters: {
              template: 'order-status-update',
              recipient: '{{customer.email}}',
              subject: 'Aggiornamento ordine {{order.number}}'
            }
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        // Rule 5: Overdue payment reminder
        name: 'Promemoria pagamento scaduto',
        description: 'Invia reminder per pagamenti scaduti',
        trigger: {
          type: 'INVOICE_CREATED',
          conditions: {}
        },
        actions: [
          {
            type: 'CREATE_TASK',
            parameters: {
              type: 'PAYMENT_REMINDER',
              dueDate: '{{invoice.dueDate}}',
              assignee: 'finance@nexora.com',
              description: 'Controllare pagamento fattura {{invoice.number}}'
            }
          }
        ],
        isActive: true,
        priority: 3
      }
    ] satisfies Array<Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>>
  }

  private parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) {
      return fallback
    }

    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  private toRule(template: Template): WorkflowRule {
    const payload = this.parseJson<WorkflowRulePayload>(template.html, {
      description: '',
      trigger: {
        type: 'INVOICE_CREATED',
        conditions: {}
      },
      actions: [],
      priority: 1
    })

    return {
      id: template.id,
      name: template.name,
      description: payload.description || '',
      trigger: payload.trigger,
      actions: Array.isArray(payload.actions) ? payload.actions : [],
      isActive: template.isActive,
      priority: typeof payload.priority === 'number' ? payload.priority : 1,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }
  }

  private toExecution(log: AuditLog): WorkflowExecution {
    const payload = this.parseJson<{ status?: WorkflowExecution['status']; result?: any; error?: string }>(log.newValues, {})

    return {
      id: log.id,
      ruleId: log.entityId || '',
      triggerData: this.parseJson(log.oldValues, {}),
      status: payload.status || 'PENDING',
      result: payload.result,
      error: payload.error,
      executedAt: log.createdAt
    }
  }

  private async ensureDefaultRules(tenantId: string) {
    const existingRules = await prisma.template.count({
      where: {
        tenantId,
        type: WORKFLOW_TEMPLATE_TYPE
      }
    })

    if (existingRules > 0) {
      return
    }

    const defaultRules = this.initializeDefaultRules()

    await prisma.template.createMany({
      data: defaultRules.map(rule => ({
        tenantId,
        name: rule.name,
        type: WORKFLOW_TEMPLATE_TYPE,
        html: JSON.stringify({
          description: rule.description,
          trigger: rule.trigger,
          actions: rule.actions,
          priority: rule.priority
        } satisfies WorkflowRulePayload),
        css: null,
        isDefault: true,
        isActive: rule.isActive
      }))
    })
  }

  private normalizeTriggerData(eventType: string, data: any) {
    const base = typeof data === 'object' && data !== null ? data : {}

    switch (eventType) {
      case 'INVOICE_CREATED': {
        const invoice = 'invoice' in base ? base.invoice : base
        const customer = 'customer' in base ? base.customer : invoice?.customer
        return {
          ...base,
          invoice,
          customer,
          status: base.status ?? invoice?.status,
          amount: base.amount ?? invoice?.totalAmount ?? 0
        }
      }
      case 'PAYMENT_RECEIVED': {
        const payment = 'payment' in base ? base.payment : base
        const invoice = base.invoice ?? payment?.invoice ?? null
        const customer = base.customer ?? payment?.customer ?? invoice?.customer ?? null
        return {
          ...base,
          payment,
          invoice,
          customer,
          amount: payment?.amount ?? base.amount ?? invoice?.paidAmount ?? 0,
          status: base.status ?? payment?.status ?? null
        }
      }
      case 'ORDER_STATUS_CHANGED': {
        const order = 'order' in base ? base.order : base
        const customer = base.customer ?? order?.customer ?? null
        return {
          ...base,
          order,
          customer,
          status: base.status ?? order?.status ?? null
        }
      }
      case 'STOCK_LOW': {
        const product = 'product' in base ? base.product : base
        const stock = base.stock ?? product?.stock ?? { quantity: product?.stockQuantity ?? 0 }
        return {
          ...base,
          product,
          stock
        }
      }
      case 'CUSTOMER_CREATED': {
        const customer = 'customer' in base ? base.customer : base
        return {
          ...base,
          customer
        }
      }
      default:
        return base
    }
  }

  private async createExecutionRecord(tenantId: string, ruleId: string, triggerData: any) {
    const executionLog = await prisma.auditLog.create({
      data: {
        tenantId,
        action: WORKFLOW_EXECUTION_ACTION,
        entityType: WORKFLOW_EXECUTION_ENTITY,
        entityId: ruleId,
        oldValues: JSON.stringify(triggerData),
        newValues: JSON.stringify({
          status: 'PENDING'
        })
      }
    })

    return this.toExecution(executionLog)
  }

  private async updateExecutionRecord(id: string, status: WorkflowExecution['status'], updates: Record<string, any> = {}) {
    const currentExecution = await prisma.auditLog.findUnique({
      where: { id }
    })

    if (!currentExecution) {
      return null
    }

    const currentPayload = this.parseJson<Record<string, any>>(currentExecution.newValues, {})

    const updatedExecution = await prisma.auditLog.update({
      where: { id },
      data: {
        newValues: JSON.stringify({
          ...currentPayload,
          ...updates,
          status
        })
      }
    })

    return this.toExecution(updatedExecution)
  }

  async triggerEvent(tenantId: string, eventType: string, data: any): Promise<WorkflowExecution[]> {
    const executions: WorkflowExecution[] = []
    const normalizedData = this.normalizeTriggerData(eventType, data)
    const rules = await this.getRules(tenantId)

    // Find matching rules
    const matchingRules = rules.filter(rule => 
      rule.isActive && rule.trigger.type === eventType
    )

    for (const rule of matchingRules) {
      // Check conditions
      if (this.evaluateConditions(rule.trigger.conditions, normalizedData)) {
        const execution = await this.createExecutionRecord(tenantId, rule.id, normalizedData)
        executions.push(execution)

        // Execute actions asynchronously
        void this.executeActions(tenantId, rule, normalizedData, execution.id)
      }
    }

    return executions
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    // Simple condition evaluation - in production, use more sophisticated logic
    if (Object.keys(conditions).length === 0) {
      return true
    }

    // Example: threshold condition for stock
    if (conditions.threshold && data.stock) {
      return data.stock.quantity <= conditions.threshold
    }

    // Example: exclude statuses
    const currentStatus = data.status ?? data.order?.status ?? data.invoice?.status
    if (conditions.excludeStatuses && currentStatus) {
      return !conditions.excludeStatuses.includes(currentStatus)
    }

    return true
  }

  private async executeActions(tenantId: string, rule: WorkflowRule, data: any, executionId: string) {
    await this.updateExecutionRecord(executionId, 'RUNNING')
    const actionResults: Array<Record<string, any>> = []

    try {
      for (const action of rule.actions) {
        const result = await this.executeAction(tenantId, action, data)
        actionResults.push({
          type: action.type,
          result
        })
      }

      await this.updateExecutionRecord(executionId, 'COMPLETED', {
        result: {
          actions: actionResults
        }
      })
    } catch (error) {
      await this.updateExecutionRecord(executionId, 'FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
        result: {
          actions: actionResults
        }
      })
    }
  }

  private async executeAction(tenantId: string, action: WorkflowRule['actions'][number], data: any): Promise<any> {
    switch (action.type) {
      case 'SEND_EMAIL':
        return this.sendEmail(tenantId, action.parameters, data)
      case 'SEND_SMS':
        return this.sendSMS(tenantId, action.parameters, data)
      case 'CREATE_TASK':
        return this.createTask(tenantId, action.parameters, data)
      case 'UPDATE_STATUS':
        return this.updateStatus(action.parameters, data)
      case 'NOTIFY_ADMIN':
        return this.notifyAdmin(tenantId, action.parameters, data)
      case 'CREATE_INVOICE':
        return this.createInvoice(tenantId, action.parameters, data)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async getPrimaryAdminId(tenantId: string) {
    const admin = await prisma.user.findFirst({
      where: {
        tenantId,
        role: 'ADMIN',
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true
      }
    })

    return admin?.id || null
  }

  private async sendEmail(tenantId: string, parameters: any, data: any): Promise<any> {
    // Mock email sending - in production, integrate with email service
    const recipient = this.interpolateTemplate(parameters.recipient || '', data)
    const subject = this.interpolateTemplate(parameters.subject || 'Automazione NEXORA', data)
    const adminUserId = await this.getPrimaryAdminId(tenantId)
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: adminUserId,
        type: 'WORKFLOW_EMAIL',
        title: subject || 'Email workflow',
        message: recipient
          ? `Email automatica preparata per ${recipient}`
          : 'Email automatica registrata dal workflow',
        channels: '["IN_APP"]',
        metadata: JSON.stringify({
          recipient,
          subject,
          template: parameters.template || null
        })
      }
    })
    
    // Simulate API call
    return {
      recipient,
      subject,
      notificationId: notification.id
    }
  }

  private async sendSMS(tenantId: string, parameters: any, data: any): Promise<any> {
    // Mock SMS sending
    const message = this.interpolateTemplate(parameters.message || 'Notifica automatica NEXORA', data)
    const adminUserId = await this.getPrimaryAdminId(tenantId)
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: adminUserId,
        type: 'WORKFLOW_SMS',
        title: 'SMS workflow',
        message,
        channels: '["IN_APP"]'
      }
    })
    
    return {
      message,
      notificationId: notification.id
    }
  }

  private async createTask(tenantId: string, parameters: any, data: any): Promise<any> {
    // Mock task creation
    const description = this.interpolateTemplate(parameters.description, data)
    const dueDateTemplate = parameters.dueDate ? this.interpolateTemplate(parameters.dueDate, data) : null
    const dueDate = dueDateTemplate ? new Date(dueDateTemplate) : null
    const title = description || 'Task creato automaticamente dal workflow'
    const task = await prisma.task.create({
      data: {
        tenantId,
        customerId: this.getNestedValue(data, 'customer.id') || this.getNestedValue(data, 'invoice.customerId') || this.getNestedValue(data, 'order.customerId') || null,
        title: title.slice(0, 120),
        description: [title, parameters.assignee ? `Assegnatario: ${parameters.assignee}` : null].filter(Boolean).join('\n'),
        status: 'OPEN',
        dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null
      }
    })
    
    return {
      taskId: task.id,
      title: task.title
    }
  }

  private async updateStatus(parameters: any, data: any): Promise<any> {
    // Mock status update
    const nextStatus = parameters.status || 'PROCESSING'

    if (data.order?.id) {
      const order = await prisma.order.update({
        where: { id: data.order.id },
        data: { status: nextStatus }
      })

      return { entity: 'ORDER', id: order.id, status: order.status }
    }

    if (data.invoice?.id) {
      const invoice = await prisma.invoice.update({
        where: { id: data.invoice.id },
        data: { status: nextStatus }
      })

      return { entity: 'INVOICE', id: invoice.id, status: invoice.status }
    }

    if (data.estimate?.id) {
      const estimate = await prisma.estimate.update({
        where: { id: data.estimate.id },
        data: { status: nextStatus }
      })

      return { entity: 'ESTIMATE', id: estimate.id, status: estimate.status }
    }

    if (data.repair?.id) {
      const repair = await prisma.repair.update({
        where: { id: data.repair.id },
        data: { status: nextStatus }
      })

      return { entity: 'REPAIR', id: repair.id, status: repair.status }
    }

    return {
      skipped: true,
      reason: 'No status target found in trigger data'
    }
  }

  private async notifyAdmin(tenantId: string, parameters: any, data: any): Promise<any> {
    // Mock admin notification
    const message = this.interpolateTemplate(parameters.message, data)
    const adminUserId = await this.getPrimaryAdminId(tenantId)
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: adminUserId,
        type: 'WORKFLOW_ALERT',
        title: 'Workflow automation',
        message,
        channels: '["IN_APP"]'
      }
    })
    
    return {
      notificationId: notification.id,
      message
    }
  }

  private async createInvoice(tenantId: string, parameters: any, data: any): Promise<any> {
    // Mock invoice creation
    const company = await prisma.company.findFirst({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true
      }
    })

    const customerId = this.getNestedValue(data, 'customer.id') || this.getNestedValue(data, 'order.customerId') || this.getNestedValue(data, 'invoice.customerId') || null

    if (!company?.id || !customerId) {
      return {
        skipped: true,
        reason: 'Missing company or customer target for invoice creation'
      }
    }

    const issueDate = new Date()
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 7)

    const nextSequence = await prisma.invoice.count({
      where: { tenantId }
    })

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        companyId: company.id,
        customerId,
        number: `WF-${issueDate.getFullYear()}-${String(nextSequence + 1).padStart(4, '0')}`,
        date: issueDate,
        issueDate,
        dueDate,
        status: 'DRAFT',
        type: parameters.type || 'INVOICE',
        paymentStatus: 'UNPAID',
        paymentMethod: 'BANK_TRANSFER',
        subtotal: 0,
        taxAmount: 0,
        vatTotal: 0,
        totalAmount: 0,
        total: 0,
        discount: 0,
        discountAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
        notes: 'Documento creato automaticamente dal workflow'
      }
    })

    return {
      invoiceId: invoice.id,
      number: invoice.number
    }
  }

  private interpolateTemplate(template: string, data: any): string {
    // Simple template interpolation - in production, use more sophisticated templating
    if (!template) {
      return ''
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim())
      return value !== undefined ? String(value) : match
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Management methods
  async getRules(tenantId: string): Promise<WorkflowRule[]> {
    await this.ensureDefaultRules(tenantId)

    const templates = await prisma.template.findMany({
      where: {
        tenantId,
        type: WORKFLOW_TEMPLATE_TYPE
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })

    return templates
      .map(template => this.toRule(template))
      .sort((left, right) => {
        if (left.priority !== right.priority) {
          return left.priority - right.priority
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      })
  }

  async getRule(tenantId: string, id: string): Promise<WorkflowRule | null> {
    await this.ensureDefaultRules(tenantId)

    const template = await prisma.template.findFirst({
      where: {
        id,
        tenantId,
        type: WORKFLOW_TEMPLATE_TYPE
      }
    })

    return template ? this.toRule(template) : null
  }

  async addRule(tenantId: string, rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowRule> {
    const template = await prisma.template.create({
      data: {
        tenantId,
        name: rule.name,
        type: WORKFLOW_TEMPLATE_TYPE,
        html: JSON.stringify({
          description: rule.description,
          trigger: rule.trigger,
          actions: rule.actions,
          priority: rule.priority
        } satisfies WorkflowRulePayload),
        css: null,
        isDefault: false,
        isActive: rule.isActive
      }
    })

    return this.toRule(template)
  }

  async updateRule(tenantId: string, id: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule | null> {
    const currentRule = await prisma.template.findFirst({
      where: {
        id,
        tenantId,
        type: WORKFLOW_TEMPLATE_TYPE
      }
    })

    if (!currentRule) return null

    const currentPayload = this.parseJson<WorkflowRulePayload>(currentRule.html, {
      description: '',
      trigger: {
        type: 'INVOICE_CREATED',
        conditions: {}
      },
      actions: [],
      priority: 1
    })

    const updatedTemplate = await prisma.template.update({
      where: { id: currentRule.id },
      data: {
        name: updates.name !== undefined ? updates.name : currentRule.name,
        isActive: updates.isActive !== undefined ? updates.isActive : currentRule.isActive,
        html: JSON.stringify({
          description: updates.description !== undefined ? updates.description : currentPayload.description,
          trigger: updates.trigger !== undefined ? updates.trigger : currentPayload.trigger,
          actions: updates.actions !== undefined ? updates.actions : currentPayload.actions,
          priority: updates.priority !== undefined ? updates.priority : currentPayload.priority
        } satisfies WorkflowRulePayload)
      }
    })

    return this.toRule(updatedTemplate)
  }

  async deleteRule(tenantId: string, id: string): Promise<boolean> {
    const currentRule = await prisma.template.findFirst({
      where: {
        id,
        tenantId,
        type: WORKFLOW_TEMPLATE_TYPE
      },
      select: {
        id: true
      }
    })

    if (!currentRule) return false

    await prisma.template.delete({
      where: { id: currentRule.id }
    })

    return true
  }

  async getExecutions(tenantId: string): Promise<WorkflowExecution[]> {
    const executions = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: WORKFLOW_EXECUTION_ACTION,
        entityType: WORKFLOW_EXECUTION_ENTITY
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: WORKFLOW_EXECUTION_LIMIT
    })

    return executions.map(execution => this.toExecution(execution))
  }

  async getExecutionsByRule(tenantId: string, ruleId: string): Promise<WorkflowExecution[]> {
    const executions = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: WORKFLOW_EXECUTION_ACTION,
        entityType: WORKFLOW_EXECUTION_ENTITY,
        entityId: ruleId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: WORKFLOW_EXECUTION_LIMIT
    })

    return executions.map(execution => this.toExecution(execution))
  }
}

export const workflowEngine = new WorkflowEngine()
