/**
 * AI Client for Claude integration using Anthropic SDK
 * Handles post generation with multimodal input (PDF + images)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { FileData } from './file-utils'

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
    // Initialize Anthropic client
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Build multimodal content array
    const content: Anthropic.MessageParam['content'] = [
      {
        type: 'text',
        text: userPrompt
      },
      // Add PDF
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: pdf.type,
          data: pdf.data
        }
      },
      // Add images
      ...images.map(img => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.type,
          data: img.data
        }
      }))
    ]

    // Call Claude API
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content
        }
      ]
    })

    // Extract text from response
    const textContent = message.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse response
    const { post, imageOrder } = parseResponse(textContent.text)

    return {
      post,
      imageOrder,
      usage: {
        promptTokens: message.usage.input_tokens,
        completionTokens: message.usage.output_tokens,
        totalTokens: message.usage.input_tokens + message.usage.output_tokens
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
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    })

    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "OK".'
        }
      ]
    })

    const textContent = message.content.find(block => block.type === 'text')
    return textContent?.type === 'text' && textContent.text.includes('OK')
  } catch (error) {
    console.error('Claude API test failed:', error)
    return false
  }
}
