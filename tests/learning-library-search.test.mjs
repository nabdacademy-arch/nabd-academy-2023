import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {CATALOG} from '../learning/content.mjs';
import {normalizeSearch,escapeHTML,safeURL} from '../learning/core.mjs';

const app=readFileSync(new URL('../learning/app.mjs',import.meta.url),'utf8');
const cards=app.slice(app.indexOf('function libraryCards('),app.indexOf('function graph('));
function results(query,topic='all',bookmarks=[]) {
  const html=runInNewContext(cards+';libraryCards(topic)',{
    CATALOG,normalizeSearch,query,topic,bookmarks,esc:escapeHTML,safeURL,
    text:note=>note.ar,t:ar=>ar,tag:()=>'',icon:()=>''
  });
  return Array.from(html.matchAll(/data-bookmark="([^"]+)"/g), match=>match[1]);
}

test('Arabic spelling, vowel marks and word order match catalog descriptions',()=>{
  assert.deepEqual(results('  اَبْحَاث   فهرس  '),['pubmed']);
});
test('English terms match across title and description and respect filters',()=>{
  assert.deepEqual(results(' textbook   OPENSTAX ','anatomy'),['openstax']);
  assert.deepEqual(results('textbook openstax','general'),[]);
  assert.deepEqual(results('textbook openstax','saved'),[]);
  assert.deepEqual(results('textbook openstax','saved',['openstax']),['openstax']);
});
test('empty search retains catalog order and missing terms exclude a resource',()=>{
  assert.deepEqual(results('   '),CATALOG.sources.map(source=>source.id));
  assert.deepEqual(results('pubmed nonexistentword'),[]);
});
