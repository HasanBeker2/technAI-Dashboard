import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Clean existing data
    await prisma.timesheet.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.project.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()

    console.log('🧹 Cleaned existing data')

    // Create User
    const user = await prisma.user.create({
        data: {
            email: 'admin@technai.com',
            name: 'Dr. Alex Chen',
            image: null,
        },
    })
    console.log('👤 Created user:', user.name)

    // Create Clients
    const clients = await Promise.all([
        prisma.client.create({
            data: {
                name: 'GlobalTech Solutions',
                email: 'contact@globaltech.com',
                phone: '+49 30 123456',
                address: 'Unter den Linden 12, 10117 Berlin, Germany',
            },
        }),
        prisma.client.create({
            data: {
                name: 'E-Commerce Giant',
                email: 'partnerships@ecommercegiant.com',
                phone: '+49 89 987654',
                address: 'Maximilianstraße 45, 80538 Munich, Germany',
            },
        }),
        prisma.client.create({
            data: {
                name: 'FinTech Startup',
                email: 'hello@fintechstartup.io',
                phone: '+49 40 555666',
                address: 'Speicherstadt 23, 20457 Hamburg, Germany',
            },
        }),
        prisma.client.create({
            data: {
                name: 'Industrial Manufacturing',
                email: 'digital@industrialmfg.de',
                phone: '+49 711 444333',
                address: 'Industriepark 88, 70435 Stuttgart, Germany',
            },
        }),
        prisma.client.create({
            data: {
                name: 'Healthcare Analytics',
                email: 'tech@healthanalytics.eu',
                phone: '+49 221 777888',
                address: 'Mediapark 5, 50670 Cologne, Germany',
            },
        }),
    ])
    console.log('🏢 Created', clients.length, 'clients')

    // Create Projects
    const projects = await Promise.all([
        prisma.project.create({
            data: {
                name: 'AI-Powered Recommendation Engine',
                description: 'Building a machine learning-based recommendation system for e-commerce platform to increase customer engagement and sales conversion rates.',
                hourlyRate: new Decimal(150),
                estimatedHours: new Decimal(200),
                status: 'ACTIVE',
                clientId: clients[1].id, // E-Commerce Giant
                userId: user.id,
            },
        }),
        prisma.project.create({
            data: {
                name: 'Natural Language Processing Chatbot',
                description: 'Developing an intelligent customer service chatbot using NLP and transformer models for real-time customer support.',
                hourlyRate: new Decimal(140),
                estimatedHours: new Decimal(80),
                status: 'ACTIVE',
                clientId: clients[2].id, // FinTech Startup
                userId: user.id,
            },
        }),
        prisma.project.create({
            data: {
                name: 'Predictive Maintenance Model',
                description: 'Creating a predictive analytics model for industrial equipment maintenance scheduling to reduce downtime and costs.',
                hourlyRate: new Decimal(160),
                estimatedHours: new Decimal(150),
                status: 'ACTIVE',
                clientId: clients[3].id, // Industrial Manufacturing
                userId: user.id,
            },
        }),
        prisma.project.create({
            data: {
                name: 'Data Pipeline Optimization',
                description: 'Optimizing ETL pipelines for faster data processing and real-time analytics capabilities.',
                hourlyRate: new Decimal(130),
                estimatedHours: new Decimal(60),
                status: 'COMPLETED',
                clientId: clients[4].id, // Healthcare Analytics
                userId: user.id,
            },
        }),
        prisma.project.create({
            data: {
                name: 'Cloud Migration Strategy',
                description: 'Planning and executing migration of on-premise infrastructure to AWS cloud environment.',
                hourlyRate: new Decimal(145),
                estimatedHours: new Decimal(120),
                status: 'ON_HOLD',
                clientId: clients[0].id, // GlobalTech Solutions
                userId: user.id,
            },
        }),
    ])
    console.log('📁 Created', projects.length, 'projects')

    // Create Timesheets (last 30 days)
    const timesheetEntries = []
    const descriptions = [
        'Data analysis and model training',
        'Feature engineering and optimization',
        'Code review and documentation',
        'Client meeting and progress review',
        'API development and integration',
        'Testing and debugging',
        'Architecture design session',
        'Performance optimization',
        'Research and prototyping',
        'Deployment and monitoring setup',
    ]

    for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue

        // Random entries for each day (1-3 entries)
        const numEntries = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numEntries; j++) {
            const project = projects[Math.floor(Math.random() * 3)] // Only active projects
            const hours = [1, 2, 3, 4, 5, 6, 7, 8][Math.floor(Math.random() * 8)]

            timesheetEntries.push({
                projectId: project.id,
                date: date,
                hours: new Decimal(hours),
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
            })
        }
    }

    await prisma.timesheet.createMany({
        data: timesheetEntries,
    })
    console.log('⏱️ Created', timesheetEntries.length, 'timesheet entries')

    // Create Invoices
    const currentYear = new Date().getFullYear()
    const invoices = await Promise.all([
        // Paid invoices
        prisma.invoice.create({
            data: {
                invoiceNumber: `${currentYear}-0115`,
                status: 'PAID',
                issueDate: new Date(currentYear, 7, 15), // Aug 15
                dueDate: new Date(currentYear, 8, 14), // Sep 14
                clientId: clients[4].id,
                projectId: projects[3].id,
                items: [
                    { description: 'Data Pipeline Optimization - Phase 1', quantity: 30, rate: 130, amount: 3900 },
                    { description: 'Consulting and Documentation', quantity: 20, rate: 130, amount: 2600 },
                ],
                subtotal: new Decimal(6300),
                vatRate: new Decimal(19),
                vatAmount: new Decimal(1197),
                total: new Decimal(7497),
                notes: 'Thank you for your business!',
            },
        }),
        prisma.invoice.create({
            data: {
                invoiceNumber: `${currentYear}-0120`,
                status: 'PAID',
                issueDate: new Date(currentYear, 8, 1), // Sep 1
                dueDate: new Date(currentYear, 8, 30), // Sep 30
                clientId: clients[3].id,
                projectId: projects[2].id,
                items: [
                    { description: 'Predictive Maintenance Model - Development', quantity: 50, rate: 160, amount: 8000 },
                    { description: 'Model Training and Validation', quantity: 12.5, rate: 160, amount: 2000 },
                ],
                subtotal: new Decimal(10000),
                vatRate: new Decimal(19),
                vatAmount: new Decimal(1900),
                total: new Decimal(11900),
            },
        }),
        // Sent invoice
        prisma.invoice.create({
            data: {
                invoiceNumber: `${currentYear}-0124`,
                status: 'SENT',
                issueDate: new Date(currentYear, 9, 1), // Oct 1
                dueDate: new Date(currentYear, 9, 25), // Oct 25
                clientId: clients[0].id,
                projectId: projects[4].id,
                items: [
                    { description: 'Cloud Migration - Planning Phase', quantity: 40, rate: 145, amount: 5800 },
                    { description: 'Infrastructure Assessment', quantity: 30, rate: 145, amount: 4350 },
                    { description: 'Documentation', quantity: 16.21, rate: 145, amount: 2350.45 },
                ],
                subtotal: new Decimal(10504.20),
                vatRate: new Decimal(19),
                vatAmount: new Decimal(1995.80),
                total: new Decimal(12500),
            },
        }),
        // Overdue invoice
        prisma.invoice.create({
            data: {
                invoiceNumber: `${currentYear}-0125`,
                status: 'OVERDUE',
                issueDate: new Date(currentYear, 8, 15), // Sep 15
                dueDate: new Date(currentYear, 9, 15), // Oct 15 (past)
                clientId: clients[0].id,
                items: [
                    { description: 'Consulting Services - September', quantity: 60, rate: 145, amount: 8700 },
                    { description: 'Support Hours', quantity: 12.43, rate: 145, amount: 1802.35 },
                ],
                subtotal: new Decimal(10502.35),
                vatRate: new Decimal(19),
                vatAmount: new Decimal(1995.45),
                total: new Decimal(12497.80),
            },
        }),
        // Draft invoice
        prisma.invoice.create({
            data: {
                invoiceNumber: `${currentYear}-0128`,
                status: 'DRAFT',
                issueDate: new Date(currentYear, 10, 1), // Nov 1
                dueDate: new Date(currentYear, 10, 30), // Nov 30
                clientId: clients[2].id,
                projectId: projects[1].id,
                items: [
                    { description: 'NLP Chatbot - Development Phase 2', quantity: 45, rate: 140, amount: 6300 },
                    { description: 'Integration Testing', quantity: 30, rate: 140, amount: 4200 },
                ],
                subtotal: new Decimal(10500),
                vatRate: new Decimal(19),
                vatAmount: new Decimal(1995),
                total: new Decimal(12495),
                notes: 'Draft - awaiting approval',
            },
        }),
    ])
    console.log('📄 Created', invoices.length, 'invoices')

    // Create Expenses
    const expenses = await Promise.all([
        prisma.expense.create({
            data: {
                category: 'SOFTWARE',
                description: 'GitHub Enterprise License',
                amount: new Decimal(450),
                vatAmount: new Decimal(85.50),
                date: new Date(currentYear, 11, 1),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'HARDWARE',
                description: 'MacBook Pro M3 Max',
                amount: new Decimal(3499),
                vatAmount: new Decimal(664.81),
                date: new Date(currentYear, 10, 28),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'SOFTWARE',
                description: 'OpenAI API Credits',
                amount: new Decimal(500),
                vatAmount: new Decimal(95),
                date: new Date(currentYear, 10, 25),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'OFFICE',
                description: 'CoWorking Space Membership',
                amount: new Decimal(350),
                vatAmount: new Decimal(66.50),
                date: new Date(currentYear, 10, 20),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'TRAVEL',
                description: 'Client Meeting - Berlin (Train + Hotel)',
                amount: new Decimal(280),
                vatAmount: new Decimal(53.20),
                date: new Date(currentYear, 10, 15),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'PROFESSIONAL_SERVICES',
                description: 'Tax Consulting Q4',
                amount: new Decimal(800),
                vatAmount: new Decimal(152),
                date: new Date(currentYear, 10, 10),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'SOFTWARE',
                description: 'Figma Team License',
                amount: new Decimal(180),
                vatAmount: new Decimal(34.20),
                date: new Date(currentYear, 10, 5),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'UTILITIES',
                description: 'AWS Cloud Services',
                amount: new Decimal(450),
                vatAmount: new Decimal(85.50),
                date: new Date(currentYear, 10, 1),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'MARKETING',
                description: 'LinkedIn Premium Business',
                amount: new Decimal(59.99),
                vatAmount: new Decimal(11.40),
                date: new Date(currentYear, 9, 28),
            },
        }),
        prisma.expense.create({
            data: {
                category: 'HARDWARE',
                description: 'External Monitor 4K',
                amount: new Decimal(599),
                vatAmount: new Decimal(113.81),
                date: new Date(currentYear, 9, 20),
            },
        }),
    ])
    console.log('💸 Created', expenses.length, 'expenses')

    console.log('✅ Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
