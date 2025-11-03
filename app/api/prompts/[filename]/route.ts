/**
 * API Route: Get or update a specific prompt
 * GET /api/prompts/[filename]
 * POST /api/prompts/[filename]
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadPrompt, savePrompt } from '@/lib/prompt-manager'
import { z } from 'zod'

// Validate filename to prevent directory traversal
function isValidFilename(filename: string): boolean {
  // Only allow specific filenames
  const allowedFilenames = ['fb-ig.txt', 'fb-group.txt']
  return allowedFilenames.includes(filename)
}

/**
 * GET: Load a prompt by filename
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    if (!isValidFilename(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    const content = await loadPrompt(filename)

    return NextResponse.json({
      success: true,
      filename,
      content
    })
  } catch (error) {
    console.error('Error in GET /api/prompts/[filename]:', error)

    return NextResponse.json(
      { error: 'Failed to load prompt' },
      { status: 500 }
    )
  }
}

/**
 * POST: Update a prompt by filename
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    if (!isValidFilename(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Validate request body
    const body = await request.json()
    const schema = z.object({
      content: z.string().min(10)
    })

    const validation = schema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { content } = validation.data

    // Save prompt
    await savePrompt(filename, content)

    return NextResponse.json({
      success: true,
      filename,
      message: 'Prompt saved successfully'
    })
  } catch (error) {
    console.error('Error in POST /api/prompts/[filename]:', error)

    return NextResponse.json(
      { error: 'Failed to save prompt' },
      { status: 500 }
    )
  }
}
