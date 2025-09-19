import { UserService, User, CreateUserRequest, LoginRequest, UpdateUserRequest } from './user'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  },
  from: jest.fn(),
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('UserService', () => {
  let userService: UserService
  let mockChain: any

  beforeEach(() => {
    userService = new UserService()
    jest.clearAllMocks()
    
    // Create a fresh mock chain for each test
    mockChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }
    
    mockSupabaseClient.from.mockReturnValue(mockChain)
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'buyer'
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        is_verified: false,
        created_at: '2023-01-01T00:00:00Z'
      }

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockChain.single.mockResolvedValue({
        data: mockUser,
        error: null
      })

      const result = await userService.register(userData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        isVerified: false,
        createdAt: '2023-01-01T00:00:00Z'
      })
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle registration errors', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer'
      }

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      })

      const result = await userService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })

    it('should validate required fields', async () => {
      const userData: CreateUserRequest = {
        email: '',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer'
      }

      const result = await userService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email is required')
    })

    it('should validate email format', async () => {
      const userData: CreateUserRequest = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer'
      }

      const result = await userService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email format')
    })

    it('should validate password strength', async () => {
      const userData: CreateUserRequest = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer'
      }

      const result = await userService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Password must be at least 8 characters')
    })
  })

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'buyer',
        is_verified: true
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      mockChain.single.mockResolvedValue({
        data: mockUser,
        error: null
      })

      const result = await userService.login(loginData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'buyer',
        isVerified: true
      })
    })

    it('should handle login errors', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      const result = await userService.login(loginData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    it('should validate login credentials', async () => {
      const loginData: LoginRequest = {
        email: '',
        password: 'password123'
      }

      const result = await userService.login(loginData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Email is required')
    })
  })

  describe('Get User Profile', () => {
    it('should get user profile successfully', async () => {
      const userId = 'user-123'
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        is_verified: true,
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: '2023-01-01T00:00:00Z'
      }

      mockChain.single.mockResolvedValue({
        data: mockUser,
        error: null
      })

      const result = await userService.getUserProfile(userId)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'buyer',
        isVerified: true,
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should handle user not found', async () => {
      const userId = 'nonexistent-user'

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      })

      const result = await userService.getUserProfile(userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })
  })

  describe('Update User Profile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123'
      const updateData: UpdateUserRequest = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+0987654321'
      }

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '+0987654321',
        role: 'buyer',
        is_verified: true
      }

      mockChain.single.mockResolvedValue({
        data: mockUpdatedUser,
        error: null
      })

      const result = await userService.updateUserProfile(userId, updateData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+0987654321',
        role: 'buyer',
        isVerified: true
      })
    })

    it('should handle update errors', async () => {
      const userId = 'user-123'
      const updateData: UpdateUserRequest = {
        firstName: 'Jane'
      }

      mockChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      const result = await userService.updateUserProfile(userId, updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null
      })

      const result = await userService.logout()

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      })

      const result = await userService.logout()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Logout failed')
    })
  })

  describe('Password Reset', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com'

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      })

      const result = await userService.requestPasswordReset(email)

      expect(result.success).toBe(true)
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
      })
    })

    it('should handle password reset errors', async () => {
      const email = 'nonexistent@example.com'

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Email not found' }
      })

      const result = await userService.requestPasswordReset(email)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email not found')
    })
  })
})