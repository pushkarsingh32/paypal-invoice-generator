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
     * Create guest post invoice for customer@example.com
     * 
     * Pre-configured template for customer@example.com customer
     * Standard guest post service at $40
     * 
     * @param {string} [url=''] - Published article URL
     * @param {string} [title=''] - Article title
     * @returns {Object} Complete invoice data structure
     */
    static createExampleGuestPostInvoice(url = '', title = '') {
        return this.createGuestPostInvoice(
            // Customer information
            {
                email: 'customer@example.com',
                businessName: 'Example',
                firstName: 'Example',
                lastName: 'Customer'
            },
            // Service details for guest post
            {
                price: 40,
                url: url,
                title: title,
                serviceName: 'Guest Post Publication',
                publicationDate: new Date().toISOString().split('T')[0],
                description: 'High-quality guest post article published on techgeekers.com'
            }
        );
    }

    /**
     * Create link insertion invoice for customer@example.com
     * 
     * Pre-configured template for link insertion service
     * Standard link insertion service pricing
     * 
     * @param {string} [targetUrl=''] - Target URL for link insertion
     * @param {string} [anchorText=''] - Anchor text for the link
     * @param {number} [price=20] - Link insertion price
     * @returns {Object} Complete invoice data structure
     */
    static createExampleLinkInsertionInvoice(targetUrl = '', anchorText = '', price = 20) {
        return this.createLinkInsertionInvoice(
            // Customer information
            {
                email: 'customer@example.com',
                businessName: 'Example',
                firstName: 'Example',
                lastName: 'Customer'
            },
            // Service details for link insertion
            {
                price: price,
                url: targetUrl,
                anchorText: anchorText,
                serviceName: 'Link Insertion Service',
                insertionDate: new Date().toISOString().split('T')[0],
                description: 'Professional link insertion service on techgeekers.com'
            }
        );
    }

    /**
     * Create invoice from JSON data - Generic Template
     * 
     * Flexible method that accepts complete JSON data for any customer and service type
     * Perfect for automation and API integration
     * 
     * @param {Object} invoiceData - Complete invoice JSON data
     * @returns {Object} Complete invoice data structure
     * 
     * Example JSON structure:
     * {
     *   "customer": {
     *     "email": "customer@example.com",
     *     "firstName": "John",
     *     "lastName": "Doe",
     *     "businessName": "Company Name"
     *   },
     *   "service": {
     *     "type": "guest_post", // or "link_insertion"
     *     "price": 40,
     *     "url": "https://example.com/article",
     *     "title": "Article Title",
     *     "description": "Custom description"
     *   }
     * }
     */
    static createFromJSON(invoiceData) {
        const { customer, service } = invoiceData;
        
        if (service.type === 'guest_post') {
            return this.createGuestPostInvoice(customer, {
                price: service.price,
                url: service.url || '',
                title: service.title || '',
                description: service.description || 'High-quality guest post article published on techgeekers.com',
                serviceName: 'Guest Post Publication',
                publicationDate: new Date().toISOString().split('T')[0]
            });
        } else if (service.type === 'link_insertion') {
            return this.createLinkInsertionInvoice(customer, {
                price: service.price,
                url: service.url || '',
                anchorText: service.anchorText || '',
                description: service.description || 'Professional link insertion service on techgeekers.com',
                serviceName: 'Link Insertion Service',
                insertionDate: new Date().toISOString().split('T')[0]
            });
        } else {
            throw new Error(`Unknown service type: ${service.type}. Use 'guest_post' or 'link_insertion'`);
        }
    }

    /**
     * Create invoice with multiple items - Enhanced Template
     * 
     * Supports multiple guest posts, link insertions, or mixed services in one invoice
     * Perfect for bulk orders or package deals
     * 
     * @param {Object} invoiceData - Invoice data with multiple services
     * @returns {Object} Complete invoice data structure
     * 
     * Example JSON structure:
     * {
     *   "customer": {
     *     "email": "customer@example.com",
     *     "firstName": "John",
     *     "lastName": "Doe",
     *     "businessName": "Company Name"
     *   },
     *   "services": [
     *     {
     *       "type": "guest_post",
     *       "price": 40,
     *       "url": "https://techgeekers.com/article-1",
     *       "title": "Article 1 Title"
     *     },
     *     {
     *       "type": "guest_post", 
     *       "price": 40,
     *       "url": "https://techgeekers.com/article-2",
     *       "title": "Article 2 Title"
     *     },
     *     {
     *       "type": "link_insertion",
     *       "price": 20,
     *       "url": "https://client-site.com",
     *       "anchorText": "Client Link"
     *     }
     *   ],
     *   "discount": {
     *     "amount": 10,
     *     "description": "Bulk order discount"
     *   }
     * }
     */
    static createMultiItemFromJSON(invoiceData) {
        const { customer, services, discount } = invoiceData;
        
        if (!services || !Array.isArray(services) || services.length === 0) {
            throw new Error('Services array is required and must contain at least one service');
        }
        
        // Build items array from services
        const items = services.map((service, index) => {
            const itemNumber = services.length > 1 ? ` #${index + 1}` : '';
            
            if (service.type === 'guest_post') {
                return {
                    name: `Guest Post Publication${itemNumber}`,
                    description: this.createServiceDescription({
                        serviceName: `Guest Post Publication${itemNumber}`,
                        url: service.url || '',
                        title: service.title || '',
                        description: service.description || 'High-quality guest post article published on techgeekers.com',
                        publicationDate: new Date().toISOString().split('T')[0]
                    }),
                    quantity: service.quantity || 1,
                    unitAmount: service.price || 0,
                    currencyCode: service.currency || 'USD'
                };
            } else if (service.type === 'link_insertion') {
                return {
                    name: `Link Insertion Service${itemNumber}`,
                    description: this.createLinkInsertionDescription({
                        url: service.url || '',
                        anchorText: service.anchorText || '',
                        description: service.description || 'Professional link insertion service on techgeekers.com',
                        insertionDate: new Date().toISOString().split('T')[0]
                    }),
                    quantity: service.quantity || 1,
                    unitAmount: service.price || 0,
                    currencyCode: service.currency || 'USD'
                };
            } else {
                throw new Error(`Unknown service type: ${service.type}. Use 'guest_post' or 'link_insertion'`);
            }
        });
        
        // Add discount as negative item if provided
        if (discount && discount.amount > 0) {
            items.push({
                name: 'Discount',
                description: discount.description || 'Bulk order discount',
                quantity: 1,
                unitAmount: -Math.abs(discount.amount),
                currencyCode: 'USD'
            });
        }
        
        return {
            customer: {
                firstName: customer.firstName || customer.name?.split(' ')[0] || 'Customer',
                lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || '',
                email: customer.email,
                businessName: customer.businessName || customer.companyName || '',
                address: customer.address ? {
                    line1: customer.address.line1 || customer.address.street || '',
                    line2: customer.address.line2 || '',
                    city: customer.address.city || '',
                    state: customer.address.state || '',
                    postalCode: customer.address.postalCode || customer.address.zip || '',
                    countryCode: customer.address.countryCode || 'US'
                } : null,
                phone: customer.phone || '',
                vatNumber: customer.vatNumber || ''
            },
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
            items: items,
            currencyCode: 'USD',
            note: invoiceData.note || `Thank you for choosing our services. ${services.length > 1 ? 'Bulk order' : 'Service'} payment is due within 3 days.`,
            terms: 'Payment due within 3 days. No refunds for digital services once delivered.',
            memo: invoiceData.memo || '',
            reference: invoiceData.reference || '',
            paymentTerm: 'DUE_ON_DATE_SPECIFIED',
            allowPartialPayment: false,
            allowTip: false
        };
    }

    /**
     * Quick JSON-based invoice for repeat customers
     * 
     * Simplified method for frequent customers using JSON data
     * Pre-fills customer info, just needs service details
     * 
     * @param {Object} serviceData - Service details JSON or array of services
     * @returns {Object} Complete invoice data structure
     * 
     * Example serviceData (single):
     * {
     *   "type": "guest_post",
     *   "price": 40,
     *   "url": "https://techgeekers.com/article-url",
     *   "title": "Article Title"
     * }
     * 
     * Example serviceData (multiple):
     * {
     *   "services": [
     *     {"type": "guest_post", "price": 40, "url": "...", "title": "..."},
     *     {"type": "link_insertion", "price": 20, "url": "...", "anchorText": "..."}
     *   ],
     *   "discount": {"amount": 10, "description": "Bulk discount"}
     * }
     */
    static createExampleFromJSON(serviceData) {
        const customerInfo = {
            email: 'customer@example.com',
            firstName: 'Example',
            lastName: 'Customer',
            businessName: 'Example Company'
        };
        
        // Check if it's multiple services
        if (serviceData.services && Array.isArray(serviceData.services)) {
            return this.createMultiItemFromJSON({
                customer: customerInfo,
                services: serviceData.services,
                discount: serviceData.discount,
                note: serviceData.note,
                memo: serviceData.memo,
                reference: serviceData.reference
            });
        } else {
            // Single service - use existing method
            return this.createFromJSON({
                customer: customerInfo,
                service: serviceData
            });
        }
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
                email: 'demo@example.com',
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