# RupantorPay Payment Gateway API Documentation

Complete API reference for integrating RupantorPay payment gateway into your application.

## Base URL

```
https://payment.rupantorpay.com/api
```

## Authentication

All API requests require the following headers:

```javascript
{
  'Content-Type': 'application/json',
  'X-API-KEY': 'your_api_key_here',
  'X-CLIENT': 'yourdomain.com'
}
```

- **X-API-KEY**: Get this from your RupantorPay Brands section
- **X-CLIENT**: Your domain/host name

---

## 1. Create Payment

Creates a payment request and returns a payment URL where customers complete their payment.

### Endpoint

```
POST /payment/checkout
```

### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `fullname` | string | Yes | Customer's full name | "John Doe" |
| `email` | string | Yes | Customer's email address | "john@example.com" |
| `amount` | string/number | Yes | Payment amount (no trailing zeros for whole numbers) | "100" or "100.50" |
| `success_url` | string | Yes | Redirect URL after successful payment | "https://yourdomain.com/success" |
| `cancel_url` | string | Yes | Redirect URL if payment is cancelled | "https://yourdomain.com/cancel" |
| `webhook_url` | string | No | Server-to-server notification URL | "https://yourdomain.com/webhook" |
| `metadata` | object | No | Additional custom data (JSON format) | `{"order_id": "12345", "phone": "016****"}` |

### Request Example

```javascript
const createPayment = async () => {
  const response = await fetch('https://payment.rupantorpay.com/api/payment/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'your_api_key_here',
      'X-CLIENT': 'yourdomain.com'
    },
    body: JSON.stringify({
      fullname: "John Doe",
      email: "john@example.com",
      amount: "100",
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/cancel",
      webhook_url: "https://yourdomain.com/webhook",
      metadata: {
        order_id: "12345",
        phone: "016****"
      }
    })
  });

  const data = await response.json();
  return data;
};
```

### Success Response

```json
{
  "status": 1,
  "message": "Payment Link",
  "payment_url": "https://payment.rupantorpay.com/api/execute/b32174038622a436c132a893183a8f74"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | boolean | `true` (or `1`) for success |
| `message` | string | Status message |
| `payment_url` | string | URL where customer completes payment |

### Error Response

```json
{
  "status": false,
  "message": "Error message describing what went wrong"
}
```

### What to do with the response

After receiving the `payment_url`, redirect your customer to this URL:

```javascript
// Redirect user to payment page
window.location.href = data.payment_url;

// OR open in popup (if using RupantorPay checkout.js)
rupantorpayCheckOut(data.payment_url);
```

---

## 2. Payment Completion Callback

After the customer completes or cancels the payment, RupantorPay redirects them back to your `success_url` or `cancel_url` with query parameters.

### Redirect URL Format

```
https://yourdomain.com/success?transactionId=****&paymentMethod=***&paymentAmount=**.**&paymentFee=**.**&currency=****&status=COMPLETED
```

### Query Parameters Returned

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `transactionId` | string | Unique transaction identifier | "OVKPXW165414" |
| `paymentMethod` | string | Payment method used by customer | "bkash" |
| `paymentAmount` | string | Amount paid by customer | "100.00" |
| `paymentFee` | string | Transaction fee deducted | "2.50" |
| `currency` | string | Currency code | "BDT" |
| `status` | string | Payment status | "PENDING", "COMPLETED", or "ERROR" |

### Example: Capturing Parameters in React

```javascript
import { useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  
  const transactionId = searchParams.get('transactionId');
  const paymentMethod = searchParams.get('paymentMethod');
  const paymentAmount = searchParams.get('paymentAmount');
  const paymentFee = searchParams.get('paymentFee');
  const currency = searchParams.get('currency');
  const status = searchParams.get('status');

  // Now verify this payment on your backend
  // ...
};
```

### Example: Capturing Parameters in Vanilla JavaScript

```javascript
const urlParams = new URLSearchParams(window.location.search);
const transactionId = urlParams.get('transactionId');
const status = urlParams.get('status');
```

---

## 3. Verify Payment

After receiving the callback, you **must** verify the payment to ensure it's legitimate and completed.

### Endpoint

```
POST /payment/verify-payment
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction_id` | string | Yes | Transaction ID from callback URL |

### Request Example

```javascript
const verifyPayment = async (transactionId) => {
  const response = await fetch('https://payment.rupantorpay.com/api/payment/verify-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'your_api_key_here'
    },
    body: JSON.stringify({
      transaction_id: transactionId
    })
  });

  const data = await response.json();
  return data;
};
```

### Success Response

```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "amount": "100.000",
  "transaction_id": "OVKPXW165414",
  "trx_id": "7TRKHJH",
  "currency": "BDT",
  "metadata": {
    "phone": "015****",
    "order_id": "12345"
  },
  "payment_method": "bkash",
  "status": "COMPLETED"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Payment status: "COMPLETED", "PENDING", or "ERROR" |
