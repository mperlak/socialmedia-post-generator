/**
 * AI Client for Claude integration using AI SDK v5
 * Handles post generation with multimodal input (PDF + images)
 */

import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import type { FileData } from './file-utils'
import { fileDataToDataURL } from './file-utils'

export interface GeneratePostRequest {
  pdf: FileData
  images: FileData[]
  systemPrompt: string
  userPrompt: string
}

export interface GeneratePostResponse {
  post: string
  imageOrder: ImageOrderItem[]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ImageOrderItem {
  position: number
  description: string
}

/**
 * Generate social media post using Claude
 */
export async function generatePost(
  request: GeneratePostRequest
): Promise<GeneratePostResponse> {
  const { pdf, images, systemPrompt, userPrompt } = request

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  }

  try {
    // Build multimodal content array using AI SDK format
    const contentParts = [
      {
        type: 'text' as const,
        text: userPrompt
      },
      // Add PDF as file - AI SDK expects Buffer or data URL string
      {
        type: 'file' as const,
        data: Buffer.from(pdf.data, 'base64'),
        mediaType: pdf.type
      },
      // Add images with data URLs
      ...images.map(img => ({
        type: 'image' as const,
        image: fileDataToDataURL(img)
      }))
    ]

    // Call Claude API using AI SDK
    // Note: Using 'content' for multimodal content (PDF + images)
    const result = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL!),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: contentParts
        }
      ],
      temperature: 0.7,
      maxTokens: 4000
    })

    // Parse response
    const { post, imageOrder } = parseResponse(result.text)

    return {
      post,
      imageOrder,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens
      }
    }
  } catch (error) {
    console.error('Error generating post:', error)

    if (error instanceof Error) {
      throw new Error(`Failed to generate post: ${error.message}`)
    }

    throw new Error('Failed to generate post: Unknown error')
  }
}

/**
 * Parse Claude response to extract post and image order
 */
function parseResponse(text: string): {
  post: string
  imageOrder: ImageOrderItem[]
} {
  // Split by "SUGEROWANA KOLEJNOŚĆ ZDJĘĆ" or similar markers (with optional markdown headers)
  const markers = [
    /##?\s*SUGEROWANA KOLEJNOŚĆ ZDJĘĆ:/i,
    /##?\s*Kolejność zdjęć:/i,
    /##?\s*KOLEJNOŚĆ ZDJĘĆ:/i,
    /^---$/m
  ]

  let splitIndex = -1
  let usedMarkerLength = 0

  for (const marker of markers) {
    const match = text.match(marker)
    if (match && match.index !== undefined && match.index > splitIndex) {
      splitIndex = match.index
      usedMarkerLength = match[0].length
    }
  }

  if (splitIndex === -1) {
    // No image order section found, return all as post
    return {
      post: text.trim(),
      imageOrder: []
    }
  }

  // Split into post and image order sections
  const post = text.substring(0, splitIndex).replace(/---\s*$/, '').trim()
  const imageOrderText = text.substring(splitIndex + usedMarkerLength).trim()

  // Parse image order
  const imageOrder = parseImageOrder(imageOrderText)

  return { post, imageOrder }
}

/**
 * Parse image order from text
 */
function parseImageOrder(text: string): ImageOrderItem[] {
  const lines = text.split('\n').filter(line => line.trim())
  const imageOrder: ImageOrderItem[] = []

  for (const line of lines) {
    // Match patterns like: "1. Description" or "1) Description" or "Image 1 - Description"
    // Also handles markdown bold: "1. **Title** - description"
    const match = line.match(/^(?:Image\s+)?(\d+)[\.\)\-\:]\s*(.+)$/i)

    if (match) {
      const position = parseInt(match[1], 10) - 1 // Convert to 0-indexed
      let description = match[2].trim()

      // Remove markdown bold markers (**) from description
      description = description.replace(/\*\*/g, '')

      imageOrder.push({
        position,
        description
      })
    }
  }

  return imageOrder
}

/**
 * Test Claude API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await generateText({
      model: anthropic(process.env.ANTHROPIC_MODEL!),
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "OK".'
        }
      ],
      maxTokens: 10
    })

    return result.text.includes('OK')
  } catch (error) {
    console.error('Claude API test failed:', error)
    return false
  }
}
