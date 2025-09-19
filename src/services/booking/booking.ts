import { createClient } from '@supabase/supabase-js'

// Types
export interface Booking {
  id: string
  propertyId: string
  buyerId: string
  checkInDate: string
  checkOutDate: string
  guests: number
  totalAmount: number
  securityDeposit?: number
  cleaningFee?: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  specialRequests?: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookingRequest {
  propertyId: string
  buyerId: string
  checkInDate: string
  checkOutDate: string
  guests: number
  totalAmount: number
  securityDeposit?: number
  cleaningFee?: number
  specialRequests?: string
}

export interface UpdateBookingRequest {
  guests?: number
  specialRequests?: string
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  booking?: Booking
  bookings?: Booking[]
  isAvailable?: boolean
  error?: string
}

export class BookingService {
  private supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: CreateBookingRequest): Promise<ServiceResponse<Booking>> {
    try {
      // Validate input
      const validation = this.validateBookingData(bookingData)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Check property availability
      const availabilityCheck = await this.checkPropertyAvailability(
        bookingData.propertyId,
        bookingData.checkInDate,
        bookingData.checkOutDate
      )

      if (!availabilityCheck.success) {
        return { success: false, error: availabilityCheck.error }
      }

      if (!availabilityCheck.isAvailable) {
        return { success: false, error: 'Property is not available for the selected dates' }
      }

      // Create booking
      const { data, error } = await this.supabase
        .from('bookings')
        .insert({
          property_id: bookingData.propertyId,
          buyer_id: bookingData.buyerId,
          check_in_date: bookingData.checkInDate,
          check_out_date: bookingData.checkOutDate,
          guests: bookingData.guests,
          total_amount: bookingData.totalAmount,
          security_deposit: bookingData.securityDeposit || 0,
          cleaning_fee: bookingData.cleaningFee || 0,
          special_requests: bookingData.specialRequests,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        booking: this.mapDatabaseBookingToBooking(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<ServiceResponse<Booking>> {
    try {
      if (!bookingId) {
        return { success: false, error: 'Booking ID is required' }
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'Booking not found' }
      }

      return {
        success: true,
        booking: this.mapDatabaseBookingToBooking(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, updateData: UpdateBookingRequest): Promise<ServiceResponse<Booking>> {
    try {
      if (!bookingId) {
        return { success: false, error: 'Booking ID is required' }
      }

      // Validate update data
      if (updateData.guests !== undefined && updateData.guests <= 0) {
        return { success: false, error: 'Guests must be at least 1' }
      }

      // Prepare update object
      const updateObject: any = {}
      if (updateData.guests !== undefined) updateObject.guests = updateData.guests
      if (updateData.specialRequests !== undefined) updateObject.special_requests = updateData.specialRequests

      const { data, error } = await this.supabase
        .from('bookings')
        .update(updateObject)
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        booking: this.mapDatabaseBookingToBooking(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string): Promise<ServiceResponse> {
    try {
      if (!bookingId) {
        return { success: false, error: 'Booking ID is required' }
      }

      const { error } = await this.supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

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
   * Get bookings by user
   */
  async getBookingsByUser(userId: string): Promise<ServiceResponse<Booking[]>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' }
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        bookings: data?.map(booking => this.mapDatabaseBookingToBooking(booking)) || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get bookings by property
   */
  async getBookingsByProperty(propertyId: string): Promise<ServiceResponse<Booking[]>> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        bookings: data?.map(booking => this.mapDatabaseBookingToBooking(booking)) || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Check property availability
   */
  async checkPropertyAvailability(propertyId: string, checkInDate: string, checkOutDate: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      if (!checkInDate || !checkOutDate) {
        return { success: false, error: 'Check-in and check-out dates are required' }
      }

      // Validate date range
      const checkIn = new Date(checkInDate)
      const checkOut = new Date(checkOutDate)

      if (checkOut <= checkIn) {
        return { success: false, error: 'Check-out date must be after check-in date' }
      }

      // Check for conflicting bookings
      const { data, error } = await this.supabase
        .from('bookings')
        .select('id, check_in_date, check_out_date, status')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .order('check_in_date', { ascending: true })

      if (error) {
        return { success: false, error: error.message }
      }

      // Check for date conflicts
      const hasConflict = data?.some(booking => {
        const bookingCheckIn = new Date(booking.check_in_date)
        const bookingCheckOut = new Date(booking.check_out_date)

        // Check if the requested dates overlap with existing booking
        return (
          (checkIn < bookingCheckOut && checkOut > bookingCheckIn)
        )
      }) || false

      return {
        success: true,
        isAvailable: !hasConflict
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Promise<ServiceResponse> {
    try {
      if (!bookingId) {
        return { success: false, error: 'Booking ID is required' }
      }

      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return { success: false, error: 'Invalid status' }
      }

      const { error } = await this.supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

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
   * Get property availability calendar
   */
  async getPropertyAvailabilityCalendar(propertyId: string, startDate: string, endDate: string): Promise<ServiceResponse<any[]>> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      const { data, error } = await this.supabase
        .from('bookings')
        .select('check_in_date, check_out_date, status')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'confirmed'])
        .gte('check_in_date', startDate)
        .lte('check_out_date', endDate)
        .order('check_in_date', { ascending: true })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Validate booking data
   */
  private validateBookingData(bookingData: CreateBookingRequest): { isValid: boolean; error?: string } {
    if (!bookingData.propertyId) {
      return { isValid: false, error: 'Property ID is required' }
    }

    if (!bookingData.buyerId) {
      return { isValid: false, error: 'Buyer ID is required' }
    }

    if (!bookingData.checkInDate) {
      return { isValid: false, error: 'Check-in date is required' }
    }

    if (!bookingData.checkOutDate) {
      return { isValid: false, error: 'Check-out date is required' }
    }

    // Validate date range
    const checkIn = new Date(bookingData.checkInDate)
    const checkOut = new Date(bookingData.checkOutDate)

    if (checkOut <= checkIn) {
      return { isValid: false, error: 'Check-out date must be after check-in date' }
    }

    // Check if dates are in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkIn < today) {
      return { isValid: false, error: 'Check-in date must be in the future' }
    }

    if (bookingData.guests <= 0) {
      return { isValid: false, error: 'Guests must be at least 1' }
    }

    if (bookingData.totalAmount <= 0) {
      return { isValid: false, error: 'Total amount must be positive' }
    }

    return { isValid: true }
  }

  /**
   * Map database booking to Booking interface
   */
  private mapDatabaseBookingToBooking(dbBooking: any): Booking {
    return {
      id: dbBooking.id,
      propertyId: dbBooking.property_id,
      buyerId: dbBooking.buyer_id,
      checkInDate: dbBooking.check_in_date,
      checkOutDate: dbBooking.check_out_date,
      guests: dbBooking.guests,
      totalAmount: dbBooking.total_amount,
      securityDeposit: dbBooking.security_deposit,
      cleaningFee: dbBooking.cleaning_fee,
      status: dbBooking.status,
      specialRequests: dbBooking.special_requests,
      createdAt: dbBooking.created_at,
      updatedAt: dbBooking.updated_at
    }
  }
}
