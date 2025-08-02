#!/usr/bin/env node

/**
 * PayPal Invoice Generator - Main Application
 * 
 * Interactive CLI application for creating, managing, and sending PayPal invoices
 * Designed specifically for digital marketing services (guest posts, link insertions)
 * 
 * Features:
 * - Quick invoice creation with templates
 * - Custom invoice builder with full options
 * - Real-time invoice preview
 * - Automatic email sending via PayPal
 * - Invoice list management
 * - Production and sandbox environment support
 * 
 * Usage: node index.js
 * Requires: .env file with PayPal credentials and business information
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const InvoiceManager = require('./src/invoiceManager');
const CustomerTemplates = require('./src/customerTemplates');
require('dotenv').config();

/**
 * Main Invoice Application Class
 * 
 * Handles user interface, menu navigation, and coordinates between
 * invoice management, templates, and user input processing
 */
class InvoiceApp {
    /**
     * Initialize application with invoice manager
     */
    constructor() {
        this.invoiceManager = new InvoiceManager();
    }

    /**
     * Start the main application loop
     * 
     * Displays welcome screen, environment info, and main menu
     * Continues until user chooses to exit
     */
    async start() {
        // Display welcome screen and environment info
        console.log(chalk.bold.blue('\n🧾 PayPal Invoice Generator'));
        console.log(chalk.blue('================================\n'));
        console.log(chalk.green(`Environment: ${process.env.PAYPAL_ENVIRONMENT || 'SANDBOX'}`));
        console.log(chalk.green(`Business: ${process.env.BUSINESS_NAME || 'Not configured'}\n`));

        // Main application loop
        while (true) {
            const action = await this.showMainMenu();
            
            // Route to appropriate handler based on user selection
            switch (action) {
                case 'create_quick':
                    await this.createQuickInvoice();
                    break;
                case 'create_custom':
                    await this.createCustomInvoice();
                    break;
                case 'sencha_test':
                    await this.createSenchaTestInvoice();
                    break;
                case 'preview':
                    await this.previewInvoice();
                    break;
                case 'list':
                    await this.listInvoices();
                    break;
                case 'send':
                    await this.sendExistingInvoice();
                    break;
                case 'exit':
                    console.log(chalk.green('\n👋 Goodbye!'));
                    process.exit(0);
                    break;
            }
        }
    }

