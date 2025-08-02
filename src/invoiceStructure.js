const moment = require('moment');

/**
 * Invoice Structure Handler
 * 
 * Creates and manages PayPal-compatible invoice payloads and formatting
 * Handles invoice data transformation, structure validation, and preview generation
 * Follows PayPal API v2 specifications for invoicing
 */
class InvoiceStructure {
    /**
     * Create PayPal API compatible invoice payload
     * 
     * Transforms internal invoice data structure into PayPal's required format
     * Handles all PayPal-specific field mappings and data formatting
     * 
     * @param {Object} invoiceData - Internal invoice data structure
     * @param {Object} invoiceData.customer - Customer information
     * @param {Object} invoiceData.business - Business information  
     * @param {Array} invoiceData.items - Invoice line items
     * @param {string} [invoiceData.currencyCode='USD'] - Currency code
     * @param {string} [invoiceData.note] - Invoice note/message
     * @param {string} [invoiceData.terms] - Payment terms
     * @returns {Object} PayPal API compatible invoice payload
     */
    static createPayPalInvoicePayload(invoiceData) {
        // Build PayPal invoice payload following API v2 specification
        const invoice = {
            // Invoice basic details and metadata
            detail: {
                invoice_number: invoiceData.invoiceNumber || this.generateInvoiceNumber(),
                reference: invoiceData.reference || '',
                invoice_date: invoiceData.invoiceDate || moment().format('YYYY-MM-DD'),
                currency_code: invoiceData.currencyCode || 'USD',
                note: invoiceData.note || 'Thank you for your business.',
                term: invoiceData.terms || 'Payment due within 30 days.',
                memo: invoiceData.memo || '',
                // Set payment terms to 3 days (DUE_ON_DATE_SPECIFIED)
                payment_term: {
                    term_type: 'DUE_ON_DATE_SPECIFIED',
                    due_date: invoiceData.dueDate || moment().add(3, 'days').format('YYYY-MM-DD')
                }
            },
            // Business information (invoice sender)
            invoicer: {
                name: {
                    given_name: invoiceData.business.firstName || '',
                    surname: invoiceData.business.lastName || ''
                },
                // Business address details
                address: {
                    address_line_1: invoiceData.business.address?.line1 || '',
                    address_line_2: invoiceData.business.address?.line2 || '',
                    admin_area_2: invoiceData.business.address?.city || '',
                    admin_area_1: invoiceData.business.address?.state || '',
                    postal_code: invoiceData.business.address?.postalCode || '',
                    country_code: invoiceData.business.address?.countryCode || 'US'
                },
                website: invoiceData.business.website || '',
                tax_id: invoiceData.business.taxId || '',
                additional_notes: invoiceData.business.additionalNotes || ''
            },
            // Customer information (invoice recipient)
            primary_recipients: [{
                billing_info: {
                    name: {
                        given_name: invoiceData.customer.firstName,
                        surname: invoiceData.customer.lastName
                    },
                    // Customer address (optional)
                    address: invoiceData.customer.address ? {
                        address_line_1: invoiceData.customer.address.line1 || '',
                        address_line_2: invoiceData.customer.address.line2 || '',
                        admin_area_2: invoiceData.customer.address.city || '',
                        admin_area_1: invoiceData.customer.address.state || '',
                        postal_code: invoiceData.customer.address.postalCode || '',
                        country_code: invoiceData.customer.address.countryCode || 'US'
                    } : undefined,
                    email_address: invoiceData.customer.email,
                    // Phone number formatting for PayPal
                    phones: invoiceData.customer.phone ? [{
                        country_code: '1',
                        national_number: invoiceData.customer.phone.replace(/\D/g, ''),
                        phone_type: 'HOME'
                    }] : [],
                    business_name: invoiceData.customer.businessName || '',
                    additional_info_value: invoiceData.customer.vatNumber || ''
                }
            }],
            // Invoice line items with detailed formatting
            items: invoiceData.items.map(item => ({
                name: item.name,
                description: item.description || '',
                quantity: item.quantity.toString(),
                // Unit pricing with currency formatting
                unit_amount: {
                    currency_code: item.currencyCode || invoiceData.currencyCode || 'USD',
                    value: parseFloat(item.unitAmount).toFixed(2)
                },
                // Tax handling (optional)
                tax: item.tax ? {
                    name: item.tax.name || 'Tax',
                    percent: item.tax.percent?.toString() || '0'
                } : undefined,
                // Discount handling (optional)
                discount: item.discount ? {
                    percent: item.discount.percent?.toString(),
                    amount: item.discount.amount ? {
                        currency_code: item.currencyCode || invoiceData.currencyCode || 'USD',
                        value: parseFloat(item.discount.amount).toFixed(2)
                    } : undefined
                } : undefined,
                unit_of_measure: 'QUANTITY'
            })),
            // Invoice payment and display configuration
            configuration: {
                partial_payment: {
                    allow_partial_payment: invoiceData.allowPartialPayment || false,
                    minimum_amount_due: invoiceData.minimumAmountDue ? {
                        currency_code: invoiceData.currencyCode || 'USD',
                        value: parseFloat(invoiceData.minimumAmountDue).toFixed(2)
                    } : undefined
                },
                allow_tip: invoiceData.allowTip || false,
                // Tax calculation preferences
                tax_calculated_after_discount: true,
                tax_inclusive: false
            }
        };

        // Add additional recipients if provided (CC invoice to others)
        if (invoiceData.additionalRecipients && invoiceData.additionalRecipients.length > 0) {
            invoice.additional_recipients = invoiceData.additionalRecipients;
        }

        // Add custom amount breakdown if provided (extra charges, fees, etc.)
        if (invoiceData.customAmount) {
            invoice.amount = {
                breakdown: {
                    custom: {
                        label: invoiceData.customAmount.label || 'Additional Charges',
                        amount: {
                            currency_code: invoiceData.currencyCode || 'USD',
                            value: parseFloat(invoiceData.customAmount.amount).toFixed(2)
                        }
                    }
                }
            };
        }

        return invoice;
    }

