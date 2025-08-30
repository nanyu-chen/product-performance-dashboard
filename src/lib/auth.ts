import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface TokenPayload {
  userId: number
  username: string
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    console.log('🔵 Auth - JWT_SECRET exists:', !!JWT_SECRET)
    console.log('🔵 Auth - JWT_SECRET length:', JWT_SECRET.length)
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    console.log('✅ Auth - Token verified successfully')
    return decoded
  } catch (error) {
    console.log('❌ Auth - Token verification failed:', error)
    return null
  }
}