| `fullname` | string | Customer name |
| `email` | string | Customer email |
| `amount` | string | Payment amount |
| `transaction_id` | string | System-generated transaction ID |
| `trx_id` | string | Real transaction ID from payment gateway |
| `currency` | string | Currency code |
| `metadata` | object | Custom metadata you sent during payment creation |
| `payment_method` | string | Payment method used |

### Error Response

```json
{
  "status": false,
  "message": "Transaction not found or verification failed"
}
```

---

## 4. Webhook (Optional)

If you provide a `webhook_url` during payment creation, RupantorPay will send a POST request to this URL with payment details when the payment is completed.

### Webhook Payload

The webhook receives the same data structure as the verify payment response:

```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "amount": "100.000",
  "transaction_id": "OVKPXW165414",
  "trx_id": "7TRKHJH",
  "currency": "BDT",
  "metadata": {
    "phone": "015****",
    "order_id": "12345"
  },
  "payment_method": "bkash",
  "status": "COMPLETED"
}
```

### Webhook Handler Example

```javascript
app.post('/webhook', (req, res) => {
  const paymentData = req.body;
  
  // Verify the payment (recommended)
  // Update your database
  // Send confirmation emails
  // Fulfill the order
  
  console.log('Payment received:', paymentData);
  
  // Always respond with 200 OK
  res.status(200).send('OK');
});
```

---

## Complete Payment Flow

1. **Create Payment**: Call `/payment/checkout` to get a payment URL
2. **Redirect Customer**: Send customer to the `payment_url`
3. **Customer Pays**: Customer completes payment on RupantorPay
4. **Receive Callback**: Customer is redirected to your `success_url` or `cancel_url` with transaction details
5. **Verify Payment**: Call `/payment/verify-payment` with the `transaction_id` to confirm
6. **Webhook (Optional)**: Receive real-time webhook notification
7. **Fulfill Order**: Process the order based on verified payment status

---

## Payment Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Payment initiated but not yet completed |
| `COMPLETED` | Payment successfully completed |
| `ERROR` | Payment failed or cancelled |

---

## Important Notes

### Security

⚠️ **Never expose your API key in frontend code**
- Always make API calls from your backend server
- Store API keys in environment variables
- Never commit API keys to version control

### Verification

⚠️ **Always verify payments on your backend**
- Don't trust URL parameters alone
- Always call the verify endpoint after receiving callback
- Check the payment status before fulfilling orders

### Amount Formatting

- For whole numbers: use `"100"` (no decimals needed)
- For decimals: use `"100.50"` or `"100.5"` (both work)
- Don't use trailing zeros for whole numbers

### Webhook vs Callback

- **Callback (success_url/cancel_url)**: User-facing redirect
- **Webhook (webhook_url)**: Server-to-server notification (more reliable)
- Use both for best reliability

---

## Testing

1. Use sandbox credentials for testing
2. Test with small amounts first
3. Test all payment statuses (success, cancel, pending)
4. Verify webhook delivery
5. Test error handling scenarios

---

## Error Handling

Always implement proper error handling:

```javascript
try {
  const data = await createPayment(paymentData);
  if (data.status) {
    // Success
    window.location.href = data.payment_url;
  } else {
    // Handle error
    console.error(data.message);
  }
} catch (error) {
  // Handle network or server errors
  console.error('Payment creation failed:', error);
}
```

---

## Support

- **Documentation**: [rupantorpay.com/developers/docs](https://rupantorpay.com/developers/docs)
- **API Playground**: [rupantorpay.readme.io](https://rupantorpay.readme.io)
- **GitHub**: [github.com/rupantorpay](https://github.com/rupantorpay)
- **Contact**: Submit a ticket or contact via Telegram