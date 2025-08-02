const InvoiceManager = require('./src/invoiceManager');
const chalk = require('chalk');

async function sendInvoice() {
    const invoiceId = process.argv[2];
    
    if (!invoiceId) {
        console.error(chalk.red('❌ Please provide an invoice ID'));
        console.log(chalk.blue('Usage: node send_invoice.js INV2-XXXX-XXXX-XXXX-XXXX'));
        process.exit(1);
    }
    
    console.log(chalk.blue(`📧 Sending invoice ${invoiceId} to customer...`));
    
    const manager = new InvoiceManager();
    
    try {
        const result = await manager.sendInvoice(invoiceId, {
            subject: 'Invoice for Guest Post Publication Service',
            note: 'Dear Customer,\n\nThank you for choosing our guest post publication service. Please find your invoice attached.\n\nThe article has been successfully published and is now live. Payment is due within 3 days as per our terms.\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nTG Media. Tech Geekers',
            sendToRecipient: true,
            sendToInvoicer: false
        });
        
        if (result.success) {
            console.log(chalk.green('✅ Invoice sent successfully!'));
            console.log(chalk.yellow('📧 Customer will receive an email notification with payment instructions.'));
        } else {
            console.error(chalk.red('❌ Failed to send invoice:', result.error));
        }
    } catch (error) {
        console.error(chalk.red('❌ Error:', error.message));
    }
}

sendInvoice();