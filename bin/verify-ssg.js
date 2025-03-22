#!/usr/bin/env node
// bin/verify-ssg.js

const fs = require('fs');
const path = require('path');

// 生成されたファイルを確認
const outDir = path.join(process.cwd(), 'out');

// 必須ページの確認
const requiredPages = [
  'index.html',
  'search/index.html',
  'stats/index.html',
  'heatmap/index.html'
];

// ライブ詳細ページが生成されていることを確認
function checkLivePages() {
  const livesDir = path.join(outDir, 'lives');
  if (!fs.existsSync(livesDir)) {
    console.error('❌ Lives directory missing');
    return false;
  }
  
  const livePages = fs.readdirSync(livesDir);
  if (livePages.length === 0) {
    console.error('❌ No live pages generated');
    return false;
  }
  
  console.log(`✅ Found ${livePages.length} live pages`);
  return true;
}

// 楽曲詳細ページが生成されていることを確認
function checkSongPages() {
  const songsDir = path.join(outDir, 'songs');
  if (!fs.existsSync(songsDir)) {
    console.error('❌ Songs directory missing');
    return false;
  }
  
  const songPages = fs.readdirSync(songsDir);
  if (songPages.length === 0) {
    console.error('❌ No song pages generated');
    return false;
  }
  
  console.log(`✅ Found ${songPages.length} song pages`);
  return true;
}

function verifySSG() {
  if (!fs.existsSync(outDir)) {
    console.error('❌ Output directory not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  let success = true;
  
  // 必須ページの確認
  for (const page of requiredPages) {
    const pagePath = path.join(outDir, page);
    if (!fs.existsSync(pagePath)) {
      console.error(`❌ Required page missing: ${page}`);
      success = false;
    } else {
      console.log(`✅ Found required page: ${page}`);
    }
  }
  
  // ライブ・楽曲ページの確認
  success = checkLivePages() && success;
  success = checkSongPages() && success;
  
  if (success) {
    console.log('✅ All pages successfully generated');
  } else {
    console.error('❌ Some pages are missing');
    process.exit(1);
  }
}

verifySSG();