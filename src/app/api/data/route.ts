import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('product')

    if (productName) {
      // Get data for specific product
      const data = await prisma.productData.findMany({
        where: { productName },
        orderBy: { date: 'asc' }
      })

      return NextResponse.json(data)
    } else {
      // Get list of available products
      const products = await prisma.productData.findMany({
        select: { productName: true },
        distinct: ['productName'],
        orderBy: { productName: 'asc' }
      })

      return NextResponse.json(products.map((p: { productName: string }) => p.productName))
    }
  } catch (error) {
    console.error('Data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