    /**
     * Display main menu and get user selection
     * 
     * @returns {string} Selected menu action
     */
    async showMainMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🚀 Create Quick Guest Post Invoice', value: 'create_quick' },
                    { name: '⚙️  Create Custom Invoice', value: 'create_custom' },
                    { name: '🧪 Test Sencha Invoice (Live)', value: 'sencha_test' },
                    { name: '👁️  Preview Invoice', value: 'preview' },
                    { name: '📋 List Recent Invoices', value: 'list' },
                    { name: '📧 Send Existing Invoice', value: 'send' },
                    { name: '🚪 Exit', value: 'exit' }
                ]
            }
        ]);
        return action;
    }

    /**
     * Quick invoice creation workflow
     * 
     * Simplified interface for common guest post invoices
     * Collects minimal required information and uses templates
     */
    async createQuickInvoice() {
        console.log(chalk.yellow('\n📝 Quick Guest Post Invoice'));
        
        // Collect essential invoice information
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Customer email:',
                validate: input => input.includes('@') || 'Please enter a valid email'
            },
            {
                type: 'input',
                name: 'companyName',
                message: 'Company/Client name:',
                validate: input => input.trim().length > 0 || 'Company name is required'
            },
            {
                type: 'number',
                name: 'price',
                message: 'Price (USD):',
                validate: input => input > 0 || 'Price must be greater than 0'
            },
            {
                type: 'input',
                name: 'url',
                message: 'Published article URL (optional):',
            },
            {
                type: 'input',
                name: 'title',
                message: 'Article title (optional):',
            },
            {
                type: 'confirm',
                name: 'sendNow',
                message: 'Send invoice immediately?',
                default: true
            }
        ]);

        // Generate invoice data using quick template
        const invoiceData = CustomerTemplates.quickGuestPost(
            answers.email,
            answers.companyName,
            answers.price,
            answers.url,
            answers.title
        );

        await this.processInvoice(invoiceData, answers.sendNow);
    }

    /**
     * Sencha customer test invoice workflow
     * 
     * Pre-configured invoice for Sencha customer with safety confirmations
     * Used for testing and as example of customer-specific templates
     * WARNING: Creates real invoices in production environment
     */
    async createSenchaTestInvoice() {
        console.log(chalk.yellow('\n🧪 Creating Sencha Test Invoice (LIVE ENVIRONMENT)'));
        console.log(chalk.red('⚠️  This will create a REAL invoice that will be sent to the customer!'));
        
        // Safety confirmation for live invoice creation
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to create a LIVE invoice for Sencha?',
                default: false
            }
        ]);

        if (!confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
        }

        const { price } = await inquirer.prompt([
            {
                type: 'number',
                name: 'price',
                message: 'Invoice amount (USD):',
                default: 30,
                validate: input => input > 0 || 'Price must be greater than 0'
            }
        ]);

        const { sendNow } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'sendNow',
                message: 'Send invoice to raj.vuyyuru@idera.com immediately?',
                default: true
            }
        ]);

        // Generate Sencha-specific invoice with provided price
        const invoiceData = CustomerTemplates.createSenchaInvoice(price);
        
        // Display invoice summary for final review
        console.log(chalk.blue('\n📋 Invoice Details:'));
        console.log(`Customer: ${invoiceData.customer.businessName}`);
        console.log(`Email: ${invoiceData.customer.email}`);
        console.log(`Amount: $${price} USD`);
        console.log(`Service: Guest Post Publication`);
        console.log(`Article Title: ${invoiceData.items[0].description.split('\n')[1]?.replace('Article Title: ', '') || 'Not specified'}`);

        await this.processInvoice(invoiceData, sendNow);
    }

    /**
     * Custom invoice creation workflow
     * 
     * Full-featured invoice builder with all customer and service options
     * Allows complete customization of invoice details
     */
    async createCustomInvoice() {
        console.log(chalk.yellow('\n⚙️ Custom Invoice Creation'));
        
        // Collect detailed customer information
        const customerInfo = await inquirer.prompt([
            { type: 'input', name: 'firstName', message: 'Customer first name:' },
            { type: 'input', name: 'lastName', message: 'Customer last name:' },
            { type: 'input', name: 'email', message: 'Customer email:', validate: input => input.includes('@') },
            { type: 'input', name: 'businessName', message: 'Business name (optional):' },
            { type: 'input', name: 'addressLine1', message: 'Address line 1 (optional):' },
            { type: 'input', name: 'city', message: 'City (optional):' },
            { type: 'input', name: 'state', message: 'State (optional):' },
            { type: 'input', name: 'postalCode', message: 'Postal code (optional):' }
        ]);

        // Collect service and pricing details
        const serviceInfo = await inquirer.prompt([
            { type: 'input', name: 'serviceName', message: 'Service name:', default: 'Guest Post Publication' },
            { type: 'input', name: 'description', message: 'Service description:' },
            { type: 'number', name: 'price', message: 'Price (USD):', validate: input => input > 0 },
            { type: 'input', name: 'url', message: 'Article/Service URL (optional):' }
        ]);

        const { sendNow } = await inquirer.prompt([
            { type: 'confirm', name: 'sendNow', message: 'Send invoice immediately?', default: true }
        ]);

        // Build invoice data from collected information
        const invoiceData = CustomerTemplates.createGuestPostInvoice(
            {
                ...customerInfo,
                // Build address object if address info provided
                address: customerInfo.addressLine1 ? {
                    line1: customerInfo.addressLine1,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    postalCode: customerInfo.postalCode,
                    countryCode: 'US'
                } : null
            },
            serviceInfo
        );

        await this.processInvoice(invoiceData, sendNow);
    }

    /**
     * Process invoice creation with preview and confirmation
     * 
     * Shows preview, gets user confirmation, creates invoice, and optionally sends
     * Handles both create-only and create-and-send workflows
     * 
     * @param {Object} invoiceData - Complete invoice data structure
     * @param {boolean} [sendNow=false] - Whether to send immediately after creation
     */
    async processInvoice(invoiceData, sendNow = false) {
        try {
            // Step 1: Show formatted invoice preview
            console.log(chalk.blue('\n👁️ Invoice Preview:'));
            const previewResult = await this.invoiceManager.previewInvoice(invoiceData);
            
            if (!previewResult.success) {
                console.error(chalk.red('Failed to generate preview:', previewResult.error));
                return;
            }

            const { proceed } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Proceed with creating this invoice?',
                    default: true
                }
            ]);

            if (!proceed) {
                console.log(chalk.yellow('Invoice creation cancelled.'));
                return;
            }

            if (sendNow) {
                // Workflow: Create and send immediately
                const result = await this.invoiceManager.createAndSendInvoice(invoiceData);
                
                if (result.success) {
                    console.log(chalk.green('\n✅ Invoice created and sent successfully!'));
                    console.log(chalk.blue(`📋 Invoice ID: ${result.invoiceId}`));
                    console.log(chalk.blue(`🔢 Invoice Number: ${result.invoiceNumber}`));
                    console.log(chalk.blue(`💰 Amount: ${result.currency} ${result.totalAmount}`));
                    console.log(chalk.blue(`🔗 View Invoice: ${result.invoicerViewUrl}`));
                    
                    if (result.sent) {
                        console.log(chalk.green('📧 Email sent to customer successfully!'));
                    } else {
                        console.log(chalk.yellow('⚠️ Invoice created but email failed to send.'));
                    }
                } else {
                    console.error(chalk.red('❌ Failed to create/send invoice:', result.error));
                }
            } else {
                // Workflow: Create only, don't send
                const result = await this.invoiceManager.createInvoice(invoiceData);
                
                if (result.success) {
                    console.log(chalk.green('\n✅ Invoice created successfully!'));
                    console.log(chalk.blue(`📋 Invoice ID: ${result.invoiceId}`));
                    console.log(chalk.blue(`🔢 Invoice Number: ${result.invoiceNumber}`));
                    console.log(chalk.blue(`💰 Amount: ${result.currency} ${result.totalAmount}`));
                    console.log(chalk.blue(`🔗 View Invoice: ${result.invoicerViewUrl}`));
                    console.log(chalk.yellow('📧 Note: Invoice has NOT been sent to customer yet.'));
                } else {
                    console.error(chalk.red('❌ Failed to create invoice:', result.error));
                }
            }
        } catch (error) {
            console.error(chalk.red('❌ Error processing invoice:', error.message));
        }
    }

    /**
     * Standalone invoice preview workflow
     * 
     * Allows users to preview invoices without creating them
     * Useful for testing formatting and layout
     */
    async previewInvoice() {
        const { email, companyName, price, url } = await inquirer.prompt([
            { type: 'input', name: 'email', message: 'Customer email:' },
            { type: 'input', name: 'companyName', message: 'Company name:' },
            { type: 'number', name: 'price', message: 'Price (USD):' },
            { type: 'input', name: 'url', message: 'Article URL (optional):' }
        ]);

        // Generate preview using quick template
        const invoiceData = CustomerTemplates.quickGuestPost(email, companyName, price, url);
        await this.invoiceManager.previewInvoice(invoiceData);
    }

    /**
     * Display list of recent invoices
     * 
     * Fetches and displays invoices in formatted table
     * Shows key information for invoice management
     */
    async listInvoices() {
        console.log(chalk.blue('\n📋 Fetching recent invoices...'));
        
        // Fetch recent invoices with pagination
        const result = await this.invoiceManager.listInvoices({ pageSize: 10, totalRequired: true });
        
        if (result.success) {
            console.log(chalk.green(`\n✅ Found ${result.totalItems} total invoices`));
            
            if (result.invoices.length === 0) {
                console.log(chalk.yellow('No invoices found.'));
                return;
            }

            // Create formatted table for invoice display
            const Table = require('cli-table3');
            const table = new Table({
                head: ['ID', 'Number', 'Status', 'Amount', 'Customer', 'Date'],
                colWidths: [25, 15, 12, 12, 25, 12]
            });

            // Populate table with invoice data
            result.invoices.forEach(invoice => {
                table.push([
                    invoice.id,
                    invoice.detail?.invoice_number || 'N/A',
                    invoice.status || 'N/A',
                    `${invoice.amount?.currency_code || 'USD'} ${invoice.amount?.value || '0'}`,
                    invoice.primary_recipients?.[0]?.billing_info?.email_address || 'N/A',
                    invoice.detail?.invoice_date || 'N/A'
                ]);
            });

            console.log(table.toString());
        } else {
            console.error(chalk.red('❌ Failed to fetch invoices:', result.error));
        }
    }

    /**
     * Send an existing invoice by ID
     * 
     * Allows sending of previously created invoices
     * Useful for invoices created without immediate sending
     */
    async sendExistingInvoice() {
        const { invoiceId } = await inquirer.prompt([
            {
                type: 'input',
                name: 'invoiceId',
                message: 'Enter invoice ID to send:',
                validate: input => input.trim().length > 0 || 'Invoice ID is required'
            }
        ]);

        const result = await this.invoiceManager.sendInvoice(invoiceId);
        
        if (result.success) {
            console.log(chalk.green('✅ Invoice sent successfully!'));
        } else {
            console.error(chalk.red('❌ Failed to send invoice:', result.error));
        }
    }
}

// Application entry point
// Only run if this file is executed directly (not imported as module)
if (require.main === module) {
    const app = new InvoiceApp();
    app.start().catch(error => {
        console.error(chalk.red('❌ Application error:', error.message));
        process.exit(1);
    });
}

module.exports = InvoiceApp;