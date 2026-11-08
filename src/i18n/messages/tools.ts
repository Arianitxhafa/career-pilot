const en = {
  importJob: {
    title: "Import from a job link",
    hint: "Paste the link to a job ad — company, role, location, salary and the full job post are filled in for you.",
    label: "Job link",
    placeholder: "https://jobs.example.com/frontend-developer",
    button: "Import",
    importing: "Importing…",
    done: "Filled in from the job page — check the fields, then save.",
    partial: "That page only shares its title and a short summary — check the fields, and paste the full job post in ✨ Co-pilot later.",
    post: (n: string) => `✓ Job post imported (${n} characters) — the co-pilot can score it as soon as you save.`,
    errors: {
      invalid: "That doesn't look like a web link — copy it from the browser's address bar.",
      blocked: "That address can't be opened from CareerPilot.",
      failed: "Couldn't open that page — some sites (like LinkedIn) need a login. Fill in the details by hand.",
      not_html: "That link isn't a web page.",
      too_large: "That page is too large to read.",
      nothing: "No job details found on that page — fill them in by hand.",
    },
  },
  export: {
    button: "Export CSV",
    title: "Download every application as a spreadsheet (CSV)",
    headers: ["Company", "Position", "Stage", "Location", "Salary", "Job link", "Applied on", "Added on", "Last update", "Match score", "Notes"],
  },
  install: {
    button: "Install app",
    title: "Install CareerPilot",
    ios: "In Safari, tap the Share button, then “Add to Home Screen”.",
    other: "Open your browser's menu and choose “Install app” or “Add to Home screen”.",
    close: "Close",
  },
};

const sq: typeof en = {
  importJob: {
    title: "Importo nga linku i punës",
    hint: "Ngjit linkun e shpalljes — kompania, pozita, vendi, paga dhe shpallja e plotë plotësohen vetë.",
    label: "Linku i punës",
    placeholder: "https://jobs.example.com/frontend-developer",
    button: "Importo",
    importing: "Po importohet…",
    done: "U plotësua nga faqja e punës — kontrollo fushat, pastaj ruaje.",
    partial: "Kjo faqe ndan vetëm titullin dhe një përmbledhje të shkurtër — kontrollo fushat dhe ngjite shpalljen e plotë te ✨ Co-pilot më vonë.",
    post: (n) => `✓ Shpallja u importua (${n} karaktere) — co-pilot mund ta vlerësojë sapo ta ruash.`,
    errors: {
      invalid: "Ky nuk duket si link uebi — kopjoje nga shiriti i adresës së shfletuesit.",
      blocked: "Kjo adresë nuk mund të hapet nga CareerPilot.",
      failed: "Faqja nuk u hap dot — disa faqe (si LinkedIn) kërkojnë kyçje. Plotëso të dhënat me dorë.",
      not_html: "Ky link nuk është faqe uebi.",
      too_large: "Kjo faqe është shumë e madhe për t'u lexuar.",
      nothing: "Nuk u gjetën të dhëna pune në këtë faqe — plotësoji me dorë.",
    },
  },
  export: {
    button: "Eksporto CSV",
    title: "Shkarko të gjitha aplikimet si tabelë (CSV)",
    headers: ["Kompania", "Pozita", "Faza", "Vendndodhja", "Paga", "Linku i punës", "Aplikuar më", "Shtuar më", "Përditësuar më", "Pikët e përputhjes", "Shënime"],
  },
  install: {
    button: "Instalo aplikacionin",
    title: "Instalo CareerPilot",
    ios: "Në Safari, prek butonin Ndaj (Share), pastaj “Shto në ekranin bazë” (Add to Home Screen).",
    other: "Hap menynë e shfletuesit dhe zgjidh “Instalo aplikacionin” ose “Shto në ekranin bazë”.",
    close: "Mbyll",
  },
};

export const tools = { en, sq };
