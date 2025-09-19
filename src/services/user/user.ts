import { createClient } from '@supabase/supabase-js'

// Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'buyer' | 'owner' | 'admin'
  isVerified: boolean
  avatarUrl?: string
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: 'buyer' | 'owner' | 'admin'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
}

export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  user?: User
  error?: string
}

export class UserService {
  private supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<ServiceResponse<User>> {
    try {
      // Validate input
      const validation = this.validateUserData(userData)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' }
      }

      // Create user profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role || 'buyer'
        })
        .select()
        .single()

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(profileData)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ServiceResponse<User>> {
    try {
      // Validate input
      if (!credentials.email) {
        return { success: false, error: 'Email is required' }
      }
      if (!credentials.password) {
        return { success: false, error: 'Password is required' }
      }

      // Authenticate user
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Invalid credentials' }
      }

      // Get user profile
      const { data: profileData, error: profileError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        return { success: false, error: profileError.message }
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(profileData)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<User>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' }
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: UpdateUserRequest): Promise<ServiceResponse<User>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' }
      }

      // Validate update data
      if (updateData.firstName && updateData.firstName.trim().length === 0) {
        return { success: false, error: 'First name cannot be empty' }
      }
      if (updateData.lastName && updateData.lastName.trim().length === 0) {
        return { success: false, error: 'Last name cannot be empty' }
      }

      // Prepare update object
      const updateObject: any = {}
      if (updateData.firstName) updateObject.first_name = updateData.firstName
      if (updateData.lastName) updateObject.last_name = updateData.lastName
      if (updateData.phone !== undefined) updateObject.phone = updateData.phone
      if (updateData.avatarUrl !== undefined) updateObject.avatar_url = updateData.avatarUrl

      const { data, error } = await this.supabase
        .from('users')
        .update(updateObject)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        user: this.mapDatabaseUserToUser(data)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ServiceResponse> {
    try {
      const { error } = await this.supabase.auth.signOut()

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
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ServiceResponse> {
    try {
      if (!email) {
        return { success: false, error: 'Email is required' }
      }

      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' }
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      })

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
   * Get current user from session
   */
  async getCurrentUser(): Promise<ServiceResponse<User>> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error) {
        return { success: false, error: error.message }
      }

      if (!user) {
        return { success: false, error: 'No authenticated user' }
      }

      return this.getUserProfile(user.id)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  /**
   * Validate user data
   */
  private validateUserData(userData: CreateUserRequest): { isValid: boolean; error?: string } {
    if (!userData.email) {
      return { isValid: false, error: 'Email is required' }
    }

    if (!this.isValidEmail(userData.email)) {
      return { isValid: false, error: 'Invalid email format' }
    }

    if (!userData.password) {
      return { isValid: false, error: 'Password is required' }
    }

    if (userData.password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' }
    }

    if (!userData.firstName || userData.firstName.trim().length === 0) {
      return { isValid: false, error: 'First name is required' }
    }

    if (!userData.lastName || userData.lastName.trim().length === 0) {
      return { isValid: false, error: 'Last name is required' }
    }

    if (userData.phone && !this.isValidPhone(userData.phone)) {
      return { isValid: false, error: 'Invalid phone number format' }
    }

    return { isValid: true }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  /**
   * Map database user to User interface
   */
  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      role: dbUser.role,
      isVerified: dbUser.is_verified,
      avatarUrl: dbUser.avatar_url,
      createdAt: dbUser.created_at
    }
  }
}
