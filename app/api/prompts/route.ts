/**
 * API Route: List all available prompts
 * GET /api/prompts
 */

import { NextResponse } from 'next/server'
import { getAvailablePrompts } from '@/lib/prompt-manager'

export async function GET() {
  try {
    const prompts = getAvailablePrompts()

    return NextResponse.json({
      success: true,
      prompts
    })
  } catch (error) {
    console.error('Error in /api/prompts:', error)

    return NextResponse.json(
      { error: 'Failed to load prompts' },
      { status: 500 }
    )
  }
}
