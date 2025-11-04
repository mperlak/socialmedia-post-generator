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
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
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

    return {
      post: result.text.trim(),
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
