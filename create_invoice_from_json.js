#!/usr/bin/env node

const InvoiceManager = require('./src/invoiceManager');
const CustomerTemplates = require('./src/customerTemplates');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Create and send invoice from JSON data
 * 
 * Usage:
 * 1. Pass JSON as command line argument: node create_invoice_from_json.js '{"customer":{"email":"test@test.com",...}}'
 * 2. Pass JSON file path: node create_invoice_from_json.js ./invoice_data.json
 * 3. Use predefined templates: node create_invoice_from_json.js --muzalex-guest-post --price 40 --url "..." --title "..."
 */

async function createInvoiceFromJSON() {
    console.log(chalk.bold.blue('\n🧾 JSON-Based PayPal Invoice Creator'));
    console.log(chalk.blue('=====================================\n'));
    
    const args = process.argv.slice(2);
    let invoiceData;
    
    if (args.length === 0) {
        console.log(chalk.red('❌ No arguments provided!'));
        showUsage();
        process.exit(1);
    }
    
    const manager = new InvoiceManager();
    
    try {
        // Handle predefined templates
        if (args[0] === '--muzalex-guest-post') {
            invoiceData = handleMuzalexGuestPost(args);
        } else if (args[0] === '--muzalex-link-insertion') {
            invoiceData = handleMuzalexLinkInsertion(args);
        } else if (args[0].startsWith('{')) {
            // Handle JSON string
            const jsonData = JSON.parse(args[0]);
            invoiceData = parseInvoiceData(jsonData);
        } else {
            // Handle JSON file
            const filePath = path.resolve(args[0]);
            if (!fs.existsSync(filePath)) {
                console.log(chalk.red(`❌ File not found: ${filePath}`));
                process.exit(1);
            }
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            invoiceData = parseInvoiceData(jsonData);
        }
        
        console.log(chalk.green('✅ Invoice data prepared successfully!'));
        
        // Preview the invoice
        console.log(chalk.blue('\n👁️ Invoice Preview:'));
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
        console.log(`   Customer: ${invoiceData.customer.email}`);
        console.log(`   ID: ${createResult.invoiceId}`);
        console.log(`   Number: ${createResult.invoiceNumber}`);
        console.log(`   Amount: ${createResult.currency} ${createResult.totalAmount}`);
        console.log(`   View: ${createResult.invoicerViewUrl}`);
        
        // Send the invoice
        console.log(chalk.blue('\n📧 Sending invoice...'));
        
        const sendResult = await manager.sendInvoice(createResult.invoiceId, {
            subject: `Invoice for ${invoiceData.items[0].name}`,
            note: `Dear Customer,\n\nThank you for choosing our services. Please find your invoice attached.\n\nPayment is due within 3 days as per our terms.\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nTG Media. Tech Geekers`,
            sendToRecipient: true,
            sendToInvoicer: true
        });
        
        if (sendResult.success) {
            console.log(chalk.green('\n🎉 SUCCESS! Invoice sent successfully!'));
            console.log(chalk.yellow(`📧 Customer (${invoiceData.customer.email}) will receive email notification.`));
            console.log(chalk.yellow('📧 Copy also sent to invoicer email.'));
        } else {
            console.error(chalk.red('\n❌ Invoice created but failed to send:', sendResult.error));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Error:', error.message));
        process.exit(1);
    }
}

function parseInvoiceData(jsonData) {
    // Check if it's a Muzalex-specific format (services array without customer)
    if (jsonData.services && !jsonData.customer) {
        console.log(chalk.yellow('Detected Muzalex bulk services format'));
        return CustomerTemplates.createMuzalexFromJSON(jsonData);
    }
    // Check if it's multi-item format with customer
    else if (jsonData.services && jsonData.customer) {
        console.log(chalk.yellow('Detected multi-item format with custom customer'));
        return CustomerTemplates.createMultiItemFromJSON(jsonData);
    }
    // Check if it's single service format
    else if (jsonData.service && jsonData.customer) {
        console.log(chalk.yellow('Detected single service format'));
        return CustomerTemplates.createFromJSON(jsonData);
    }
    else {
        throw new Error('Invalid JSON format. Must have either "service" or "services" field.');
    }
}

function handleMuzalexGuestPost(args) {
    let price = 40;
    let url = '';
    let title = '';
    
    for (let i = 1; i < args.length; i += 2) {
        if (args[i] === '--price') price = parseFloat(args[i + 1]);
        if (args[i] === '--url') url = args[i + 1];
        if (args[i] === '--title') title = args[i + 1];
    }
    
    console.log(chalk.yellow(`Creating Muzalex Guest Post invoice: $${price}`));
    if (url) console.log(chalk.blue(`URL: ${url}`));
    if (title) console.log(chalk.blue(`Title: ${title}`));
    
    return CustomerTemplates.createMuzalexFromJSON({
        type: 'guest_post',
        price: price,
        url: url,
        title: title
    });
}

function handleMuzalexLinkInsertion(args) {
    let price = 20;
    let url = '';
    let anchorText = '';
    
    for (let i = 1; i < args.length; i += 2) {
        if (args[i] === '--price') price = parseFloat(args[i + 1]);
        if (args[i] === '--url') url = args[i + 1];
        if (args[i] === '--anchor') anchorText = args[i + 1];
    }
    
    console.log(chalk.yellow(`Creating Muzalex Link Insertion invoice: $${price}`));
    if (url) console.log(chalk.blue(`Target URL: ${url}`));
    if (anchorText) console.log(chalk.blue(`Anchor Text: ${anchorText}`));
    
    return CustomerTemplates.createMuzalexFromJSON({
        type: 'link_insertion',
        price: price,
        url: url,
        anchorText: anchorText
    });
}

function showUsage() {
    console.log(chalk.blue('\n📖 Usage Examples:\n'));
    
    console.log(chalk.yellow('1. Muzalex Guest Post (Quick):'));
    console.log('   node create_invoice_from_json.js --muzalex-guest-post --price 40 --url "https://..." --title "Article Title"');
    
    console.log(chalk.yellow('\n2. Muzalex Link Insertion (Quick):'));
    console.log('   node create_invoice_from_json.js --muzalex-link-insertion --price 20 --url "https://..." --anchor "Link Text"');
    
    console.log(chalk.yellow('\n3. JSON String (Full Control):'));
    console.log('   node create_invoice_from_json.js \'{"customer":{"email":"test@test.com","firstName":"John","lastName":"Doe"},"service":{"type":"guest_post","price":40}}\'');
    
    console.log(chalk.yellow('\n4. JSON File (Full Control):'));
    console.log('   node create_invoice_from_json.js ./invoice_data.json');
    
    console.log(chalk.blue('\n📝 JSON Structure for file/string method:'));
    console.log(`{
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Company Name"
  },
  "service": {
    "type": "guest_post",
    "price": 40,
    "url": "https://techgeekers.com/article-url",
    "title": "Article Title"
  }
}`);
}

if (require.main === module) {
    createInvoiceFromJSON();
}

module.exports = { createInvoiceFromJSON };