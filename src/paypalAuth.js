const axios = require('axios');
require('dotenv').config();

/**
 * PayPal Authentication Handler
 * 
 * Manages OAuth2 authentication with PayPal API
 * Handles token generation, caching, and automatic renewal
 * Supports both SANDBOX and PRODUCTION environments
 */
class PayPalAuth {
    constructor() {
        // Load PayPal credentials from environment variables
        this.clientId = process.env.PAYPAL_CLIENT_ID;
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        this.environment = process.env.PAYPAL_ENVIRONMENT || 'SANDBOX';
        
        // Set appropriate API base URL based on environment
        this.baseURL = this.environment === 'PRODUCTION' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';
        
        // Token caching to avoid unnecessary API calls
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get Access Token with automatic caching and renewal
     * 
     * @returns {Promise<string>} Valid PayPal access token
     * @throws {Error} If authentication fails
     */
    async getAccessToken() {
        // Check if we have a valid cached token to avoid unnecessary API calls
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Create base64 encoded credentials for Basic Auth
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            // Request access token from PayPal OAuth2 endpoint
            const response = await axios.post(
                `${this.baseURL}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Language': 'en_US',
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            // Cache the token and set expiry time
            this.accessToken = response.data.access_token;
            // Set expiry time (subtract 5 minutes for safety buffer)
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000);
            
            console.log(`✅ PayPal authentication successful (${this.environment})`);
            return this.accessToken;

        } catch (error) {
            console.error('❌ PayPal authentication failed:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with PayPal API');
        }
    }

    /**
     * Make authenticated API request to PayPal
     * 
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint path (e.g., '/v2/invoicing/invoices')
     * @param {Object|null} data - Request payload for POST/PUT requests
     * @returns {Promise<Object>} API response data
     * @throws {Error} If API request fails
     */
    async makeAuthenticatedRequest(method, endpoint, data = null) {
        // Get valid access token (will refresh if needed)
        const token = await this.getAccessToken();
        
        // Prepare request configuration
        const config = {
            method,
            url: `${this.baseURL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Accept-Language': 'en_US'
            }
        };

        // Add request body for POST/PUT requests
        if (data) {
            config.data = data;
        }

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`❌ API request failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get the PayPal API base URL for current environment
     * @returns {string} Base URL
     */
    getBaseURL() {
        return this.baseURL;
    }

    /**
     * Get current PayPal environment (SANDBOX or PRODUCTION)
     * @returns {string} Environment name
     */
    getEnvironment() {
        return this.environment;
    }
}

module.exports = PayPalAuth;