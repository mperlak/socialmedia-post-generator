/**
 * API Route: Generate Social Media Post
 * POST /api/generate-post
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generatePost } from '@/lib/ai-client'
import { buildSystemPrompt, buildUserPrompt, type PostType, type ProjectType } from '@/lib/prompt-manager'

// Request validation schema
const GeneratePostSchema = z.object({
  pdf: z.object({
    name: z.string(),
    type: z.string(),
    data: z.string() // base64
  }),
  images: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      data: z.string() // base64
    })
  ).min(3).max(10),
  postType: z.enum(['fb-ig', 'fb-group']),
  projectType: z.enum(['mroomygo', 'premium', 'premium-plus'])
})

export async function POST(request: NextRequest) {
  try {
    // Get raw body size before parsing
    const contentLength = request.headers.get('content-length')
    const contentLengthMB = contentLength ? (parseInt(contentLength) / (1024 * 1024)).toFixed(2) : 'unknown'
    
    console.log('📥 Request received:', {
      contentLength: contentLength ? `${parseInt(contentLength).toLocaleString()} bytes` : 'unknown',
      contentLengthMB: `${contentLengthMB} MB`,
      url: request.url
    })

    // Parse and validate request body
    const body = await request.json()
    
    // Log payload details after parsing
    const imagesCount = Array.isArray(body.images) ? body.images.length : 0
    const pdfDataSize = body.pdf?.data?.length || 0
    const totalImagesDataSize = Array.isArray(body.images) 
      ? body.images.reduce((sum: number, img: any) => sum + (img.data?.length || 0), 0)
      : 0
    
    console.log('📊 Parsed payload details:', {
      imagesCount,
      pdfDataSize: `${(pdfDataSize / 1024).toFixed(2)} KB`,
      totalImagesDataSize: `${(totalImagesDataSize / 1024 / 1024).toFixed(2)} MB`,
      avgImageDataSize: imagesCount > 0 ? `${(totalImagesDataSize / imagesCount / 1024).toFixed(2)} KB` : '0 KB',
      postType: body.postType,
      projectType: body.projectType
    })
    
    const validation = GeneratePostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { pdf, images, postType, projectType } = validation.data

    // Build prompts
    const systemPrompt = await buildSystemPrompt(postType as PostType, projectType as ProjectType)
    const userPrompt = buildUserPrompt(projectType as ProjectType)

    // Generate post using Claude
    const result = await generatePost({
      pdf,
      images,
      systemPrompt,
      userPrompt
    })

    // Return result
    return NextResponse.json({
      success: true,
      post: result.post,
      usage: result.usage,
      metadata: {
        postType,
        projectType,
        imageCount: images.length,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in /api/generate-post:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to generate post', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate post', message: 'Unknown error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS (if needed)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
