import type { CompanyNews } from "@/types"
import { Badge } from "@/components/ui/badge"

interface CompanyNewsProps {
  news: CompanyNews[]
}

export function CompanyNewsList({ news }: CompanyNewsProps) {
  if (news.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No news articles found.</p>
    )
  }

  return (
    <div className="space-y-4">
      {news.map((article) => (
        <div key={article.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              {article.title}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {article.source}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{article.snippet}</p>
        </div>
      ))}
    </div>
  )
}
