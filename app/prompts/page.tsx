"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Settings, RotateCcw, Save, X, Edit, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Prompt {
  filename: string
  content: string
  title: string
  description: string
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null)
  const [tempPrompt, setTempPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load prompts on mount
  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    setIsLoading(true)
    try {
      // Load both prompts
      const [fbIgResponse, fbGroupResponse] = await Promise.all([
        fetch('/api/prompts/fb-ig.txt'),
        fetch('/api/prompts/fb-group.txt')
      ])

      if (!fbIgResponse.ok || !fbGroupResponse.ok) {
        throw new Error('Failed to load prompts')
      }

      const [fbIgData, fbGroupData] = await Promise.all([
        fbIgResponse.json(),
        fbGroupResponse.json()
      ])

      setPrompts([
        {
          filename: 'fb-ig.txt',
          content: fbIgData.content,
          title: 'Prompt Facebook / Instagram',
          description: 'Szablon dla postów na fanpage z emocjonalnym storytellingiem'
        },
        {
          filename: 'fb-group.txt',
          content: fbGroupData.content,
          title: 'Prompt Grupa Facebook',
          description: 'Szablon dla cyklu "Mroomy Rozwiązuje" - merytoryczny case study'
        }
      ])
    } catch (error) {
      console.error('Error loading prompts:', error)
      toast.error('Nie udało się załadować promptów')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (filename: string) => {
    const prompt = prompts.find(p => p.filename === filename)
    if (prompt) {
      setEditingPrompt(filename)
      setTempPrompt(prompt.content)
    }
  }

  const handleSave = async () => {
    if (!editingPrompt) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/prompts/${editingPrompt}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: tempPrompt
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save prompt')
      }

      // Update local state
      setPrompts(prompts.map(p =>
        p.filename === editingPrompt
          ? { ...p, content: tempPrompt }
          : p
      ))

      setEditingPrompt(null)
      toast.success('Prompt zapisany!')
    } catch (error) {
      console.error('Error saving prompt:', error)
      toast.error(error instanceof Error ? error.message : 'Nie udało się zapisać promptu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingPrompt(null)
    setTempPrompt("")
  }

  const handleResetDefaults = async () => {
    if (!confirm("Czy na pewno chcesz przywrócić domyślne prompty? Ta akcja nie może być cofnięta.")) {
      return
    }

    toast.info('Funkcja przywracania domyślnych promptów zostanie wkrótce dodana')
    // TODO: Implement reset to defaults - może być endpoint /api/prompts/reset lub po prostu wczytać z oryginalnych plików
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-mroomy-beige/20 to-mroomy-powder/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-mroomy-pink mx-auto mb-4" />
          <p className="text-muted-foreground">Ładowanie promptów...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-mroomy-beige/20 to-mroomy-powder/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Powrót</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="gap-2 hover:bg-mroomy-pink/10 hover:text-mroomy-pink hover:border-mroomy-pink/50 bg-transparent"
            >
              <RotateCcw className="w-4 h-4" />
              Przywróć domyślne
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-mroomy-pink/10 flex items-center justify-center">
              <Settings className="w-7 h-7 text-mroomy-pink" />
            </div>
            <div>
              <h1 className="font-bold text-4xl text-foreground">Zarządzaj promptami</h1>
              <p className="text-muted-foreground mt-1">Dostosuj szablony generowania postów</p>
            </div>
          </div>

          {/* Prompts */}
          <div className="space-y-6">
            {prompts.map((prompt, index) => (
              <Card
                key={prompt.filename}
                className={`border-2 ${index === 0 ? 'bg-gradient-to-br from-card to-mroomy-pink/5' : 'bg-gradient-to-br from-card to-mroomy-blue/5'}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-foreground">{prompt.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {editingPrompt === prompt.filename
                          ? prompt.description
                          : "Kliknij 'Edytuj' aby zmodyfikować prompt"}
                      </CardDescription>
                    </div>
                    {editingPrompt !== prompt.filename && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(prompt.filename)}
                        className={`gap-2 ${index === 0 ? 'text-mroomy-pink hover:text-mroomy-pink hover:bg-mroomy-pink/10' : 'text-mroomy-blue hover:text-mroomy-blue hover:bg-mroomy-blue/10'}`}
                      >
                        <Edit className="w-4 h-4" />
                        Edytuj
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {editingPrompt === prompt.filename && (
                  <CardContent className="space-y-4">
                    <Textarea
                      value={tempPrompt}
                      onChange={(e) => setTempPrompt(e.target.value)}
                      className={`min-h-[400px] font-mono text-sm bg-muted/50 border-2 ${index === 0 ? 'focus:border-mroomy-pink/50' : 'focus:border-mroomy-blue/50'}`}
                      placeholder="Wprowadź prompt..."
                      disabled={isSaving}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`gap-2 ${index === 0 ? 'bg-mroomy-pink hover:bg-mroomy-pink/90' : 'bg-mroomy-blue hover:bg-mroomy-blue/90'} text-white`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Zapisuję...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Zapisz
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={isSaving}
                        variant="outline"
                        className="gap-2 bg-transparent"
                      >
                        <X className="w-4 h-4" />
                        Anuluj
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <Card className="mt-8 border-mroomy-green/50 bg-mroomy-green/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-mroomy-green flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">Informacja:</strong> Prompty są zapisywane na serwerze w plikach tekstowych.
                Wszystkie zmiany są trwałe i będą używane przy generowaniu nowych postów. Użyj przycisku
                "Przywróć domyślne", aby wrócić do oryginalnych szablonów (funkcja wkrótce dostępna).
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
