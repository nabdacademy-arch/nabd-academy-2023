"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const migration=read("supabase/migrations/20261122_split_research_public_access_rls.sql");
const js=read("assets/js/research-center.js");
const home=read("index.html");
const news=read("research-news.html");
const css=read("assets/css/research-center.css");

test("anonymous RLS reads only published papers without touching private publisher grants",()=>{
 assert.match(migration,/drop policy if exists "Published research is publicly readable and authors can manage " on public\.nabd_research_papers/);
 assert.match(migration,/create policy "NABD research public published papers"/);
 assert.match(migration,/for select to anon, authenticated\s+using \(status = 'published'\)/);
 assert.match(migration,/create policy "NABD research authors own papers"/);
 assert.match(migration,/for select to authenticated\s+using \(/);
 assert.match(migration,/revoke all on public\.nabd_research_publishers from anon/);
 assert.doesNotMatch(migration,/grant\s+select\s+on\s+public\.nabd_research_publishers\s+to\s+anon/i);
});

test("anonymous PDF access is restricted to files linked to published research",()=>{
 assert.match(migration,/drop policy if exists "Public may read PDF only for published NABD papers"/);
 assert.match(migration,/create policy "NABD public research PDFs for published papers"/);
 assert.match(migration,/bucket_id = 'nabd-research-pdfs'/);
 assert.match(migration,/p\.pdf_path = name and p\.status = 'published'/);
 assert.match(migration,/create policy "NABD research publishers own PDF files"/);
 assert.match(migration,/for select to authenticated\s+using \(/);
 assert.match(migration,/rp\.user_id = \(select auth\.uid\(\)\) and rp\.active = true/);
});

test("home and research news use updated assets and keep real DB-backed publications",()=>{
 assert.match(js,/\.from\("nabd_research_papers"\)/);
 assert.match(js,/\.eq\("status","published"\)/);
 assert.match(js,/\.createSignedUrl\(item\.pdf_path, 600\)/);
 assert.match(home,/data-research-home/);
 assert.match(news,/data-research-list/);
 for(const source of [home,news]){
  assert.match(source,/assets\/js\/research-center\.js\?v=4/);
  assert.match(source,/assets\/css\/research-center\.css\?v=4/);
 }
 assert.doesNotThrow(()=>new Function(js));
});

test("temporary failures retain loaded research and show a proper retry button",()=>{
 assert.match(js,/let publicLoaded = false/);
 assert.match(js,/function showPublicLoadError\(message\)/);
 assert.match(js,/button\.textContent = "إعادة تحميل الأبحاث ↻"/);
 assert.match(js,/button\.addEventListener\("click", \(\) => fetchPublic\(\)\)/);
 assert.match(js,/if \(!publicLoaded\) showPublicLoadError\(message\)/);
 assert.match(js,/publicLoaded = true/);
 assert.match(js,/الأبحاث المعروضة هي آخر نسخة تم تحميلها بنجاح/);
 assert.match(css,/\.nabd-research \.res-retry-panel/);
});
