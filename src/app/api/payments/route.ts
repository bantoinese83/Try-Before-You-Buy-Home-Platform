import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/services/payment/payment'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const paymentService = new PaymentService()
    
    const result = await paymentService.createPaymentIntent(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      payment: result.payment
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
