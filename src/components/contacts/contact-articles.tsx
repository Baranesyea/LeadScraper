import { ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ContactArticle } from "@/types"

interface ContactArticlesProps {
  articles: ContactArticle[]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function ContactArticles({ articles }: ContactArticlesProps) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No articles found.</p>
    )
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <Card key={article.id} className="shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline inline-flex items-center gap-1.5"
                >
                  {article.title}
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </a>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {article.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.snippet}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
