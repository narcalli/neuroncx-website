/**
 * The styles of the directory's filter pills, list rows and cards
 * (DirectoryList). Used by the Customer Directory block and the directory
 * card design, so both draw the same list. Three cards per row on wide
 * screens unless --dir-cols says otherwise.
 */
export const directoryListCss = `        .ncx-dir__pills{display:flex;flex-wrap:wrap;gap:10px}
        .ncx-dir__pills button{padding:8px 18px;border-radius:999px;border:1px solid var(--ncx-rule);background:var(--ncx-white);color:var(--ncx-ink);font:500 13px var(--font-body),Arial,sans-serif;cursor:pointer}
        .ncx-dir__pills button.is-active{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-dir__list{list-style:none;margin:0;padding:0;background:var(--ncx-white);border-radius:12px;border:1px solid var(--ncx-rule);overflow:hidden}
        .ncx-dir__row{display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:22px 28px;border-bottom:1px solid var(--ncx-rule-soft)}
        .ncx-dir__row:last-child{border-bottom:0}
        .ncx-dir__text{flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:2px}
        .ncx-dir__name{font-weight:600;font-size:15px;color:var(--ncx-ink);text-decoration:none}
        a.ncx-dir__name:hover{color:var(--ncx-link);text-decoration:underline}
        .ncx-dir__summary{margin:0;font-size:13px;color:var(--ncx-muted)}
        .ncx-dir__tags{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
        .ncx-dir__tag{padding:4px 12px;border-radius:999px;background:var(--ncx-cloud);font-weight:500;font-size:12px;color:var(--ncx-ink)}
        .ncx-dir__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:20px}
        @media(min-width:860px){.ncx-dir__cards{grid-template-columns:repeat(var(--dir-cols,3),minmax(0,1fr))}}
        .ncx-dir__card{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:10px}
        .ncx-dir__empty{margin:0;padding:32px 0;text-align:center;font-style:italic;font-size:14px;color:var(--ncx-muted)}
      `
