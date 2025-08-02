#!/usr/bin/env node

const InvoiceManager = require('./src/invoiceManager');
const CustomerTemplates = require('./src/customerTemplates');
const chalk = require('chalk');
const inquirer = require('inquirer');

async function createAndSendInvoice() {
    console.log(chalk.bold.blue('\n🧾 PayPal Invoice Creator & Sender'));
    console.log(chalk.blue('===================================\n'));
    
    const manager = new InvoiceManager();
    
    // Ask what type of invoice to create
    const { invoiceType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'invoiceType',
            message: 'What type of invoice do you want to create?',
            choices: [
                { name: '🎯 Sencha Customer (Test)', value: 'sencha' },
                { name: '⚡ Quick Guest Post', value: 'quick' },
                { name: '⚙️ Custom Invoice', value: 'custom' }
            ]
        }
    ]);
    
    let invoiceData;
    
    if (invoiceType === 'sencha') {
        const { price, confirm } = await inquirer.prompt([
            {
                type: 'number',
                name: 'price',
                message: 'Invoice amount (USD):',
                default: 30
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: 'This will create a REAL invoice for Sencha. Continue?',
                default: false
            }
        ]);
        
        if (!confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            process.exit(0);
        }
        
        invoiceData = CustomerTemplates.createSenchaInvoice(price);
        
    } else if (invoiceType === 'quick') {
        const answers = await inquirer.prompt([
            { type: 'input', name: 'email', message: 'Customer email:', validate: input => input.includes('@') },
            { type: 'input', name: 'company', message: 'Company name:' },
            { type: 'number', name: 'price', message: 'Price (USD):', default: 30 },
            { type: 'input', name: 'title', message: 'Article title (optional):' }
        ]);
        
        invoiceData = CustomerTemplates.quickGuestPost(answers.email, answers.company, answers.price, '', answers.title);
        
    } else {
        console.log(chalk.yellow('Custom invoice creation - use the main CLI app: npm start'));
        process.exit(0);
    }
    
    // Preview the invoice
    console.log(chalk.blue('\n👁️ Invoice Preview:'));
    const previewResult = await manager.previewInvoice(invoiceData);
    
    if (!previewResult.success) {
        console.error(chalk.red('Failed to generate preview:', previewResult.error));
        process.exit(1);
    }
    
    // Ask what to do
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '🚀 Create and Send Immediately', value: 'send' },
                { name: '📄 Create Draft Only', value: 'draft' },
                { name: '❌ Cancel', value: 'cancel' }
            ]
        }
    ]);
    
    if (action === 'cancel') {
        console.log(chalk.yellow('Operation cancelled.'));
        process.exit(0);
    }
    
    // Create the invoice
    console.log(chalk.blue('\n📄 Creating invoice...'));
    const createResult = await manager.createInvoice(invoiceData);
    
    if (!createResult.success) {
        console.error(chalk.red('❌ Failed to create invoice:', createResult.error));
        process.exit(1);
    }
    
    console.log(chalk.green('\n✅ Invoice created successfully!'));
    console.log(chalk.yellow('📋 Invoice Details:'));
    console.log(`   ID: ${createResult.invoiceId}`);
    console.log(`   Number: ${createResult.invoiceNumber}`);
    console.log(`   Amount: ${createResult.currency} ${createResult.totalAmount}`);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   View: ${createResult.invoicerViewUrl}`);
    
    if (action === 'send') {
        console.log(chalk.blue('\n📧 Sending invoice to customer...'));
        
        const sendResult = await manager.sendInvoice(createResult.invoiceId, {
            subject: 'Invoice for Guest Post Publication Service',
            note: `Dear Customer,\n\nThank you for choosing our guest post publication service. Please find your invoice attached.\n\nPayment is due within 3 days as per our terms.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nTG Media. Tech Geekers`,
            sendToRecipient: true,
            sendToInvoicer: false
        });
        
        if (sendResult.success) {
            console.log(chalk.green('\n🎉 SUCCESS! Invoice sent to customer!'));
            console.log(chalk.yellow('📧 Customer will receive email notification with payment instructions.'));
        } else {
            console.error(chalk.red('\n❌ Invoice created but failed to send:', sendResult.error));
            console.log(chalk.blue(`💡 You can manually send it later using: node send_invoice.js ${createResult.invoiceId}`));
        }
    } else {
        console.log(chalk.blue('\n💡 Invoice created as draft.'));
        console.log(chalk.blue(`To send later, use: node send_invoice.js ${createResult.invoiceId}`));
    }
}

createAndSendInvoice().catch(error => {
    console.error(chalk.red('❌ Error:', error.message));
    process.exit(1);
});