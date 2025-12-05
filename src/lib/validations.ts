import { z } from 'zod'

// ==================== Client Schemas ====================
export const createClientSchema = z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// ==================== Project Schemas ====================
export const projectStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED'])

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    hourlyRate: z.number().positive('Hourly rate must be positive'),
    estimatedHours: z.number().positive().optional(),
    clientId: z.string().min(1, 'Client is required'),
    userId: z.string().min(1, 'User is required'),
    status: projectStatusSchema.optional().default('ACTIVE'),
})

export const updateProjectSchema = createProjectSchema.partial().omit({ userId: true })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ==================== Timesheet Schemas ====================
export const createTimesheetSchema = z.object({
    projectId: z.string().min(1, 'Project is required'),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    hours: z.number().positive('Hours must be positive').max(24, 'Hours cannot exceed 24'),
    description: z.string().optional(),
})

export const updateTimesheetSchema = createTimesheetSchema.partial()

export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>

// ==================== Invoice Schemas ====================
export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])

export const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().nonnegative('Rate must be non-negative'),
    amount: z.number().nonnegative('Amount must be non-negative'),
})

export const createInvoiceSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    projectId: z.string().optional(),
    issueDate: z.string().or(z.date()).transform((val) => new Date(val)),
    dueDate: z.string().or(z.date()).transform((val) => new Date(val)),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
    vatRate: z.number().min(0).max(100).optional().default(19),
    notes: z.string().optional(),
    status: invoiceStatusSchema.optional().default('DRAFT'),
    servicePeriodStart: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    servicePeriodEnd: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
}).refine(
    (data) => {
        // If one service period field is provided, both must be provided
        if (data.servicePeriodStart || data.servicePeriodEnd) {
            return !!data.servicePeriodStart && !!data.servicePeriodEnd
        }
        return true
    },
    { message: 'Both service period start and end dates must be provided' }
).refine(
    (data) => {
        // Service period end must be >= start
        if (data.servicePeriodStart && data.servicePeriodEnd) {
            return data.servicePeriodEnd >= data.servicePeriodStart
        }
        return true
    },
    { message: 'Service period end date must be after or equal to start date' }
)

export const updateInvoiceSchema = z.object({
    clientId: z.string().optional(),
    projectId: z.string().optional().nullable(),
    issueDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    dueDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    items: z.array(invoiceItemSchema).optional(),
    vatRate: z.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
    status: invoiceStatusSchema.optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceItem = z.infer<typeof invoiceItemSchema>

// ==================== Expense Schemas ====================
export const expenseCategorySchema = z.enum([
    'SOFTWARE',
    'HARDWARE',
    'OFFICE',
    'TRAVEL',
    'MARKETING',
    'UTILITIES',
    'PROFESSIONAL_SERVICES',
    'OTHER',
])

export const createExpenseSchema = z.object({
    category: expenseCategorySchema,
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    vatAmount: z.number().nonnegative().optional(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    receiptUrl: z.string().url().optional().or(z.literal('')),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>

// ==================== Query Schemas ====================
export const dateRangeSchema = z.object({
    startDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
    endDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
})

export const paginationSchema = z.object({
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
})

export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
