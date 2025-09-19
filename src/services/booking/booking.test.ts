import { BookingService, Booking, CreateBookingRequest, UpdateBookingRequest } from './booking'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('BookingService', () => {
  let bookingService: BookingService
  let mockChain: any

  beforeEach(() => {
    bookingService = new BookingService()
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

  describe('Create Booking', () => {
    it('should create a new booking successfully', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const futureDate2 = new Date()
      futureDate2.setDate(futureDate2.getDate() + 35)
      const futureDate2Str = futureDate2.toISOString().split('T')[0]

      const bookingData: CreateBookingRequest = {
        propertyId: 'property-123',
        buyerId: 'buyer-123',
        checkInDate: futureDateStr,
        checkOutDate: futureDate2Str,
        guests: 2,
        totalAmount: 1000.00,
        specialRequests: 'Late check-in please'
      }

      const mockBooking = {
        id: 'booking-123',
        property_id: 'property-123',
        buyer_id: 'buyer-123',
        check_in_date: futureDateStr,
        check_out_date: futureDate2Str,
        guests: 2,
        total_amount: 1000.00,
        security_deposit: 200.00,
        cleaning_fee: 50.00,
        status: 'pending',
        special_requests: 'Late check-in please',
        created_at: '2023-11-01T00:00:00Z'
      }

      // Mock availability check (no conflicting bookings)
      mockChain.order.mockResolvedValueOnce({
        data: [],
        error: null
      })

      // Mock booking creation
      mockChain.single.mockResolvedValue({
        data: mockBooking,
        error: null
      })

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(true)
      expect(result.booking).toEqual({
        id: 'booking-123',
        propertyId: 'property-123',
        buyerId: 'buyer-123',
        checkInDate: futureDateStr,
        checkOutDate: futureDate2Str,
        guests: 2,
        totalAmount: 1000.00,
        securityDeposit: 200.00,
        cleaningFee: 50.00,
        status: 'pending',
        specialRequests: 'Late check-in please',
        createdAt: '2023-11-01T00:00:00Z',
        updatedAt: undefined
      })
    })

    it('should validate required fields', async () => {
      const bookingData: CreateBookingRequest = {
        propertyId: '',
        buyerId: 'buyer-123',
        checkInDate: '2023-12-01',
        checkOutDate: '2023-12-05',
        guests: 2,
        totalAmount: 1000.00
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Property ID is required')
    })

    it('should validate date range', async () => {
      const bookingData: CreateBookingRequest = {
        propertyId: 'property-123',
        buyerId: 'buyer-123',
        checkInDate: '2023-12-05',
        checkOutDate: '2023-12-01', // Check-out before check-in
        guests: 2,
        totalAmount: 1000.00
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Check-out date must be after check-in date')
    })

    it('should validate guest count', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const futureDate2 = new Date()
      futureDate2.setDate(futureDate2.getDate() + 35)
      const futureDate2Str = futureDate2.toISOString().split('T')[0]

      const bookingData: CreateBookingRequest = {
        propertyId: 'property-123',
        buyerId: 'buyer-123',
        checkInDate: futureDateStr,
        checkOutDate: futureDate2Str,
        guests: 0, // Invalid guest count
        totalAmount: 1000.00
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Guests must be at least 1')
    })

    it('should validate total amount', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      
      const futureDate2 = new Date()
      futureDate2.setDate(futureDate2.getDate() + 35)
      const futureDate2Str = futureDate2.toISOString().split('T')[0]

      const bookingData: CreateBookingRequest = {
        propertyId: 'property-123',
        buyerId: 'buyer-123',
        checkInDate: futureDateStr,
        checkOutDate: futureDate2Str,
        guests: 2,
        totalAmount: -100.00 // Invalid amount
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Total amount must be positive')
    })
  })

  describe('Get Booking', () => {
    it('should get booking by ID successfully', async () => {
      const bookingId = 'booking-123'
      const mockBooking = {
        id: 'booking-123',
        property_id: 'property-123',
        buyer_id: 'buyer-123',
        check_in_date: '2023-12-01',
        check_out_date: '2023-12-05',
        guests: 2,
        total_amount: 1000.00,
        status: 'confirmed',
        created_at: '2023-11-01T00:00:00Z'
      }

      mockChain.single.mockResolvedValue({
        data: mockBooking,
        error: null
      })

      const result = await bookingService.getBooking(bookingId)

      expect(result.success).toBe(true)
      expect(result.booking).toBeDefined()
      expect(result.booking?.id).toBe('booking-123')
    })

    it('should handle booking not found', async () => {
      const bookingId = 'nonexistent-booking'

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Booking not found' }
      })

      const result = await bookingService.getBooking(bookingId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Booking not found')
    })
  })

  describe('Update Booking', () => {
    it('should update booking successfully', async () => {
      const bookingId = 'booking-123'
      const updateData: UpdateBookingRequest = {
        guests: 4,
        specialRequests: 'Updated special requests'
      }

      const mockUpdatedBooking = {
        id: 'booking-123',
        property_id: 'property-123',
        buyer_id: 'buyer-123',
        guests: 4,
        special_requests: 'Updated special requests',
        status: 'pending'
      }

      mockChain.single.mockResolvedValue({
        data: mockUpdatedBooking,
        error: null
      })

      const result = await bookingService.updateBooking(bookingId, updateData)

      expect(result.success).toBe(true)
      expect(result.booking).toBeDefined()
      expect(result.booking?.guests).toBe(4)
    })

    it('should handle update errors', async () => {
      const bookingId = 'booking-123'
      const updateData: UpdateBookingRequest = {
        guests: 4
      }

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      const result = await bookingService.updateBooking(bookingId, updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('Cancel Booking', () => {
    it('should cancel booking successfully', async () => {
      const bookingId = 'booking-123'

      mockChain.single.mockResolvedValue({
        data: { id: 'booking-123', status: 'cancelled' },
        error: null
      })

      const result = await bookingService.cancelBooking(bookingId)

      expect(result.success).toBe(true)
    })

    it('should handle cancel errors', async () => {
      const bookingId = 'booking-123'

      mockChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Cancel failed' }
      })

      const result = await bookingService.cancelBooking(bookingId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cancel failed')
    })
  })

  describe('Get Bookings by User', () => {
    it('should get bookings by user successfully', async () => {
      const userId = 'buyer-123'
      const mockBookings = [
        {
          id: 'booking-1',
          property_id: 'property-1',
          buyer_id: 'buyer-123',
          status: 'confirmed',
          check_in_date: '2023-12-01',
          check_out_date: '2023-12-05'
        },
        {
          id: 'booking-2',
          property_id: 'property-2',
          buyer_id: 'buyer-123',
          status: 'pending',
          check_in_date: '2023-12-10',
          check_out_date: '2023-12-15'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockBookings,
        error: null
      })

      const result = await bookingService.getBookingsByUser(userId)

      expect(result.success).toBe(true)
      expect(result.bookings).toHaveLength(2)
    })

    it('should handle no bookings found', async () => {
      const userId = 'buyer-123'

      mockChain.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await bookingService.getBookingsByUser(userId)

      expect(result.success).toBe(true)
      expect(result.bookings).toHaveLength(0)
    })
  })

  describe('Get Bookings by Property', () => {
    it('should get bookings by property successfully', async () => {
      const propertyId = 'property-123'
      const mockBookings = [
        {
          id: 'booking-1',
          property_id: 'property-123',
          buyer_id: 'buyer-1',
          status: 'confirmed',
          check_in_date: '2023-12-01',
          check_out_date: '2023-12-05'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockBookings,
        error: null
      })

      const result = await bookingService.getBookingsByProperty(propertyId)

      expect(result.success).toBe(true)
      expect(result.bookings).toHaveLength(1)
    })
  })

  describe('Check Property Availability', () => {
    it('should check property availability successfully', async () => {
      const propertyId = 'property-123'
      const checkInDate = '2023-12-01'
      const checkOutDate = '2023-12-05'

      mockChain.order.mockResolvedValue({
        data: [], // No conflicting bookings
        error: null
      })

      const result = await bookingService.checkPropertyAvailability(propertyId, checkInDate, checkOutDate)

      expect(result.success).toBe(true)
      expect(result.isAvailable).toBe(true)
    })

    it('should detect property unavailability', async () => {
      const propertyId = 'property-123'
      const checkInDate = '2023-12-01'
      const checkOutDate = '2023-12-05'

      const mockConflictingBookings = [
        {
          id: 'booking-1',
          property_id: 'property-123',
          check_in_date: '2023-12-02',
          check_out_date: '2023-12-04',
          status: 'confirmed'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockConflictingBookings,
        error: null
      })

      const result = await bookingService.checkPropertyAvailability(propertyId, checkInDate, checkOutDate)

      expect(result.success).toBe(true)
      expect(result.isAvailable).toBe(false)
    })

    it('should validate date range for availability check', async () => {
      const propertyId = 'property-123'
      const checkInDate = '2023-12-05'
      const checkOutDate = '2023-12-01' // Invalid date range

      const result = await bookingService.checkPropertyAvailability(propertyId, checkInDate, checkOutDate)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Check-out date must be after check-in date')
    })
  })

  describe('Update Booking Status', () => {
    it('should update booking status successfully', async () => {
      const bookingId = 'booking-123'
      const status = 'confirmed'

      mockChain.single.mockResolvedValue({
        data: { id: 'booking-123', status: 'confirmed' },
        error: null
      })

      const result = await bookingService.updateBookingStatus(bookingId, status)

      expect(result.success).toBe(true)
    })

    it('should validate status value', async () => {
      const bookingId = 'booking-123'
      const status = 'invalid-status' as any

      const result = await bookingService.updateBookingStatus(bookingId, status)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid status')
    })
  })
})
