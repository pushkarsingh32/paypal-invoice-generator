#!/usr/bin/env node

const InvoiceManager = require('./src/invoiceManager');
const CustomerTemplates = require('./src/customerTemplates');
const chalk = require('chalk');

async function createMuzalexInvoice() {
    console.log(chalk.bold.blue('\n🧾 Creating Muzalex Guest Post Invoice'));
    console.log(chalk.blue('==========================================\n'));
    
    const manager = new InvoiceManager();
    
    // Create invoice data for Muzalex customer
    const invoiceData = CustomerTemplates.createMuzalexGuestPostInvoice(
        'https://techgeekers.com/wow-mop-classic-gold-tech-driven-gold-optimization/',
        'WoW MoP Classic Gold: Tech-Driven Gold Optimization'
    );
    
    // Preview the invoice
    console.log(chalk.blue('👁️ Invoice Preview:'));
    const previewResult = await manager.previewInvoice(invoiceData);
    
    if (!previewResult.success) {
        console.error(chalk.red('Failed to generate preview:', previewResult.error));
        process.exit(1);
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
    console.log(`   Customer: muzalex98@gmail.com`);
    console.log(`   ID: ${createResult.invoiceId}`);
    console.log(`   Number: ${createResult.invoiceNumber}`);
    console.log(`   Amount: ${createResult.currency} ${createResult.totalAmount}`);
    console.log(`   Status: ${createResult.status}`);
    console.log(`   View: ${createResult.invoicerViewUrl}`);
    
    // Send the invoice
    console.log(chalk.blue('\n📧 Sending invoice to customer and copy to invoicer...'));
    
    const sendResult = await manager.sendInvoice(createResult.invoiceId, {
        subject: 'Invoice for Guest Post Publication Service - WoW MoP Classic Gold',
        note: `Dear Customer,\n\nThank you for choosing our guest post publication service. Your article "WoW MoP Classic Gold: Tech-Driven Gold Optimization" has been successfully published on techgeekers.com.\n\nArticle URL: https://techgeekers.com/wow-mop-classic-gold-tech-driven-gold-optimization/\n\nPayment is due within 3 days as per our terms.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nTG Media. Tech Geekers`,
        sendToRecipient: true,
        sendToInvoicer: true
    });
    
    if (sendResult.success) {
        console.log(chalk.green('\n🎉 SUCCESS! Invoice sent successfully!'));
        console.log(chalk.yellow('📧 Customer (muzalex98@gmail.com) will receive email notification with payment instructions.'));
        console.log(chalk.yellow('📧 Copy also sent to invoicer email.'));
        console.log(chalk.blue(`\n💰 Invoice Amount: $40 USD`));
        console.log(chalk.blue(`🔗 Article: https://techgeekers.com/wow-mop-classic-gold-tech-driven-gold-optimization/`));
    } else {
        console.error(chalk.red('\n❌ Invoice created but failed to send:', sendResult.error));
        console.log(chalk.blue(`💡 You can manually send it later using: node send_invoice.js ${createResult.invoiceId}`));
    }
}

createMuzalexInvoice().catch(error => {
    console.error(chalk.red('❌ Error:', error.message));
    process.exit(1);
});