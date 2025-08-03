# 🧾 Bulk & Multi-Item Invoice System

This enhanced PayPal invoice generator now supports multiple items, bulk orders, and mixed services in a single invoice.

## 🚀 Quick Commands

### Single Service (Existing)
```bash
# Muzalex single guest post
node create_invoice_from_json.js --muzalex-guest-post --price 40 --url "https://..." --title "..."

# Muzalex single link insertion  
node create_invoice_from_json.js --muzalex-link-insertion --price 20 --url "https://..." --anchor "..."
```

### Multiple Services (New!)
```bash
# Bulk Muzalex services (auto-detects customer)
node create_invoice_from_json.js ./examples/muzalex_bulk_guest_posts.json

# Mixed services (guest posts + link insertions)
node create_invoice_from_json.js ./examples/muzalex_mixed_services.json

# Any customer with bulk services
node create_invoice_from_json.js ./examples/bulk_link_insertions.json
```

## 📋 JSON Formats

### 1. Single Service (Original)
```json
{
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Company Name"
  },
  "service": {
    "type": "guest_post",
    "price": 40,
    "url": "https://techgeekers.com/article",
    "title": "Article Title"
  }
}
```

### 2. Multiple Services - Muzalex (Customer Auto-filled)
```json
{
  "services": [
    {
      "type": "guest_post",
      "price": 40,
      "url": "https://techgeekers.com/article-1",
      "title": "Article 1"
    },
    {
      "type": "link_insertion",
      "price": 20,
      "url": "https://client-site.com",
      "anchorText": "link text"
    }
  ],
  "note": "Custom thank you message",
  "reference": "ORDER-001"
}
```

### 3. Multiple Services - Any Customer
```json
{
  "customer": {
    "email": "bulkclient@example.com",
    "firstName": "Bulk",
    "lastName": "Client",
    "businessName": "SEO Company"
  },
  "services": [
    {
      "type": "guest_post",
      "price": 45,
      "url": "https://techgeekers.com/article-1",
      "title": "Article Title 1"
    },
    {
      "type": "guest_post", 
      "price": 45,
      "url": "https://techgeekers.com/article-2",
      "title": "Article Title 2"
    }
  ],
  "discount": {
    "amount": 10,
    "description": "2-article package discount"
  }
}
```

## 🎯 Use Cases

### Scenario 1: Muzalex Orders 3 Guest Posts
**File:** `examples/muzalex_bulk_guest_posts.json`
- **Total:** 3 × $40 = $120
- **Auto-numbered:** Guest Post #1, Guest Post #2, Guest Post #3
- **Custom note:** WoW MoP Classic package message

### Scenario 2: Mixed Services Package
**File:** `examples/muzalex_mixed_services.json`
- **Items:** 1 Guest Post ($40) + 2 Link Insertions ($20 each)
- **Total:** $80
- **Smart descriptions:** Different descriptions for each service type

### Scenario 3: Bulk Link Insertions
**File:** `examples/bulk_link_insertions.json`
- **Items:** 5 Link Insertions ($15 each)
- **Total:** $75 (with $15 bulk discount = $60)
- **For:** Different customer (not Muzalex)

## ✨ Features

### Auto-Detection
- **Muzalex Format:** JSON with `services` array (no customer) → Auto-fills Muzalex customer info
- **Custom Customer:** JSON with `services` array + `customer` object → Uses provided customer
- **Single Service:** JSON with `service` object → Original single-item invoice

