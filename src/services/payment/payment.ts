import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Types
export interface Payment {
  id: string
  bookingId: string
  amount: number
  currency: string
  paymentMethod: string
  stripePaymentIntentId?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processedAt?: string
  createdAt: string
}

export interface CreatePaymentRequest {
  bookingId: string
  amount: number
  currency: string
  customerId: string
  paymentMethodId: string
}

export interface RefundRequest {
  paymentId: string
  amount: number
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer'
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  payment?: Payment
  payments?: Payment[]
  refund?: any
  error?: string
}

export class PaymentService {
  private supabase
  private stripe: Stripe

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    })
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(paymentData: CreatePaymentRequest): Promise<ServiceResponse<Payment>> {
    try {
      // Validate input
      const validation = this.validatePaymentData(paymentData)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency.toLowerCase(),
        customer: paymentData.customerId,
        payment_method: paymentData.paymentMethodId,
        confirmation_method: 'manual',
        confirm: true
      })

      // Create payment record in database
      const { data, error } = await this.supabase
        .from('payments')
        .insert({
          booking_id: paymentData.bookingId,
          amount: paymentData.amount,
          currency: paymentData.currency.toUpperCase(),
          payment_method: 'stripe',
          stripe_payment_intent_id: paymentIntent.id,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        payment: this.mapDatabasePaymentToPayment(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentIntentId: string): Promise<ServiceResponse<Payment>> {
    try {
      if (!paymentIntentId) {
        return { success: false, error: 'Payment intent ID is required' }
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database
        const { data, error } = await this.supabase
          .from('payments')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntentId)
          .select()
          .single()

        if (error) {
          return { success: false, error: error.message }
        }

        return {
          success: true,
          payment: this.mapDatabasePaymentToPayment(data)
        }
      } else {
        return {
          success: false,
          error: `Payment not completed. Status: ${paymentIntent.status}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<ServiceResponse<Payment>> {
    try {
      if (!paymentId) {
        return { success: false, error: 'Payment ID is required' }
      }

      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'Payment not found' }
      }

      return {
        success: true,
        payment: this.mapDatabasePaymentToPayment(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get payments by booking
   */
  async getPaymentsByBooking(bookingId: string): Promise<ServiceResponse<Payment[]>> {
    try {
      if (!bookingId) {
        return { success: false, error: 'Booking ID is required' }
      }

      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        payments: data?.map(payment => this.mapDatabasePaymentToPayment(payment)) || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Create refund
   */
  async createRefund(refundData: RefundRequest): Promise<ServiceResponse<any>> {
    try {
      // Validate input
      if (!refundData.paymentId) {
        return { success: false, error: 'Payment ID is required' }
      }

      if (refundData.amount <= 0) {
        return { success: false, error: 'Refund amount must be positive' }
      }

      if (!['duplicate', 'fraudulent', 'requested_by_customer'].includes(refundData.reason)) {
        return { success: false, error: 'Invalid refund reason' }
      }

      // Get payment details
      const paymentResponse = await this.getPayment(refundData.paymentId)
      if (!paymentResponse.success || !paymentResponse.payment) {
        return { success: false, error: 'Payment not found' }
      }

      if (!paymentResponse.payment.stripePaymentIntentId) {
        return { success: false, error: 'Payment does not have a Stripe payment intent' }
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentResponse.payment.stripePaymentIntentId,
        amount: Math.round(refundData.amount * 100), // Convert to cents
        reason: refundData.reason
      })

      // Update payment status in database
      const { error } = await this.supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', refundData.paymentId)

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100, // Convert back to dollars
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<ServiceResponse> {
    try {
      if (!paymentId) {
        return { success: false, error: 'Payment ID is required' }
      }

      if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        return { success: false, error: 'Invalid status' }
      }

      const updateData: any = { status }
      if (status === 'completed') {
        updateData.processed_at = new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get payment by Stripe payment intent ID
   */
  async getPaymentByStripeIntentId(paymentIntentId: string): Promise<ServiceResponse<Payment>> {
    try {
      if (!paymentIntentId) {
        return { success: false, error: 'Payment intent ID is required' }
      }

      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'Payment not found' }
      }

      return {
        success: true,
        payment: this.mapDatabasePaymentToPayment(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Validate payment data
   */
  private validatePaymentData(paymentData: CreatePaymentRequest): { isValid: boolean; error?: string } {
    if (!paymentData.bookingId) {
      return { isValid: false, error: 'Booking ID is required' }
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return { isValid: false, error: 'Amount must be positive' }
    }

    if (!paymentData.currency) {
      return { isValid: false, error: 'Currency is required' }
    }

    if (!this.isValidCurrency(paymentData.currency)) {
      return { isValid: false, error: 'Invalid currency' }
    }

    if (!paymentData.customerId) {
      return { isValid: false, error: 'Customer ID is required' }
    }

    if (!paymentData.paymentMethodId) {
      return { isValid: false, error: 'Payment method ID is required' }
    }

    return { isValid: true }
  }

  /**
   * Validate currency code
   */
  private isValidCurrency(currency: string): boolean {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'SEK', 'NZD']
    return validCurrencies.includes(currency.toUpperCase())
  }

  /**
   * Map database payment to Payment interface
   */
  private mapDatabasePaymentToPayment(dbPayment: any): Payment {
    return {
      id: dbPayment.id,
      bookingId: dbPayment.booking_id,
      amount: dbPayment.amount,
      currency: dbPayment.currency,
      paymentMethod: dbPayment.payment_method,
      stripePaymentIntentId: dbPayment.stripe_payment_intent_id,
      status: dbPayment.status,
      processedAt: dbPayment.processed_at,
      createdAt: dbPayment.created_at
    }
  }
}
