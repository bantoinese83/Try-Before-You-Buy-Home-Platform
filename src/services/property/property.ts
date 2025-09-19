import { createClient } from '@supabase/supabase-js'

// Types
export interface Property {
  id: string
  ownerId: string
  title: string
  description?: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  latitude?: number
  longitude?: number
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'other'
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  lotSize?: number
  yearBuilt?: number
  pricePerNight: number
  securityDeposit?: number
  cleaningFee?: number
  maxGuests: number
  amenities: string[]
  houseRules?: string
  status: 'active' | 'inactive' | 'draft' | 'archived'
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePropertyRequest {
  ownerId: string
  title: string
  description?: string
  address: string
  city: string
  state: string
  zipCode: string
  country?: string
  latitude?: number
  longitude?: number
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'other'
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  lotSize?: number
  yearBuilt?: number
  pricePerNight: number
  securityDeposit?: number
  cleaningFee?: number
  maxGuests: number
  amenities?: string[]
  houseRules?: string
}

export interface UpdatePropertyRequest {
  title?: string
  description?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  latitude?: number
  longitude?: number
  propertyType?: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'other'
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  lotSize?: number
  yearBuilt?: number
  pricePerNight?: number
  securityDeposit?: number
  cleaningFee?: number
  maxGuests?: number
  amenities?: string[]
  houseRules?: string
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  isFeatured?: boolean
}

export interface PropertySearchFilters {
  city?: string
  state?: string
  country?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'other'
  amenities?: string[]
  minSquareFeet?: number
  maxSquareFeet?: number
  isFeatured?: boolean
  status?: 'active' | 'inactive' | 'draft' | 'archived'
  limit?: number
  offset?: number
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  property?: Property
  properties?: Property[]
  error?: string
}

export class PropertyService {
  private supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Create a new property
   */
  async createProperty(propertyData: CreatePropertyRequest): Promise<ServiceResponse<Property>> {
    try {
      // Validate input
      const validation = this.validatePropertyData(propertyData)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Create property
      const { data, error } = await this.supabase
        .from('properties')
        .insert({
          owner_id: propertyData.ownerId,
          title: propertyData.title,
          description: propertyData.description,
          address: propertyData.address,
          city: propertyData.city,
          state: propertyData.state,
          zip_code: propertyData.zipCode,
          country: propertyData.country || 'US',
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          property_type: propertyData.propertyType,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          square_feet: propertyData.squareFeet,
          lot_size: propertyData.lotSize,
          year_built: propertyData.yearBuilt,
          price_per_night: propertyData.pricePerNight,
          security_deposit: propertyData.securityDeposit || 0,
          cleaning_fee: propertyData.cleaningFee || 0,
          max_guests: propertyData.maxGuests,
          amenities: propertyData.amenities || [],
          house_rules: propertyData.houseRules,
          status: 'draft'
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        property: this.mapDatabasePropertyToProperty(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get property by ID
   */
  async getProperty(propertyId: string): Promise<ServiceResponse<Property>> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      const { data, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'Property not found' }
      }

      return {
        success: true,
        property: this.mapDatabasePropertyToProperty(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update property
   */
  async updateProperty(propertyId: string, updateData: UpdatePropertyRequest): Promise<ServiceResponse<Property>> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      // Validate update data
      if (updateData.pricePerNight !== undefined && updateData.pricePerNight <= 0) {
        return { success: false, error: 'Price per night must be positive' }
      }

      if (updateData.bedrooms !== undefined && updateData.bedrooms < 0) {
        return { success: false, error: 'Bedrooms must be non-negative' }
      }

      if (updateData.bathrooms !== undefined && updateData.bathrooms < 0) {
        return { success: false, error: 'Bathrooms must be non-negative' }
      }

      if (updateData.maxGuests !== undefined && updateData.maxGuests <= 0) {
        return { success: false, error: 'Max guests must be positive' }
      }

      // Prepare update object
      const updateObject: any = {}
      if (updateData.title !== undefined) updateObject.title = updateData.title
      if (updateData.description !== undefined) updateObject.description = updateData.description
      if (updateData.address !== undefined) updateObject.address = updateData.address
      if (updateData.city !== undefined) updateObject.city = updateData.city
      if (updateData.state !== undefined) updateObject.state = updateData.state
      if (updateData.zipCode !== undefined) updateObject.zip_code = updateData.zipCode
      if (updateData.country !== undefined) updateObject.country = updateData.country
      if (updateData.latitude !== undefined) updateObject.latitude = updateData.latitude
      if (updateData.longitude !== undefined) updateObject.longitude = updateData.longitude
      if (updateData.propertyType !== undefined) updateObject.property_type = updateData.propertyType
      if (updateData.bedrooms !== undefined) updateObject.bedrooms = updateData.bedrooms
      if (updateData.bathrooms !== undefined) updateObject.bathrooms = updateData.bathrooms
      if (updateData.squareFeet !== undefined) updateObject.square_feet = updateData.squareFeet
      if (updateData.lotSize !== undefined) updateObject.lot_size = updateData.lotSize
      if (updateData.yearBuilt !== undefined) updateObject.year_built = updateData.yearBuilt
      if (updateData.pricePerNight !== undefined) updateObject.price_per_night = updateData.pricePerNight
      if (updateData.securityDeposit !== undefined) updateObject.security_deposit = updateData.securityDeposit
      if (updateData.cleaningFee !== undefined) updateObject.cleaning_fee = updateData.cleaningFee
      if (updateData.maxGuests !== undefined) updateObject.max_guests = updateData.maxGuests
      if (updateData.amenities !== undefined) updateObject.amenities = updateData.amenities
      if (updateData.houseRules !== undefined) updateObject.house_rules = updateData.houseRules
      if (updateData.status !== undefined) updateObject.status = updateData.status
      if (updateData.isFeatured !== undefined) updateObject.is_featured = updateData.isFeatured

      const { data, error } = await this.supabase
        .from('properties')
        .update(updateObject)
        .eq('id', propertyId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        property: this.mapDatabasePropertyToProperty(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Delete property
   */
  async deleteProperty(propertyId: string): Promise<ServiceResponse> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      const { error } = await this.supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

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
   * Search properties with filters
   */
  async searchProperties(filters: PropertySearchFilters): Promise<ServiceResponse<Property[]>> {
    try {
      let query = this.supabase
        .from('properties')
        .select('*')

      // Apply filters
      if (filters.city) {
        query = query.eq('city', filters.city)
      }

      if (filters.state) {
        query = query.eq('state', filters.state)
      }

      if (filters.country) {
        query = query.eq('country', filters.country)
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_night', filters.minPrice)
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_night', filters.maxPrice)
      }

      if (filters.bedrooms !== undefined) {
        query = query.gte('bedrooms', filters.bedrooms)
      }

      if (filters.bathrooms !== undefined) {
        query = query.gte('bathrooms', filters.bathrooms)
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
      }

      if (filters.minSquareFeet !== undefined) {
        query = query.gte('square_feet', filters.minSquareFeet)
      }

      if (filters.maxSquareFeet !== undefined) {
        query = query.lte('square_feet', filters.maxSquareFeet)
      }

      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      } else {
        // Default to active properties only
        query = query.eq('status', 'active')
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      // Order by created date (newest first)
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        properties: data?.map(property => this.mapDatabasePropertyToProperty(property)) || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: string): Promise<ServiceResponse<Property[]>> {
    try {
      if (!ownerId) {
        return { success: false, error: 'Owner ID is required' }
      }

      const { data, error } = await this.supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        properties: data?.map(property => this.mapDatabasePropertyToProperty(property)) || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update property status
   */
  async updatePropertyStatus(propertyId: string, status: 'active' | 'inactive' | 'draft' | 'archived'): Promise<ServiceResponse> {
    try {
      if (!propertyId) {
        return { success: false, error: 'Property ID is required' }
      }

      if (!['active', 'inactive', 'draft', 'archived'].includes(status)) {
        return { success: false, error: 'Invalid status' }
      }

      const { error } = await this.supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId)

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
   * Validate property data
   */
  private validatePropertyData(propertyData: CreatePropertyRequest): { isValid: boolean; error?: string } {
    if (!propertyData.ownerId) {
      return { isValid: false, error: 'Owner ID is required' }
    }

    if (!propertyData.title || propertyData.title.trim().length === 0) {
      return { isValid: false, error: 'Title is required' }
    }

    if (!propertyData.address || propertyData.address.trim().length === 0) {
      return { isValid: false, error: 'Address is required' }
    }

    if (!propertyData.city || propertyData.city.trim().length === 0) {
      return { isValid: false, error: 'City is required' }
    }

    if (!propertyData.state || propertyData.state.trim().length === 0) {
      return { isValid: false, error: 'State is required' }
    }

    if (!propertyData.zipCode || propertyData.zipCode.trim().length === 0) {
      return { isValid: false, error: 'ZIP code is required' }
    }

    if (!['house', 'apartment', 'condo', 'townhouse', 'villa', 'other'].includes(propertyData.propertyType)) {
      return { isValid: false, error: 'Invalid property type' }
    }

    if (propertyData.bedrooms < 0) {
      return { isValid: false, error: 'Bedrooms must be non-negative' }
    }

    if (propertyData.bathrooms < 0) {
      return { isValid: false, error: 'Bathrooms must be non-negative' }
    }

    if (propertyData.pricePerNight <= 0) {
      return { isValid: false, error: 'Price per night must be positive' }
    }

    if (propertyData.maxGuests <= 0) {
      return { isValid: false, error: 'Max guests must be positive' }
    }

    return { isValid: true }
  }

  /**
   * Map database property to Property interface
   */
  private mapDatabasePropertyToProperty(dbProperty: any): Property {
    return {
      id: dbProperty.id,
      ownerId: dbProperty.owner_id,
      title: dbProperty.title,
      description: dbProperty.description,
      address: dbProperty.address,
      city: dbProperty.city,
      state: dbProperty.state,
      zipCode: dbProperty.zip_code,
      country: dbProperty.country,
      latitude: dbProperty.latitude,
      longitude: dbProperty.longitude,
      propertyType: dbProperty.property_type,
      bedrooms: dbProperty.bedrooms,
      bathrooms: dbProperty.bathrooms,
      squareFeet: dbProperty.square_feet,
      lotSize: dbProperty.lot_size,
      yearBuilt: dbProperty.year_built,
      pricePerNight: dbProperty.price_per_night,
      securityDeposit: dbProperty.security_deposit,
      cleaningFee: dbProperty.cleaning_fee,
      maxGuests: dbProperty.max_guests,
      amenities: dbProperty.amenities || [],
      houseRules: dbProperty.house_rules,
      status: dbProperty.status,
      isFeatured: dbProperty.is_featured,
      createdAt: dbProperty.created_at,
      updatedAt: dbProperty.updated_at
    }
  }
}