    /**
     * Generate unique invoice number
     * 
     * Creates a unique invoice number using timestamp and random components
     * Format: INV-{timestamp}-{random} (e.g., INV-12345678-001)
     * 
     * @returns {string} Unique invoice number
     */
    static generateInvoiceNumber() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${timestamp}-${random}`;
    }

    /**
     * Create invoice data structure for guest post services
     * 
     * Pre-configured template for digital marketing services
     * Handles guest posts and link insertion services with standard pricing
     * 
     * @param {Object} customerData - Customer information
     * @param {'guest_post'|'link_insert'} serviceType - Type of service
     * @param {number} price - Service price
     * @param {string} [description=''] - Additional service description
     * @returns {Object} Complete invoice data structure
     */
    static createGuestPostInvoiceData(customerData, serviceType, price, description = '') {
        // Standard service descriptions
        const serviceDescriptions = {
            'guest_post': 'Guest Post Article Publication',
            'link_insert': 'Link Insertion Service'
        };

        return {
            // Customer information from provided data
            customer: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                email: customerData.email,
                businessName: customerData.businessName || '',
                address: customerData.address || null,
                phone: customerData.phone || '',
                vatNumber: customerData.vatNumber || ''
            },
            // Business information from environment variables
            business: {
                name: process.env.BUSINESS_NAME || 'Digital Marketing Services',
                firstName: 'Digital Marketing',
                lastName: 'Services',
                email: process.env.BUSINESS_EMAIL || 'billing@yourbusiness.com',
                phone: process.env.BUSINESS_PHONE || '',
                website: process.env.BUSINESS_WEBSITE || '',
                address: {
                    line1: process.env.BUSINESS_ADDRESS_LINE_1 || '',
                    line2: process.env.BUSINESS_ADDRESS_LINE_2 || '',
                    city: process.env.BUSINESS_CITY || '',
                    state: process.env.BUSINESS_STATE || '',
                    postalCode: process.env.BUSINESS_POSTAL_CODE || '',
                    countryCode: process.env.BUSINESS_COUNTRY || 'US'
                }
            },
            // Service item details
            items: [{
                name: serviceDescriptions[serviceType] || 'Digital Marketing Service',
                description: description || `${serviceDescriptions[serviceType]} - Digital marketing service`,
                quantity: 1,
                unitAmount: price,
                currencyCode: 'USD'
            }],
            currencyCode: 'USD',
            // Standard terms for digital marketing services
            note: 'Thank you for choosing our digital marketing services. Payment is due within 30 days.',
            terms: 'Payment due within 30 days. No refunds for digital services once delivered.',
            paymentTerm: 'NET_30',
            allowPartialPayment: false,
            allowTip: false
        };
    }

    /**
     * Format invoice for console preview display
     * 
     * Creates a formatted, colored console output showing invoice details
     * Uses cli-table3 for structured item display and chalk for colors
     * 
     * @param {Object} invoice - PayPal invoice payload
     * @returns {string} Formatted preview string ready for console display
     */
    static formatInvoicePreview(invoice) {
        const Table = require('cli-table3');
        const chalk = require('chalk');

        // Build formatted preview with header
        let preview = '\n';
        preview += chalk.bold.blue('='.repeat(60)) + '\n';
        preview += chalk.bold.blue('                    INVOICE PREVIEW') + '\n';
        preview += chalk.bold.blue('='.repeat(60)) + '\n\n';

        // Display invoice metadata
        preview += chalk.bold('Invoice Number: ') + chalk.green(invoice.detail.invoice_number) + '\n';
        preview += chalk.bold('Invoice Date: ') + invoice.detail.invoice_date + '\n';
        preview += chalk.bold('Currency: ') + invoice.detail.currency_code + '\n';
        preview += chalk.bold('Payment Term: ') + invoice.detail.payment_term.term_type + '\n\n';

        // Display business information (invoice sender)
        preview += chalk.bold.yellow('FROM:') + '\n';
        const invoicer = invoice.invoicer;
        preview += `${invoicer.name.given_name} ${invoicer.name.surname}\n`;
        if (invoicer.address.address_line_1) {
            preview += `${invoicer.address.address_line_1}\n`;
            if (invoicer.address.address_line_2) preview += `${invoicer.address.address_line_2}\n`;
            preview += `${invoicer.address.admin_area_2}, ${invoicer.address.admin_area_1} ${invoicer.address.postal_code}\n`;
            preview += `${invoicer.address.country_code}\n`;
        }
        if (invoicer.website) preview += `${invoicer.website}\n`;
        preview += '\n';

        // Display customer information (invoice recipient)
        preview += chalk.bold.yellow('TO:') + '\n';
        const customer = invoice.primary_recipients[0].billing_info;
        preview += `${customer.name.given_name} ${customer.name.surname}\n`;
        if (customer.business_name) preview += `${customer.business_name}\n`;
        preview += `${customer.email_address}\n`;
        if (customer.address) {
            preview += `${customer.address.address_line_1}\n`;
            if (customer.address.address_line_2) preview += `${customer.address.address_line_2}\n`;
            preview += `${customer.address.admin_area_2}, ${customer.address.admin_area_1} ${customer.address.postal_code}\n`;
            preview += `${customer.address.country_code}\n`;
        }
        preview += '\n';

        // Create formatted table for invoice items
        const table = new Table({
            head: ['Item', 'Description', 'Qty', 'Unit Price', 'Total'],
            colWidths: [20, 30, 8, 12, 12]
        });

        // Calculate totals and populate table rows
        let totalAmount = 0;
        invoice.items.forEach(item => {
            const unitPrice = parseFloat(item.unit_amount.value);
            const quantity = parseFloat(item.quantity);
            const itemTotal = unitPrice * quantity;
            totalAmount += itemTotal;

            table.push([
                item.name,
                item.description || '',
                item.quantity,
                `${item.unit_amount.currency_code} ${unitPrice.toFixed(2)}`,
                `${item.unit_amount.currency_code} ${itemTotal.toFixed(2)}`
            ]);
        });

        preview += table.toString() + '\n\n';

        // Display total amount
        preview += chalk.bold.green(`TOTAL: ${invoice.detail.currency_code} ${totalAmount.toFixed(2)}`) + '\n\n';

        // Display additional notes and terms
        if (invoice.detail.note) {
            preview += chalk.bold('Note: ') + invoice.detail.note + '\n';
        }
        if (invoice.detail.term) {
            preview += chalk.bold('Terms: ') + invoice.detail.term + '\n';
        }

        preview += '\n' + chalk.bold.blue('='.repeat(60)) + '\n';

        return preview;
    }
}

module.exports = InvoiceStructure;