### Smart Numbering
- **Multiple items:** Automatically numbered (#1, #2, #3, etc.)
- **Single item:** No numbering (clean appearance)

### Flexible Pricing
- **Individual pricing:** Each service can have different price
- **Discounts:** Optional discount item (note: currently disabled due to PayPal validation)
- **Mixed currencies:** Support for different currencies per item

### Enhanced Descriptions
- **Guest Posts:** Include URL, title, publication date
- **Link Insertions:** Include target URL, anchor text, insertion date
- **Custom descriptions:** Override with your own description

## 🔧 Advanced Options

### Custom Notes & References
```json
{
  "services": [...],
  "note": "Custom thank you message for this specific order",
  "reference": "CLIENT-ORDER-2025-001",
  "memo": "Internal memo for accounting"
}
```

### Service-Specific Options
```json
{
  "type": "guest_post",
  "price": 40,
  "quantity": 2,
  "url": "https://techgeekers.com/article",
  "title": "Article Title",
  "description": "Custom service description",
  "currency": "USD"
}
```

## 📁 Example Files

- `examples/example_guest_post.json` - Single guest post template
- `examples/example_bulk_guest_posts.json` - 3 guest posts bulk template
- `examples/example_mixed_services.json` - Guest post + link insertions template
- `examples/bulk_link_insertions.json` - 5 link insertions bulk template
- `examples/new_customer_guest_post.json` - Single guest post for new customer

## 🔒 Private Customer Data

Real customer information is stored securely in:
- `customers/` folder (git-ignored)
- `*.private.json` files (git-ignored)
- Use these for actual invoice creation
- Examples above use dummy data only

## 🎉 Benefits

1. **Efficiency:** Create complex invoices with one command
2. **Accuracy:** Consistent formatting and calculations
3. **Flexibility:** Support any combination of services
4. **Automation:** Perfect for bulk orders and repeat customers
5. **Professional:** Clean, detailed invoice presentation
6. **Scalable:** Easy to add new service types or customers

## 🤖 Instructions for Claude Code

When using Claude Code, you can simply mention this guide and provide customer/service details. Claude will automatically create and send invoices for you!

### **Single Service Request Format:**
```
"Create invoice for [email], [service_type] $[price], URL: [url]"
"Create invoice for [email], [service_type] $[price], URL: [url], title: '[title]'" (optional)
```
**Examples:** 
> "Create invoice for john@example.com, guest post $45, URL: https://techgeekers.com/new-article"
> 
> "Create invoice for john@example.com, guest post $45, URL: https://techgeekers.com/new-article, title: 'Gaming Performance Guide'" (with optional title)

### **Bulk Services Request Format:**
```
"Create invoice for [email]:
- Guest post $[price], URL: [url]
- Guest post $[price], URL: [url], title: '[title]' (optional)
- Link insertion $[price], target: [url], anchor: '[text]'
- Give $[amount] bulk discount" (optional)
```
**Example:** 
> "Create invoice for sarah@company.com:
> - Guest post $40, URL: https://techgeekers.com/article1
> - Guest post $40, URL: https://techgeekers.com/article2, title: 'VR Tech'  
> - Link insertion $20, target: https://client.com, anchor: 'gaming tools'"

### **Repeat Customer Quick Format:**
```
"[Customer] invoice: [quantity] [service_type] at $[price] each, URLs: [url1] and [url2]"
```
**Example:** 
> "Customer invoice: 2 guest posts at $40 each, URLs: https://techgeekers.com/article1 and https://techgeekers.com/article2"

### **What Claude Will Do Automatically:**
1. ✅ Create appropriate JSON structure
2. ✅ Generate and preview the invoice  
3. ✅ Create it in PayPal
4. ✅ Send to customer + copy to you
5. ✅ Show invoice ID and payment details

### **Service Types:**
- `guest_post` - Requires: price, URL | Optional: title
- `link_insertion` - Requires: price, target URL, anchor text

### **Quick Command:**
> Just say: "Use the bulk invoice guide" + your customer/service details

## 💡 Pro Tips

1. **Test first:** Always preview before sending to customer
2. **Use references:** Track orders with reference numbers
3. **Bulk discounts:** Mention discounts in notes since line-item discounts need PayPal validation
4. **Templates:** Create JSON templates for common order types
5. **Automation:** Perfect for API integration or batch processing
6. **Claude Integration:** Just mention this guide and provide details - Claude handles the rest!