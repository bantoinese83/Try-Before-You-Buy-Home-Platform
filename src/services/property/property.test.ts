import { PropertyService, Property, CreatePropertyRequest, UpdatePropertyRequest, PropertySearchFilters } from './property'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('PropertyService', () => {
  let propertyService: PropertyService
  let mockChain: any

  beforeEach(() => {
    propertyService = new PropertyService()
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

  describe('Create Property', () => {
    it('should create a new property successfully', async () => {
      const propertyData: CreatePropertyRequest = {
        ownerId: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property with ocean views',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        latitude: 25.7617,
        longitude: -80.1918,
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 2000,
        pricePerNight: 250.00,
        maxGuests: 6,
        amenities: ['wifi', 'pool', 'parking'],
        houseRules: 'No smoking, no pets'
      }

      const mockProperty = {
        id: 'property-123',
        owner_id: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property with ocean views',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip_code: '33101',
        latitude: 25.7617,
        longitude: -80.1918,
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        square_feet: 2000,
        price_per_night: 250.00,
        max_guests: 6,
        amenities: ['wifi', 'pool', 'parking'],
        house_rules: 'No smoking, no pets',
        status: 'draft',
        is_featured: false,
        created_at: '2023-01-01T00:00:00Z'
      }

      mockChain.single.mockResolvedValue({
        data: mockProperty,
        error: null
      })

      const result = await propertyService.createProperty(propertyData)

      expect(result.success).toBe(true)
      expect(result.property).toEqual({
        id: 'property-123',
        ownerId: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property with ocean views',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        latitude: 25.7617,
        longitude: -80.1918,
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        squareFeet: 2000,
        pricePerNight: 250.00,
        maxGuests: 6,
        amenities: ['wifi', 'pool', 'parking'],
        houseRules: 'No smoking, no pets',
        status: 'draft',
        isFeatured: false,
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should validate required fields', async () => {
      const propertyData: CreatePropertyRequest = {
        ownerId: '',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        pricePerNight: 250.00,
        maxGuests: 6
      }

      const result = await propertyService.createProperty(propertyData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Owner ID is required')
    })

    it('should validate property type', async () => {
      const propertyData: CreatePropertyRequest = {
        ownerId: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        propertyType: 'invalid-type' as any,
        bedrooms: 3,
        bathrooms: 2.5,
        pricePerNight: 250.00,
        maxGuests: 6
      }

      const result = await propertyService.createProperty(propertyData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid property type')
    })

    it('should validate price range', async () => {
      const propertyData: CreatePropertyRequest = {
        ownerId: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33101',
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        pricePerNight: -100.00,
        maxGuests: 6
      }

      const result = await propertyService.createProperty(propertyData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Price per night must be positive')
    })
  })

  describe('Get Property', () => {
    it('should get property by ID successfully', async () => {
      const propertyId = 'property-123'
      const mockProperty = {
        id: 'property-123',
        owner_id: 'owner-123',
        title: 'Beautiful Beach House',
        description: 'A stunning beachfront property',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip_code: '33101',
        property_type: 'house',
        bedrooms: 3,
        bathrooms: 2.5,
        price_per_night: 250.00,
        max_guests: 6,
        status: 'active',
        is_featured: false,
        created_at: '2023-01-01T00:00:00Z'
      }

      mockChain.single.mockResolvedValue({
        data: mockProperty,
        error: null
      })

      const result = await propertyService.getProperty(propertyId)

      expect(result.success).toBe(true)
      expect(result.property).toBeDefined()
      expect(result.property?.id).toBe('property-123')
    })

    it('should handle property not found', async () => {
      const propertyId = 'nonexistent-property'

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Property not found' }
      })

      const result = await propertyService.getProperty(propertyId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Property not found')
    })
  })

  describe('Update Property', () => {
    it('should update property successfully', async () => {
      const propertyId = 'property-123'
      const updateData: UpdatePropertyRequest = {
        title: 'Updated Beach House',
        description: 'Updated description',
        pricePerNight: 300.00
      }

      const mockUpdatedProperty = {
        id: 'property-123',
        owner_id: 'owner-123',
        title: 'Updated Beach House',
        description: 'Updated description',
        price_per_night: 300.00,
        status: 'active'
      }

      mockChain.single.mockResolvedValue({
        data: mockUpdatedProperty,
        error: null
      })

      const result = await propertyService.updateProperty(propertyId, updateData)

      expect(result.success).toBe(true)
      expect(result.property).toBeDefined()
      expect(result.property?.title).toBe('Updated Beach House')
    })

    it('should handle update errors', async () => {
      const propertyId = 'property-123'
      const updateData: UpdatePropertyRequest = {
        title: 'Updated Beach House'
      }

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      const result = await propertyService.updateProperty(propertyId, updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('Delete Property', () => {
    it('should delete property successfully', async () => {
      const propertyId = 'property-123'

      mockChain.eq.mockResolvedValue({
        data: null,
        error: null
      })

      const result = await propertyService.deleteProperty(propertyId)

      expect(result.success).toBe(true)
    })

    it('should handle delete errors', async () => {
      const propertyId = 'property-123'

      mockChain.eq.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' }
      })

      const result = await propertyService.deleteProperty(propertyId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delete failed')
    })
  })

  describe('Search Properties', () => {
    it('should search properties with filters successfully', async () => {
      const filters: PropertySearchFilters = {
        city: 'Miami',
        state: 'FL',
        minPrice: 100,
        maxPrice: 500,
        bedrooms: 2,
        propertyType: 'house'
      }

      const mockProperties = [
        {
          id: 'property-1',
          title: 'Beach House 1',
          city: 'Miami',
          state: 'FL',
          price_per_night: 250.00,
          bedrooms: 3,
          property_type: 'house'
        },
        {
          id: 'property-2',
          title: 'Beach House 2',
          city: 'Miami',
          state: 'FL',
          price_per_night: 300.00,
          bedrooms: 2,
          property_type: 'house'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockProperties,
        error: null
      })

      const result = await propertyService.searchProperties(filters)

      expect(result.success).toBe(true)
      expect(result.properties).toHaveLength(2)
    })

    it('should search properties by location', async () => {
      const filters: PropertySearchFilters = {
        city: 'Miami',
        state: 'FL'
      }

      const mockProperties = [
        {
          id: 'property-1',
          title: 'Miami Property',
          city: 'Miami',
          state: 'FL'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockProperties,
        error: null
      })

      const result = await propertyService.searchProperties(filters)

      expect(result.success).toBe(true)
      expect(result.properties).toHaveLength(1)
    })

    it('should handle search errors', async () => {
      const filters: PropertySearchFilters = {
        city: 'Miami'
      }

      mockChain.order.mockResolvedValue({
        data: null,
        error: { message: 'Search failed' }
      })

      const result = await propertyService.searchProperties(filters)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search failed')
    })
  })

  describe('Get Properties by Owner', () => {
    it('should get properties by owner successfully', async () => {
      const ownerId = 'owner-123'
      const mockProperties = [
        {
          id: 'property-1',
          owner_id: 'owner-123',
          title: 'Property 1',
          status: 'active'
        },
        {
          id: 'property-2',
          owner_id: 'owner-123',
          title: 'Property 2',
          status: 'draft'
        }
      ]

      mockChain.order.mockResolvedValue({
        data: mockProperties,
        error: null
      })

      const result = await propertyService.getPropertiesByOwner(ownerId)

      expect(result.success).toBe(true)
      expect(result.properties).toHaveLength(2)
    })

    it('should handle no properties found', async () => {
      const ownerId = 'owner-123'

      mockChain.order.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await propertyService.getPropertiesByOwner(ownerId)

      expect(result.success).toBe(true)
      expect(result.properties).toHaveLength(0)
    })
  })

  describe('Update Property Status', () => {
    it('should update property status successfully', async () => {
      const propertyId = 'property-123'
      const status = 'active'

      mockChain.single.mockResolvedValue({
        data: { id: 'property-123', status: 'active' },
        error: null
      })

      const result = await propertyService.updatePropertyStatus(propertyId, status)

      expect(result.success).toBe(true)
    })

    it('should validate status value', async () => {
      const propertyId = 'property-123'
      const status = 'invalid-status' as any

      const result = await propertyService.updatePropertyStatus(propertyId, status)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid status')
    })
  })
})
