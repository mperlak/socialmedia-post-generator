import Link from "next/link"
import { FileText, Users, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-mroomy-beige/20 to-mroomy-powder/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-4xl text-foreground tracking-tight">
                mroomy<span className="text-mroomy-pink">.</span>
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Post Generator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="font-bold text-5xl text-foreground mb-4 text-balance">
              Twórz angażujące posty w kilka minut
            </h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Generuj profesjonalne posty na Facebook i Instagram na podstawie ankiet klientów i wizualizacji pokoi
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Facebook/Instagram Card */}
            <Link href="/generate/fb-ig" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-mroomy-pink/50 bg-gradient-to-br from-card to-mroomy-powder/10">
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-mroomy-pink/10 flex items-center justify-center mb-4 group-hover:bg-mroomy-pink/20 transition-colors">
                    <FileText className="w-7 h-7 text-mroomy-pink" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">Facebook / Instagram</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Post na fanpage z emocjonalnym storytellingiem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-mroomy-pink font-semibold group-hover:gap-2 transition-all">
                    Rozpocznij
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Facebook Group Card */}
            <Link href="/generate/fb-group" className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-mroomy-blue/50 bg-gradient-to-br from-card to-mroomy-blue/10">
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-mroomy-blue/10 flex items-center justify-center mb-4 group-hover:bg-mroomy-blue/20 transition-colors">
                    <Users className="w-7 h-7 text-mroomy-blue" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">Grupa Facebook</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Cykl "Mroomy Rozwiązuje" - merytoryczny case study
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-mroomy-blue font-semibold group-hover:gap-2 transition-all">
                    Rozpocznij
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Settings Card */}
          <Link href="/prompts">
            <Card className="border-2 bg-gradient-to-br from-card to-mroomy-yellow/10 hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-mroomy-yellow/10 flex items-center justify-center group-hover:bg-mroomy-yellow/20 transition-colors">
                      <Settings className="w-6 h-6 text-mroomy-yellow" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">Zarządzaj promptami</CardTitle>
                      <CardDescription className="mt-1">Dostosuj szablony i ustawienia generatora</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center text-mroomy-yellow font-semibold group-hover:gap-2 transition-all">
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 mroomy. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
