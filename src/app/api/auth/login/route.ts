import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/services/user/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userService = new UserService()
    
    const result = await userService.login(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: result.user
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
