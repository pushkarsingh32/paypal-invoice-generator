const validator = require('validator');

/**
 * Invoice Data Validation Handler
 * 
 * Provides comprehensive validation for invoice data before sending to PayPal
 * Ensures data integrity and prevents API errors by validating:
 * - Customer information (email, name, address)
 * - Invoice items (name, quantity, pricing)
 * - Business information
 * 
 * Uses the 'validator' library for email and format validation
 */
class InvoiceValidator {
    /**
     * Validate customer information
     * 
     * @param {Object} customerInfo - Customer data object
     * @param {string} customerInfo.email - Customer email address
     * @param {string} customerInfo.firstName - Customer first name
     * @param {string} customerInfo.lastName - Customer last name
     * @param {Object} [customerInfo.address] - Optional customer address
     * @returns {Object} Validation result with isValid flag and errors array
     */
    static validateCustomerInfo(customerInfo) {
        const errors = [];

        // Validate email - required field
        if (!customerInfo.email || !validator.isEmail(customerInfo.email)) {
            errors.push('Valid customer email is required');
        }

        // Validate customer name - both first and last name required
        if (!customerInfo.firstName || customerInfo.firstName.trim().length < 1) {
            errors.push('Customer first name is required');
        }

        if (!customerInfo.lastName || customerInfo.lastName.trim().length < 1) {
            errors.push('Customer last name is required');
        }

        // Validate address (optional but if provided, should be valid)
        if (customerInfo.address) {
            // Check PayPal field length limits
            if (customerInfo.address.line1 && customerInfo.address.line1.length > 300) {
                errors.push('Address line 1 must be less than 300 characters');
            }
            if (customerInfo.address.city && customerInfo.address.city.length > 120) {
                errors.push('City must be less than 120 characters');
            }
            // Validate country code format (ISO 3166-1 alpha-2)
            if (customerInfo.address.countryCode && !validator.isISO31661Alpha2(customerInfo.address.countryCode)) {
                errors.push('Country code must be a valid ISO 3166-1 alpha-2 code');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateInvoiceItems(items) {
        const errors = [];

        if (!Array.isArray(items) || items.length === 0) {
            errors.push('At least one invoice item is required');
            return { isValid: false, errors };
        }

        items.forEach((item, index) => {
            // Validate item name
            if (!item.name || item.name.trim().length === 0) {
                errors.push(`Item ${index + 1}: Name is required`);
            } else if (item.name.length > 200) {
                errors.push(`Item ${index + 1}: Name must be less than 200 characters`);
            }

            // Validate quantity
            if (!item.quantity || isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
                errors.push(`Item ${index + 1}: Valid quantity is required`);
            }

            // Validate unit amount
            if (!item.unitAmount || isNaN(parseFloat(item.unitAmount)) || parseFloat(item.unitAmount) <= 0) {
                errors.push(`Item ${index + 1}: Valid unit amount is required`);
            }

            // Validate currency code
            if (!item.currencyCode || !validator.isISO4217(item.currencyCode)) {
                errors.push(`Item ${index + 1}: Valid currency code is required`);
            }

            // Validate description (optional)
            if (item.description && item.description.length > 1000) {
                errors.push(`Item ${index + 1}: Description must be less than 1000 characters`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateBusinessInfo(businessInfo) {
        const errors = [];

        if (!businessInfo.name || businessInfo.name.trim().length === 0) {
            errors.push('Business name is required');
        }

        if (!businessInfo.email || !validator.isEmail(businessInfo.email)) {
            errors.push('Valid business email is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateCompleteInvoice(invoiceData) {
        let allErrors = [];

        // Validate customer info
        const customerValidation = this.validateCustomerInfo(invoiceData.customer);
        if (!customerValidation.isValid) {
            allErrors = allErrors.concat(customerValidation.errors);
        }

        // Validate items
        const itemsValidation = this.validateInvoiceItems(invoiceData.items);
        if (!itemsValidation.isValid) {
            allErrors = allErrors.concat(itemsValidation.errors);
        }

        // Validate business info
        const businessValidation = this.validateBusinessInfo(invoiceData.business);
        if (!businessValidation.isValid) {
            allErrors = allErrors.concat(businessValidation.errors);
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors
        };
    }
}

module.exports = InvoiceValidator;