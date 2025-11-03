/**
 * Prompt management utilities
 * Handles loading and saving prompts from/to text files
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const PROMPTS_DIR = join(process.cwd(), 'prompts')

export type PostType = 'fb-ig' | 'fb-group'
export type ProjectType = 'mroomygo' | 'premium' | 'premium-plus'

export interface PromptInfo {
  filename: string
  postType: PostType
  title: string
  description: string
}

/**
 * Get all available prompts
 */
export function getAvailablePrompts(): PromptInfo[] {
  return [
    {
      filename: 'fb-ig.txt',
      postType: 'fb-ig',
      title: 'Facebook / Instagram',
      description: 'Post na fanpage z emocjonalnym storytellingiem'
    },
    {
      filename: 'fb-group.txt',
      postType: 'fb-group',
      title: 'Grupa Facebook',
      description: 'Cykl "Mroomy Rozwiązuje" - merytoryczny case study'
    }
  ]
}

/**
 * Load a prompt from file
 */
export async function loadPrompt(filename: string): Promise<string> {
  const filePath = join(PROMPTS_DIR, filename)

  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    throw new Error(`Failed to load prompt: ${filename}`)
  }
}

/**
 * Save a prompt to file
 */
export async function savePrompt(filename: string, content: string): Promise<void> {
  const filePath = join(PROMPTS_DIR, filename)

  try {
    await writeFile(filePath, content, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to save prompt: ${filename}`)
  }
}

/**
 * Load prompt by post type
 */
export async function loadPromptByType(postType: PostType): Promise<string> {
  const filename = `${postType}.txt`
  return loadPrompt(filename)
}

/**
 * Build complete system prompt for post generation
 * Combines post type prompt with project type information
 */
export async function buildSystemPrompt(
  postType: PostType,
  projectType: ProjectType
): Promise<string> {
  // Load base prompt for post type
  const basePrompt = await loadPromptByType(postType)

  // Add project type context
  const projectContext = getProjectTypeContext(projectType)

  return `${basePrompt}\n\n---\n\n${projectContext}`
}

/**
 * Get project type specific context
 */
function getProjectTypeContext(projectType: ProjectType): string {
  switch (projectType) {
    case 'mroomygo':
      return `## TYP PROJEKTU: MroomyGO

**Charakterystyka:**
- Szybki projekt metamorfozy w 10 dni roboczych
- Wizualizacje 3D + lista zakupów z linkami
- Darmowa dostawa
- Wykorzystanie gotowych mebli dostępnych na rynku
- Optymalizacja kosztów bez utraty jakości

**W poście podkreślaj:**
- Krótki czas realizacji (10 dni)
- Prostotę procesu
- Praktyczne rozwiązania
- Dostępność produktów`

    case 'premium':
      return `## TYP PROJEKTU: Premium

**Charakterystyka:**
- Kompleksowy projekt pokoju z rysunkami technicznymi
- Wykorzystanie gotowych mebli dostępnych na rynku
- Bardziej dopracowane detale niż MroomyGO
- Dokładne planowanie przestrzeni
- Profesjonalne wizualizacje 3D

**W poście podkreślaj:**
- Kompleksowość projektu
- Dopracowanie detali
- Funkcjonalność rozwiązań
- Wykorzystanie dostępnych mebli w przemyślany sposób`

    case 'premium-plus':
      return `## TYP PROJEKTU: Premium+

**Charakterystyka:**
- Kompleksowy projekt pokoju z rysunkami technicznymi
- **Meble projektowane na wymiar** do wykonania przez stolarza
- Najwyższy poziom personalizacji
- Unikalne rozwiązania dopasowane idealnie do przestrzeni
- Maksymalna funkcjonalność

**W poście podkreślaj:**
- Meble na wymiar (kluczowe!)
- Idealne dopasowanie do potrzeb rodziny
- Unikalne rozwiązania niemożliwe z gotowymi meblami
- Maksymalne wykorzystanie przestrzeni
- Najwyższa jakość wykonania`
  }
}

/**
 * Build user prompt for AI
 */
export function buildUserPrompt(projectType: ProjectType): string {
  return `Przeanalizuj załączoną ankietę klienta (PDF) oraz wizualizacje pokoju (zdjęcia).

**Typ projektu:** ${getProjectTypeName(projectType)}

**Zadanie:**
1. Wyciągnij z ankiety kluczowe informacje:
   - Imię i wiek dziecka
   - Zainteresowania i hobby
   - Ulubione kolory
   - Specjalne wymagania
   - Wyzwania projektowe

2. Przeanalizuj wizualizacje i zidentyfikuj:
   - Kluczowe elementy projektu
   - Rozwiązania przestrzenne
   - Strefy funkcjonalne
   - Palety kolorystyczne

3. Wygeneruj kompletny post zgodnie z promptem systemowym.

4. **BARDZO WAŻNE - Format odpowiedzi:**

Najpierw podaj treść posta (wszystko co ma być skopiowane do Facebooka/Instagrama).

Następnie dodaj separatorem i sekcję z kolejnością zdjęć:

---

## SUGEROWANA KOLEJNOŚĆ ZDJĘĆ:

1. [Krótki opis pierwszego zdjęcia - np. "Hero shot z pełnym widokiem pokoju pokazujący całą przestrzeń"]
2. [Krótki opis drugiego zdjęcia - np. "Zbliżenie na strefę nauki z biurkiem"]
3. [Krótki opis trzeciego zdjęcia]
4. [Krótki opis czwartego zdjęcia]

**Struktura:**
1. Treść posta (kompletna, bez skrótów)
2. Separator: ---
3. Sekcja: ## SUGEROWANA KOLEJNOŚĆ ZDJĘĆ:
4. Lista ponumerowana z opisami każdego zdjęcia`
}

/**
 * Get project type display name
 */
function getProjectTypeName(projectType: ProjectType): string {
  switch (projectType) {
    case 'mroomygo':
      return 'MroomyGO - szybki projekt w 10 dni'
    case 'premium':
      return 'Premium - kompleksowy projekt z gotowymi meblami'
    case 'premium-plus':
      return 'Premium+ - kompleksowy projekt z meblami na wymiar'
  }
}
