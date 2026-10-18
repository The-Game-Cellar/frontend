import { useEffect } from 'react'

const PRODUCT = 'The Game Cellar'

// The tab reads `Page · The Game Cellar`, or the product alone without a page; leaving the page restores the
// product title, so a page that sets none never inherits the last one's.
export default function useDocumentTitle(page?: string | null) {
  useEffect(() => {
    document.title = page ? `${page} · ${PRODUCT}` : PRODUCT
    return () => {
      document.title = PRODUCT
    }
  }, [page])
}
