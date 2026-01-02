# Black Star Daily

**Black Star Daily** is a high-performance news aggregator built for the Ghanaian market. It leverages **Crawlee + Playwright** to scrape top stories and latest updates from major news outlies in ghana, delivering a curated "5-Minute Read" experience for busy professionals.

---

## Tech Stack

- **Frontend:** React + Vite (Port 4000)
- **Backend:** Node.js + Express (Port 5000, strict MVC)
- **Scraper:** Crawlee + Playwright Crawler
- **Styling:** Mobile-first Plain SCSS (1-level nesting, no Tailwind, component.styles.scss per component)
- **State Management:** React Query + Custom Hooks
- **Data Storage:** Local JSON (server/data/news.json)
- **Testing:** TDD with 100% coverage (Jest + Supertest for server, Vitest + RTL for client)

---

## Project Structure

This project follows a strictly decoupled MERN architecture with no root-level package.json.

```text
/black-star-daily
├── client/              # React + Vite
│   ├── src/
│   │   ├── hooks/       # React Query custom hooks
│   │   └── components/  # Components with localized .styles.scss files
├── server/              # Node.js + Express (MVC)
│   ├── controllers/     # Route logic
│   ├── data/            # Scraped news storage (news.json)
│   ├── services/        # PlaywrightCrawler logic
│   ├── models/          # Mongoose schemas (future-proof)
│   └── main.js          # Scraper entry point
└── crawlee.json         # Windows environment fix
```
