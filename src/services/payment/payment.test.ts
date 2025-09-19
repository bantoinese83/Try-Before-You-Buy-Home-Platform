import { PaymentService, Payment, CreatePaymentRequest, RefundRequest } from './payment'

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
}

jest.mock('stripe', () => {
  return jest.fn(() => mockStripe)
})

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('PaymentService', () => {
  let paymentService: PaymentService
  let mockChain: any

  beforeEach(() => {
    paymentService = new PaymentService()
    jest.clearAllMocks()
    
    // Create a fresh mock chain for each test
    mockChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
    
    mockSupabaseClient.from.mockReturnValue(mockChain)
  })

  describe('Create Payment Intent', () => {
    it('should create payment intent successfully', async () => {
      const paymentData: CreatePaymentRequest = {
        bookingId: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        customerId: 'customer-123',
        paymentMethodId: 'pm_1234567890'
      }

      const mockStripePaymentIntent = {
        id: 'pi_1234567890',
        amount: 100000, // Amount in cents
        currency: 'usd',
        status: 'requires_confirmation',
        client_secret: 'pi_1234567890_secret_1234567890'
      }

      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        payment_method: 'stripe',
        stripe_payment_intent_id: 'pi_1234567890',
        status: 'pending',
        created_at: '2023-11-01T00:00:00Z'
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockStripePaymentIntent)
      mockChain.single.mockResolvedValue({
        data: mockPayment,
        error: null
      })

      const result = await paymentService.createPaymentIntent(paymentData)

      expect(result.success).toBe(true)
      expect(result.payment).toEqual({
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        paymentMethod: 'stripe',
        stripePaymentIntentId: 'pi_1234567890',
        status: 'pending',
        createdAt: '2023-11-01T00:00:00Z'
      })
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 100000,
        currency: 'usd',
        customer: 'customer-123',
        payment_method: 'pm_1234567890',
        confirmation_method: 'manual',
        confirm: true
      })
    })

    it('should handle Stripe errors', async () => {
      const paymentData: CreatePaymentRequest = {
        bookingId: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        customerId: 'customer-123',
        paymentMethodId: 'pm_invalid'
      }

      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Invalid payment method'))

      const result = await paymentService.createPaymentIntent(paymentData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid payment method')
    })

    it('should validate required fields', async () => {
      const paymentData: CreatePaymentRequest = {
        bookingId: '',
        amount: 1000.00,
        currency: 'USD',
        customerId: 'customer-123',
        paymentMethodId: 'pm_1234567890'
      }

      const result = await paymentService.createPaymentIntent(paymentData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Booking ID is required')
    })

    it('should validate amount', async () => {
      const paymentData: CreatePaymentRequest = {
        bookingId: 'booking-123',
        amount: -100.00, // Invalid amount
        currency: 'USD',
        customerId: 'customer-123',
        paymentMethodId: 'pm_1234567890'
      }

      const result = await paymentService.createPaymentIntent(paymentData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Amount must be positive')
    })

    it('should validate currency', async () => {
      const paymentData: CreatePaymentRequest = {
        bookingId: 'booking-123',
        amount: 1000.00,
        currency: 'INVALID', // Invalid currency
        customerId: 'customer-123',
        paymentMethodId: 'pm_1234567890'
      }

      const result = await paymentService.createPaymentIntent(paymentData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid currency')
    })
  })

  describe('Confirm Payment', () => {
    it('should confirm payment successfully', async () => {
      const paymentIntentId = 'pi_1234567890'
      const mockStripePaymentIntent = {
        id: 'pi_1234567890',
        amount: 100000,
        currency: 'usd',
        status: 'succeeded',
        charges: {
          data: [{
            id: 'ch_1234567890',
            receipt_url: 'https://pay.stripe.com/receipts/1234567890'
          }]
        }
      }

      const mockUpdatedPayment = {
        id: 'payment-123',
        stripe_payment_intent_id: 'pi_1234567890',
        status: 'completed',
        processed_at: '2023-11-01T00:00:00Z'
      }

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockStripePaymentIntent)
      mockChain.single.mockResolvedValue({
        data: mockUpdatedPayment,
        error: null
      })

      const result = await paymentService.confirmPayment(paymentIntentId)

      expect(result.success).toBe(true)
      expect(result.payment).toBeDefined()
      expect(result.payment?.status).toBe('completed')
    })

    it('should handle payment confirmation errors', async () => {
      const paymentIntentId = 'pi_invalid'

      mockStripe.paymentIntents.retrieve.mockRejectedValue(new Error('Payment intent not found'))

      const result = await paymentService.confirmPayment(paymentIntentId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Payment intent not found')
    })
  })

  describe('Get Payment', () => {
    it('should get payment by ID successfully', async () => {
      const paymentId = 'payment-123'
      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        status: 'completed',
        created_at: '2023-11-01T00:00:00Z'
      }

      mockChain.single.mockResolvedValue({
        data: mockPayment,
        error: null
      })

      const result = await paymentService.getPayment(paymentId)

      expect(result.success).toBe(true)
      expect(result.payment).toBeDefined()
      expect(result.payment?.id).toBe('payment-123')
    })

    it('should handle payment not found', async () => {
      const paymentId = 'nonexistent-payment'

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Payment not found' }
      })

      const result = await paymentService.getPayment(paymentId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment not found')
    })
  })

  describe('Get Payments by Booking', () => {
    it('should get payments by booking successfully', async () => {
      const bookingId = 'booking-123'
      const mockPayments = [
        {
          id: 'payment-1',
          booking_id: 'booking-123',
          amount: 1000.00,
          status: 'completed'
        },
        {
          id: 'payment-2',
          booking_id: 'booking-123',
          amount: 200.00,
          status: 'completed'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockPayments,
        error: null
      })

      const result = await paymentService.getPaymentsByBooking(bookingId)

      expect(result.success).toBe(true)
      expect(result.payments).toHaveLength(2)
    })

    it('should handle no payments found', async () => {
      const bookingId = 'booking-123'

      mockChain.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await paymentService.getPaymentsByBooking(bookingId)

      expect(result.success).toBe(true)
      expect(result.payments).toHaveLength(0)
    })
  })

  describe('Create Refund', () => {
    it('should create refund successfully', async () => {
      const refundData: RefundRequest = {
        paymentId: 'payment-123',
        amount: 500.00,
        reason: 'requested_by_customer'
      }

      const mockStripeRefund = {
        id: 're_1234567890',
        amount: 50000, // Amount in cents
        currency: 'usd',
        status: 'succeeded',
        payment_intent: 'pi_1234567890'
      }

      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        payment_method: 'stripe',
        stripe_payment_intent_id: 'pi_1234567890',
        status: 'completed',
        created_at: '2023-11-01T00:00:00Z'
      }

      const mockRefundedPayment = {
        id: 'payment-123',
        amount: 1000.00,
        status: 'refunded'
      }

      // Mock getPayment method directly
      jest.spyOn(paymentService, 'getPayment').mockResolvedValue({
        success: true,
        payment: {
          id: 'payment-123',
          bookingId: 'booking-123',
          amount: 1000.00,
          currency: 'USD',
          paymentMethod: 'stripe',
          stripePaymentIntentId: 'pi_1234567890',
          status: 'completed',
          createdAt: '2023-11-01T00:00:00Z'
        }
      })

      // Mock Stripe refund
      mockStripe.refunds.create.mockResolvedValue(mockStripeRefund)

      // Mock payment status update
      mockChain.eq.mockResolvedValue({
        data: mockRefundedPayment,
        error: null
      })

      const result = await paymentService.createRefund(refundData)

      expect(result.success).toBe(true)
      expect(result.refund).toBeDefined()
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_1234567890',
        amount: 50000,
        reason: 'requested_by_customer'
      })
    })

    it('should handle refund errors', async () => {
      const refundData: RefundRequest = {
        paymentId: 'payment-123',
        amount: 500.00,
        reason: 'requested_by_customer'
      }

      const mockPayment = {
        id: 'payment-123',
        booking_id: 'booking-123',
        amount: 1000.00,
        currency: 'USD',
        payment_method: 'stripe',
        stripe_payment_intent_id: 'pi_1234567890',
        status: 'completed',
        created_at: '2023-11-01T00:00:00Z'
      }

      // Mock getPayment call
      mockChain.single.mockResolvedValueOnce({
        data: mockPayment,
        error: null
      })

      // Mock Stripe refund error
      mockStripe.refunds.create.mockRejectedValue(new Error('Refund failed'))

      const result = await paymentService.createRefund(refundData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Refund failed')
    })

    it('should validate refund amount', async () => {
      const refundData: RefundRequest = {
        paymentId: 'payment-123',
        amount: -100.00, // Invalid amount
        reason: 'requested_by_customer'
      }

      const result = await paymentService.createRefund(refundData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Refund amount must be positive')
    })
  })

  describe('Update Payment Status', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'payment-123'
      const status = 'completed'

      mockChain.single.mockResolvedValue({
        data: { id: 'payment-123', status: 'completed' },
        error: null
      })

      const result = await paymentService.updatePaymentStatus(paymentId, status)

      expect(result.success).toBe(true)
    })

    it('should validate status value', async () => {
      const paymentId = 'payment-123'
      const status = 'invalid-status' as any

      const result = await paymentService.updatePaymentStatus(paymentId, status)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid status')
    })
  })
})
