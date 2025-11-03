"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface ResultData {
  post: string
  imageOrder: Array<{
    position: number
    description: string
  }>
  postType: string
  projectType: string
  thumbnails: string[] // data URLs
  generatedAt: string
}

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<ResultData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load result from sessionStorage
    const stored = sessionStorage.getItem('generatedPost')
    if (!stored) {
      router.push('/')
      return
    }

    try {
      const data = JSON.parse(stored) as ResultData
      setResult(data)
    } catch (error) {
      console.error('Failed to parse result:', error)
      toast.error('Błąd ładowania wyniku')
      router.push('/')
    }
  }, [router])

  const copyToClipboard = async () => {
    if (!result) return

    try {
      await navigator.clipboard.writeText(result.post)
      setCopied(true)
      toast.success('Skopiowano do schowka!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Nie udało się skopiować')
    }
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-mroomy-beige/20 to-mroomy-powder/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mroomy-pink border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie wyniku...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-mroomy-beige/20 to-mroomy-powder/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-2xl text-foreground">Wygenerowany post</h1>
              <p className="text-sm text-muted-foreground">
                {result.postType === 'fb-ig' ? 'Facebook / Instagram' : 'Grupa Facebook'}
                {' • '}
                {result.projectType === 'mroomygo' && 'MroomyGO'}
                {result.projectType === 'premium' && 'Premium'}
                {result.projectType === 'premium-plus' && 'Premium+'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
          {/* Post Content */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Treść posta</CardTitle>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Skopiowano!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopiuj
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-xl p-6 whitespace-pre-wrap text-sm max-h-[600px] overflow-y-auto">
                {result.post}
              </div>
            </CardContent>
          </Card>

          {/* Image Order */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mroomy-pink" />
                Sugerowana kolejność zdjęć
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.imageOrder.length > 0 ? (
                  result.imageOrder.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-mroomy-pink text-white flex items-center justify-center font-bold text-lg">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Brak sugerowanej kolejności zdjęć
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="max-w-6xl mx-auto mt-6 flex gap-4">
          <Link href="/" className="flex-1">
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
            >
              Generuj nowy post
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
