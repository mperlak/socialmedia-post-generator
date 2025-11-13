"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useParams, notFound } from "next/navigation"
import { ArrowLeft, FileText, Upload, ImageIcon, Sparkles, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { fileToFileData, validatePdf, validateImages, createThumbnail } from "@/lib/file-utils"

type PostType = 'fb-ig' | 'fb-group'

interface PageConfig {
  title: string
  description: string
  gradient: string
  icon: typeof FileText
  showInfoCard: boolean
  infoCardContent?: {
    icon: typeof Users
    title: string
    description: string
    bgColor: string
    iconColor: string
  }
}

const PAGE_CONFIGS: Record<PostType, PageConfig> = {
  'fb-ig': {
    title: 'Facebook / Instagram',
    description: 'Generator postów z emocjonalnym storytellingiem',
    gradient: 'from-background via-mroomy-beige/20 to-mroomy-powder/30',
    icon: FileText,
    showInfoCard: false
  },
  'fb-group': {
    title: 'Grupa Facebook',
    description: 'Cykl "Mroomy Rozwiązuje" - merytoryczny case study',
    gradient: 'from-background via-mroomy-blue/10 to-mroomy-green/10',
    icon: Users,
    showInfoCard: true,
    infoCardContent: {
      icon: Users,
      title: 'Merytoryczny case study',
      description: 'Post edukacyjny pokazujący proces projektowania',
      bgColor: 'from-card to-mroomy-blue/5',
      iconColor: 'bg-mroomy-blue/10 text-mroomy-blue'
    }
  }
}

export default function GeneratePage() {
  const params = useParams()
  const router = useRouter()
  const type = params.type as string

  // Validate type
  if (!type || !['fb-ig', 'fb-group'].includes(type)) {
    notFound()
  }

  const postType = type as PostType
  const config = PAGE_CONFIGS[postType]

  const [selectedType, setSelectedType] = useState<"mroomygo" | "premium" | "premium-plus">("mroomygo")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDraggingPdf, setIsDraggingPdf] = useState(false)
  const [isDraggingImages, setIsDraggingImages] = useState(false)

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0])
    }
  }

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingPdf(false)

    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === 'application/pdf')

    if (pdfFile) {
      setPdfFile(pdfFile)
    } else {
      toast.error('Proszę przeciągnąć plik PDF')
    }
  }

  const handlePdfDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingPdf(true)
  }

  const handlePdfDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingPdf(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setImages(fileArray)

      // Generate preview URLs
      const previews = fileArray.map(file => URL.createObjectURL(file))
      setImagePreviews(previews)
    }
  }

  const handleImagesDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingImages(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file =>
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/jpg'
    )

    if (imageFiles.length > 0) {
      setImages(imageFiles)
      const previews = imageFiles.map(file => URL.createObjectURL(file))
      setImagePreviews(previews)
    } else {
      toast.error('Proszę przeciągnąć pliki JPG lub PNG')
    }
  }

  const handleImagesDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingImages(true)
  }

  const handleImagesDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingImages(false)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const handleGenerate = async () => {
    if (!pdfFile || images.length < 3) {
      toast.error('Dodaj ankietę PDF i minimum 3 zdjęcia')
      return
    }

    // Validate files
    const pdfValidation = validatePdf(pdfFile)
    if (!pdfValidation.valid) {
      toast.error(pdfValidation.error || 'Nieprawidłowy plik PDF')
      return
    }

    const imagesValidation = validateImages(images)
    if (!imagesValidation.valid) {
      toast.error(imagesValidation.error || 'Nieprawidłowe zdjęcia')
      return
    }

    setIsGenerating(true)

    try {
      // Convert files to base64
      const pdfData = await fileToFileData(pdfFile)
      const imagesData = await Promise.all(images.map(img => fileToFileData(img)))

      // Call API
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pdf: pdfData,
          images: imagesData,
          postType,
          projectType: selectedType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się wygenerować posta')
      }

      // Create thumbnails for preview (small images for sessionStorage)
      const thumbnails = await Promise.all(images.map(img => createThumbnail(img)))

      // Store result in sessionStorage and redirect
      sessionStorage.setItem('generatedPost', JSON.stringify({
        post: data.post,
        postType,
        projectType: selectedType,
        thumbnails,
        generatedAt: data.metadata?.generatedAt || new Date().toISOString()
      }))

      toast.success('Post wygenerowany!')
      router.push('/result')
    } catch (error) {
      console.error('Error generating post:', error)
      toast.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas generowania posta')
    } finally {
      setIsGenerating(false)
    }
  }

  const HeaderIcon = config.icon

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient}`}>
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
              <h1 className="font-bold text-2xl text-foreground">{config.title}</h1>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Info Card (only for fb-group) */}
          {config.showInfoCard && config.infoCardContent && (
            <Card className={`border-2 border-mroomy-blue/30 bg-gradient-to-br ${config.infoCardContent.bgColor}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${config.infoCardContent.iconColor} flex items-center justify-center`}>
                    <config.infoCardContent.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{config.infoCardContent.title}</CardTitle>
                    <CardDescription className="mt-1">{config.infoCardContent.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Project Type Selection */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-mroomy-pink/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-mroomy-pink" />
                </div>
                <CardTitle className="text-xl">Typ projektu</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <button
                  onClick={() => setSelectedType("mroomygo")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedType === "mroomygo"
                      ? "border-mroomy-pink bg-mroomy-pink/5"
                      : "border-border hover:border-mroomy-pink/50"
                  }`}
                >
                  <div className="font-bold text-lg mb-1">MroomyGO</div>
                  <div className="text-sm text-muted-foreground">Projekt w 10 dni</div>
                </button>
                <button
                  onClick={() => setSelectedType("premium")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedType === "premium"
                      ? "border-mroomy-pink bg-mroomy-pink/5"
                      : "border-border hover:border-mroomy-pink/50"
                  }`}
                >
                  <div className="font-bold text-lg mb-1">Premium</div>
                  <div className="text-sm text-muted-foreground">Gotowe meble</div>
                </button>
                <button
                  onClick={() => setSelectedType("premium-plus")}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedType === "premium-plus"
                      ? "border-mroomy-pink bg-mroomy-pink/5"
                      : "border-border hover:border-mroomy-pink/50"
                  }`}
                >
                  <div className="font-bold text-lg mb-1">Premium+</div>
                  <div className="text-sm text-muted-foreground">Meble na wymiar</div>
                </button>
              </div>
              {selectedType === "mroomygo" && (
                <div className="mt-4 p-3 rounded-lg bg-mroomy-yellow/10 border border-mroomy-yellow/30 flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-mroomy-yellow mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">Szybki projekt metamorfozy w 10 dni roboczych</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PDF Upload */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Ankieta od klienta (PDF)</CardTitle>
              <CardDescription>Prześlij wypełnioną ankietę w formacie PDF</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="block">
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <div
                  onDrop={handlePdfDrop}
                  onDragOver={handlePdfDragOver}
                  onDragLeave={handlePdfDragLeave}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDraggingPdf
                      ? 'border-mroomy-pink bg-mroomy-pink/10 scale-105'
                      : 'border-border hover:border-mroomy-pink/50 hover:bg-mroomy-pink/5'
                  }`}
                >
                  {pdfFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-mroomy-green/10 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6 text-mroomy-green" />
                      </div>
                      <p className="font-semibold text-foreground">{pdfFile.name}</p>
                      <p className="text-sm text-muted-foreground">Kliknij, aby zmienić plik</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-foreground">Kliknij lub przeciągnij plik PDF</p>
                      <p className="text-sm text-muted-foreground">Ankieta wypełniona przez klienta</p>
                    </div>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Images Upload */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Wizualizacje pokoju (3-10 zdjęć)</CardTitle>
              <CardDescription>Prześlij zdjęcia wizualizacji w formacie JPG lub PNG</CardDescription>
            </CardHeader>
            <CardContent>
              {images.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-border group"
                      >
                        <img
                          src={preview}
                          alt={`Zdjęcie ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-mroomy-pink text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" className="w-full" type="button" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Usuń wszystkie i dodaj nowe
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div
                    onDrop={handleImagesDrop}
                    onDragOver={handleImagesDragOver}
                    onDragLeave={handleImagesDragLeave}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDraggingImages
                        ? 'border-mroomy-blue bg-mroomy-blue/10 scale-105'
                        : 'border-border hover:border-mroomy-blue/50 hover:bg-mroomy-blue/5'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-foreground">Kliknij lub przeciągnij zdjęcia tutaj</p>
                      <p className="text-sm text-muted-foreground">JPG, PNG (3-10 plików)</p>
                    </div>
                  </div>
                </label>
              )}
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold bg-mroomy-pink hover:bg-mroomy-pink/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            disabled={!pdfFile || images.length < 3 || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generuję post...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Generuj post
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
