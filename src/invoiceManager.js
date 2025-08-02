const PayPalAuth = require('./paypalAuth');
const InvoiceValidator = require('./invoiceValidator');
const InvoiceStructure = require('./invoiceStructure');
const chalk = require('chalk');

/**
 * Invoice Management Handler
 * 
 * Main orchestrator for all invoice operations with PayPal API
 * Provides high-level methods for common invoice workflows including:
 * - Creating invoices with validation
 * - Sending invoices via email
 * - Previewing invoices before creation
 * - Managing invoice lifecycle (cancel, list, retrieve)
 * 
 * Handles error management, API response processing, and user feedback
 */
class InvoiceManager {
    /**
     * Initialize invoice manager with PayPal authentication
     */
    constructor() {
        this.paypal = new PayPalAuth();
    }

    /**
     * Create a new invoice via PayPal API
     * 
     * Validates invoice data, creates PayPal-compatible payload, and submits to API
     * Handles link-based responses and extracts invoice details
     * 
     * @param {Object} invoiceData - Complete invoice data structure
     * @returns {Object} Creation result with invoice details or error information
     */
    async createInvoice(invoiceData) {
        try {
            console.log(chalk.blue('🔍 Validating invoice data...'));
            
            // Validate the invoice data before sending to PayPal
            const validation = InvoiceValidator.validateCompleteInvoice(invoiceData);
            if (!validation.isValid) {
                throw new Error('Validation failed:\n' + validation.errors.join('\n'));
            }

            console.log(chalk.green('✅ Invoice data validated successfully'));
            console.log(chalk.blue('📄 Creating PayPal invoice payload...'));

            // Transform internal data structure to PayPal API format
            const invoicePayload = InvoiceStructure.createPayPalInvoicePayload(invoiceData);
            
            console.log(chalk.blue('🚀 Sending invoice to PayPal API...'));

            // Submit invoice creation request to PayPal
            let response = await this.paypal.makeAuthenticatedRequest(
                'POST',
                '/v2/invoicing/invoices',
                invoicePayload
            );

            console.log(chalk.green('✅ Invoice created successfully!'));
            
            // Handle PayPal's link-based response format
            // PayPal sometimes returns location links instead of full invoice data
            if (response.href && response.method) {
                console.log(chalk.yellow('📍 Received link response, fetching invoice details...'));
                // Extract invoice ID from href URL pattern
                const invoiceIdMatch = response.href.match(/\/invoices\/([^/?]+)/);
                if (invoiceIdMatch) {
                    const invoiceId = invoiceIdMatch[1];
                    const invoiceDetails = await this.getInvoice(invoiceId);
                    if (invoiceDetails.success) {
                        response = invoiceDetails.invoice;
                    }
                }
            }
            
            console.log(chalk.yellow(`📋 Invoice ID: ${response.id}`));
            console.log(chalk.yellow(`🔗 Invoice URL: ${response.detail?.metadata?.invoicer_view_url || 'N/A'}`));

            // Return structured success response with key invoice details
            return {
                success: true,
                invoiceId: response.id,
                invoiceNumber: response.detail?.invoice_number || 'N/A',
                status: response.status,
                invoicerViewUrl: response.detail?.metadata?.invoicer_view_url || 'N/A',
                recipientViewUrl: response.detail?.metadata?.recipient_view_url || 'N/A',
                totalAmount: response.amount?.value || response.due_amount?.value || 'Not calculated',
                currency: response.amount?.currency_code || response.due_amount?.currency_code || invoiceData.currencyCode,
                fullResponse: response
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to create invoice:'), error.message);
            
            // Log detailed PayPal API error response for debugging
            if (error.response?.data) {
                console.error(chalk.red('PayPal API Error:'), JSON.stringify(error.response.data, null, 2));
            }
            
            return {
                success: false,
                error: error.message,
                details: error.response?.data || null
            };
        }
    }

    /**
     * Retrieve invoice details by ID
     * 
     * Fetches complete invoice information from PayPal API
     * Used for getting full invoice details after creation or for status checks
     * 
     * @param {string} invoiceId - PayPal invoice ID
     * @returns {Object} Invoice details or error information
     */
    async getInvoice(invoiceId) {
        try {
            console.log(chalk.blue(`🔍 Fetching invoice ${invoiceId}...`));
            
            // Fetch invoice details from PayPal API
            const invoice = await this.paypal.makeAuthenticatedRequest(
                'GET',
                `/v2/invoicing/invoices/${invoiceId}`
            );

            return {
                success: true,
                invoice
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to fetch invoice:'), error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data || null
            };
        }
    }

    /**
     * Send invoice via email notification
     * 
     * Triggers PayPal to send invoice emails to specified recipients
     * Supports custom subject, message, and additional recipients
     * 
     * @param {string} invoiceId - PayPal invoice ID to send
     * @param {Object} [notificationOptions={}] - Email notification settings
     * @returns {Object} Send result or error information
     */
    async sendInvoice(invoiceId, notificationOptions = {}) {
        try {
            console.log(chalk.blue(`📧 Sending invoice ${invoiceId}...`));

            // Configure email notification settings
            const sendPayload = {
                send_to_invoicer: notificationOptions.sendToInvoicer || false,
                send_to_recipient: notificationOptions.sendToRecipient !== false, // Default true
                subject: notificationOptions.subject || 'Invoice from your service provider',
                note: notificationOptions.note || 'Please find your invoice attached. Payment is due as per the terms mentioned.',
                additional_recipients: notificationOptions.additionalRecipients || []
            };

            const response = await this.paypal.makeAuthenticatedRequest(
                'POST',
                `/v2/invoicing/invoices/${invoiceId}/send`,
                sendPayload
            );

            console.log(chalk.green('✅ Invoice sent successfully!'));
            console.log(chalk.yellow('📧 Email notifications have been dispatched to recipients'));

            return {
                success: true,
                message: 'Invoice sent successfully',
                response
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to send invoice:'), error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data || null
            };
        }
    }

    /**
     * Generate formatted invoice preview without creating actual invoice
     * 
     * Validates data and shows how the invoice will appear when created
     * Useful for review before submission to PayPal
     * 
     * @param {Object} invoiceData - Invoice data to preview
     * @returns {Object} Preview result with formatted display or error
     */
    async previewInvoice(invoiceData) {
        try {
            console.log(chalk.blue('🔍 Validating invoice data for preview...'));
            
            // Validate the invoice data before preview
            const validation = InvoiceValidator.validateCompleteInvoice(invoiceData);
            if (!validation.isValid) {
                throw new Error('Validation failed:\n' + validation.errors.join('\n'));
            }

            // Generate PayPal-compatible payload for preview
            const invoicePayload = InvoiceStructure.createPayPalInvoicePayload(invoiceData);
            
            // Create formatted console preview display
            const preview = InvoiceStructure.formatInvoicePreview(invoicePayload);
            console.log(preview);

            return {
                success: true,
                preview,
                payload: invoicePayload
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to generate preview:'), error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create and send invoice in single operation
     * 
     * Convenience method that combines invoice creation and email sending
     * Includes delay between operations to ensure invoice readiness
     * 
     * @param {Object} invoiceData - Complete invoice data
     * @param {Object} [notificationOptions={}] - Email notification settings
     * @returns {Object} Combined operation result
     */
    async createAndSendInvoice(invoiceData, notificationOptions = {}) {
        try {
            console.log(chalk.blue('🚀 Creating and sending invoice in one go...'));

            // Step 1: Create the invoice
            const createResult = await this.createInvoice(invoiceData);
            if (!createResult.success) {
                return createResult;
            }

            console.log(chalk.blue('⏳ Waiting a moment before sending...'));
            // Small delay to ensure invoice is ready on PayPal's end
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Send the invoice via email
            const sendResult = await this.sendInvoice(createResult.invoiceId, notificationOptions);
            
            return {
                success: sendResult.success,
                invoiceId: createResult.invoiceId,
                invoiceNumber: createResult.invoiceNumber,
                totalAmount: createResult.totalAmount,
                currency: createResult.currency,
                invoicerViewUrl: createResult.invoicerViewUrl,
                recipientViewUrl: createResult.recipientViewUrl,
                sent: sendResult.success,
                sendError: sendResult.error || null
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to create and send invoice:'), error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Retrieve list of invoices with optional filtering
     * 
     * Fetches invoices from PayPal with pagination support
     * Useful for invoice management and reporting
     * 
     * @param {Object} [filters={}] - Optional filters (page, pageSize, etc.)
     * @returns {Object} List of invoices with pagination info
     */
    async listInvoices(filters = {}) {
        try {
            console.log(chalk.blue('📋 Fetching invoice list...'));

            // Build query parameters for filtering and pagination
            let queryParams = new URLSearchParams();
            
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.pageSize) queryParams.append('page_size', filters.pageSize);
            if (filters.totalRequired) queryParams.append('total_required', filters.totalRequired);

            const endpoint = `/v2/invoicing/invoices${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            
            // Fetch invoice list from PayPal API
            const response = await this.paypal.makeAuthenticatedRequest('GET', endpoint);

            console.log(chalk.green(`✅ Found ${response.total_items || response.items?.length || 0} invoices`));

            return {
                success: true,
                invoices: response.items || [],
                totalItems: response.total_items,
                totalPages: response.total_pages,
                currentPage: filters.page || 1
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to fetch invoices:'), error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data || null
            };
        }
    }

    /**
     * Cancel an existing invoice
     * 
     * Cancels invoice and sends notification to relevant parties
     * Useful for voiding invoices that are no longer valid
     * 
     * @param {string} invoiceId - PayPal invoice ID to cancel
     * @param {string} [reason='Cancelled by merchant'] - Cancellation reason
     * @returns {Object} Cancellation result or error information
     */
    async cancelInvoice(invoiceId, reason = 'Cancelled by merchant') {
        try {
            console.log(chalk.blue(`🚫 Cancelling invoice ${invoiceId}...`));

            // Configure cancellation notification
            const cancelPayload = {
                subject: 'Invoice Cancelled',
                note: reason,
                send_to_invoicer: true,
                send_to_recipient: true
            };

            // Submit cancellation request to PayPal
            await this.paypal.makeAuthenticatedRequest(
                'POST',
                `/v2/invoicing/invoices/${invoiceId}/cancel`,
                cancelPayload
            );

            console.log(chalk.green('✅ Invoice cancelled successfully!'));

            return {
                success: true,
                message: 'Invoice cancelled successfully'
            };

        } catch (error) {
            console.error(chalk.red('❌ Failed to cancel invoice:'), error.message);
            return {
                success: false,
                error: error.message,
                details: error.response?.data || null
            };
        }
    }
}

module.exports = InvoiceManager;