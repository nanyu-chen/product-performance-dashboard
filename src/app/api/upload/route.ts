import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    // Skip header row and process data
    const products = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (row.length >= 5) { // Ensure we have enough columns
        products.push({
          productName: String(row[0] || '').trim(),
          inventory: parseFloat(row[1]) || 0,
          procurementAmount: parseFloat(row[2]) || 0,
          salesAmount: parseFloat(row[3]) || 0,
          date: new Date(row[4] || new Date())
        })
      }
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in file' },
        { status: 400 }
      )
    }

    // Clear existing data and insert new data
    await prisma.productData.deleteMany()
    await prisma.productData.createMany({
      data: products
    })

    return NextResponse.json({
      message: 'Data uploaded successfully',
      count: products.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}
