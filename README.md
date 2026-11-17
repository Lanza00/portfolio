# Aznal Anas - Portfolio

Personal portfolio site (HTML, CSS, vanilla JavaScript). Sections: About, Experience, Projects, Posts, Contact.

## Structure

```
index.html      page markup
style.css       light, minimal styling
js/main.js      loads projects, GitHub repos and posts
projects.json   featured projects (edit by hand)
posts.json      posts (edit by hand)
```

## Run locally

Serve the folder over HTTP (Laragon: http://portfolio.test). Opening index.html directly as a file will not load the JSON files.

## Add a post

Add an object to the top of `posts.json`:

```json
{
  "date": "2026-11-17",
  "status": "ongoing",
  "title": "Short title",
  "body": "What you are doing.",
  "link": "https://optional-link",
  "linkText": "Optional link label"
}
```

`status` is one of: `ongoing`, `planned`, `completed`, `onhold`, `abandoned`.

## Add a featured project

Add an object to `projects.json` with `name`, `description`, `tech` (list), `github` and an optional `demo` URL. Other public repos from GitHub (`Lanza00`) appear automatically under "More on GitHub".
