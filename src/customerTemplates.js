/**
 * Customer Templates Handler
 * 
 * Provides reusable invoice templates for common customer scenarios
 * Simplifies invoice creation by offering pre-configured templates for:
 * - Guest post publications
 * - Link insertion services  
 * - Quick invoice generation for frequent customers
 * 
 * Each template handles customer data normalization and service-specific formatting
 */
class CustomerTemplates {
    
    /**
     * Create guest post invoice template
     * 
     * Standard template for guest post publication services
     * Handles customer data normalization and service description formatting
     * 
     * @param {Object} customerInfo - Customer contact and business information
     * @param {Object} serviceDetails - Service-specific details (price, URL, title, etc.)
     * @returns {Object} Complete invoice data structure ready for PayPal API
     */
    static createGuestPostInvoice(customerInfo, serviceDetails) {
        return {
            // Normalize customer data with flexible field mapping
            customer: {
                firstName: customerInfo.firstName || customerInfo.name?.split(' ')[0] || 'Customer',
                lastName: customerInfo.lastName || customerInfo.name?.split(' ').slice(1).join(' ') || '',
                email: customerInfo.email,
                businessName: customerInfo.businessName || customerInfo.companyName || '',
                // Flexible address mapping (handles different input formats)
                address: customerInfo.address ? {
                    line1: customerInfo.address.line1 || customerInfo.address.street || '',
                    line2: customerInfo.address.line2 || '',
                    city: customerInfo.address.city || '',
                    state: customerInfo.address.state || '',
                    postalCode: customerInfo.address.postalCode || customerInfo.address.zip || '',
                    countryCode: customerInfo.address.countryCode || 'US'
                } : null,
                phone: customerInfo.phone || '',
                vatNumber: customerInfo.vatNumber || ''
            },
            // Business information loaded from environment variables
            business: {
                name: process.env.BUSINESS_NAME || 'TG Media. Tech Geekers',
                firstName: 'TG Media',
                lastName: 'Tech Geekers',
                email: process.env.BUSINESS_EMAIL || 'billing@techgeekers.com',
                phone: process.env.BUSINESS_PHONE || '',
                website: process.env.BUSINESS_WEBSITE || '',
                address: {
                    line1: process.env.BUSINESS_ADDRESS_LINE_1 || '',
                    line2: process.env.BUSINESS_ADDRESS_LINE_2 || '',
                    city: process.env.BUSINESS_CITY || '',
                    state: process.env.BUSINESS_STATE || '',
                    postalCode: process.env.BUSINESS_POSTAL_CODE || '',
                    countryCode: process.env.BUSINESS_COUNTRY || 'IN'
                }
            },
            // Service item configuration
            items: [{
                name: serviceDetails.serviceName || 'Guest Post Publication',
                description: this.createServiceDescription(serviceDetails),
                quantity: serviceDetails.quantity || 1,
                unitAmount: serviceDetails.price || 0,
                currencyCode: serviceDetails.currency || 'USD'
            }],
            currencyCode: serviceDetails.currency || 'USD',
            // Standard terms for guest post services (3-day payment period)
            note: serviceDetails.note || 'Thank you for choosing our guest post services. Payment is due within 3 days.',
            terms: 'Payment due within 3 days. No refunds for digital services once delivered.',
            memo: serviceDetails.memo || '',
            reference: serviceDetails.reference || serviceDetails.url || '',
            paymentTerm: 'DUE_ON_DATE_SPECIFIED',
            allowPartialPayment: false,
            allowTip: false
        };
    }

    /**
     * Create link insertion invoice template
     * 
     * Specialized template for link insertion services
     * Extends guest post template with link-specific descriptions
     * 
     * @param {Object} customerInfo - Customer information
     * @param {Object} serviceDetails - Link insertion service details
     * @returns {Object} Complete invoice data structure
     */
    static createLinkInsertionInvoice(customerInfo, serviceDetails) {
        return {
            // Use guest post template as base and override specific fields
            ...this.createGuestPostInvoice(customerInfo, {
                ...serviceDetails,
                serviceName: 'Link Insertion Service'
            }),
            // Override items with link insertion specific details
            items: [{
                name: 'Link Insertion Service',
                description: this.createLinkInsertionDescription(serviceDetails),
                quantity: serviceDetails.quantity || 1,
                unitAmount: serviceDetails.price || 0,
                currencyCode: serviceDetails.currency || 'USD'
            }]
        };
    }

    /**
     * Create detailed service description for guest posts
     * 
     * Builds comprehensive description including URL, title, and publication details
     * Formats information in a professional, structured manner
     * 
     * @param {Object} serviceDetails - Service information
     * @returns {string} Formatted service description
     */
    static createServiceDescription(serviceDetails) {
        let description = '';
        
        // Start with service name
        if (serviceDetails.serviceName) {
            description += serviceDetails.serviceName;
        } else {
            description += 'Guest Post Publication';
        }
        
        // Add published URL (most important for guest posts)
        if (serviceDetails.url) {
            description += `\nPublished URL: ${serviceDetails.url}`;
        }
        
        // Add article title if provided
        if (serviceDetails.title) {
            description += `\nArticle Title: ${serviceDetails.title}`;
        }
        
        // Add additional details
        if (serviceDetails.description) {
            description += `\nDetails: ${serviceDetails.description}`;
        }
        
        // Add publication date for record keeping
        if (serviceDetails.publicationDate) {
            description += `\nPublication Date: ${serviceDetails.publicationDate}`;
        }
        
        return description.trim();
    }

    /**
     * Create detailed service description for link insertions
     * 
     * Builds description specific to link insertion services
     * Includes target URL, anchor text, and insertion details
     * 
     * @param {Object} serviceDetails - Link insertion service information
     * @returns {string} Formatted link insertion description
     */
    static createLinkInsertionDescription(serviceDetails) {
        let description = 'Link Insertion Service';
        
        // Add target URL for link insertion
        if (serviceDetails.url) {
            description += `\nTarget URL: ${serviceDetails.url}`;
        }
        
        // Add anchor text used for the link
        if (serviceDetails.anchorText) {
            description += `\nAnchor Text: ${serviceDetails.anchorText}`;
        }
        
        // Add insertion date for tracking
        if (serviceDetails.insertionDate) {
            description += `\nInsertion Date: ${serviceDetails.insertionDate}`;
        }
        
        // Add additional service details
        if (serviceDetails.description) {
            description += `\nDetails: ${serviceDetails.description}`;
        }
        
        return description.trim();
    }

    /**
     * Quick guest post invoice creation
     * 
     * Simplified method for rapid invoice generation with minimal parameters
     * Perfect for common scenarios where full customer details aren't needed
     * 
     * @param {string} email - Customer email address
     * @param {string} companyName - Customer company name
     * @param {number} price - Service price
     * @param {string} url - Published article URL
     * @param {string} [title=''] - Article title (optional)
     * @returns {Object} Complete invoice data structure
     */
    static quickGuestPost(email, companyName, price, url, title = '') {
        return this.createGuestPostInvoice(
            {
                email: email,
                businessName: companyName,
                name: companyName
            },
            {
                price: price,
                url: url,
                title: title,
                serviceName: 'Guest Post Publication'
            }
        );
    }

    /**
     * Sencha customer-specific invoice template
     * 
     * Pre-configured template for Sencha Inc. with all known customer details
     * Includes complete address information and published article details
     * Used for testing and as an example of customer-specific templates
     * 
     * @param {number} [price=30] - Service price (defaults to $30)
     * @returns {Object} Complete Sencha invoice data structure
     */
    static createSenchaInvoice(price = 30) {
        return this.createGuestPostInvoice(
            // Sencha customer information
            {
                email: 'raj.vuyyuru@idera.com',
                businessName: 'Sencha',
                firstName: 'Sencha',
                lastName: 'Inc',
                address: {
                    line1: '4001 W Parmer Lane Suite 125',
                    city: 'Austin',
                    state: 'TX',
                    postalCode: '78727',
                    countryCode: 'US'
                }
            },
            // Service details for published React UI component library article
            {
                price: price,
                url: 'https://techgeekers.com/reducing-development-time-with-pre-built-react-ui-component-library/',
                title: 'Reducing Development Time with Pre-built React UI Component Library',
                serviceName: 'Guest Post Publication',
                publicationDate: new Date().toISOString().split('T')[0],
                description: 'High-quality guest post article published focusing on React UI component libraries.'
            }
        );
    }
}

module.exports = CustomerTemplates;