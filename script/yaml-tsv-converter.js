#!/usr/bin/env node

/**
 * 七輪アーカイブ - YAML⇔TSV変換スクリプト
 * YAMLとTSV形式の相互変換を実行
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ディレクトリ設定 - スクリプトが./script/にある場合を想定
const SCRIPT_DIR = path.dirname(__filename);
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data_yaml');
const TSV_DIR = path.join(ROOT_DIR, 'data_tsv');

// ファイルパス
const YAML_FILES = {
  lives: path.join(DATA_DIR, 'lives.yml'),
  songs: path.join(DATA_DIR, 'songs.yml'),
  setlists: path.join(DATA_DIR, 'setlists.yml'),
  albums: path.join(DATA_DIR, 'albums.yml'),
  albumTracks: path.join(DATA_DIR, 'album_tracks.yml')
};

const TSV_FILES = {
  lives: path.join(TSV_DIR, 'lives.tsv'),
  songs: path.join(TSV_DIR, 'songs.tsv'),
  setlists: path.join(TSV_DIR, 'setlists.tsv'),
  albums: path.join(TSV_DIR, 'albums.tsv'),
  albumTracks: path.join(TSV_DIR, 'album_tracks.tsv')
};

// ユーティリティ関数
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// オブジェクトの配列をTSVへ変換
function arrayToTsv(array) {
  if (!array || !array.length) return '';
  
  // ヘッダー行の作成（最初のオブジェクトのプロパティ名）
  const headers = Object.keys(array[0]);
  const headerRow = headers.join('\t');
  
  // データ行の作成
  const rows = array.map(obj => {
    return headers.map(header => {
      const value = obj[header];
      
      // null/undefined を空文字に変換
      if (value === null || value === undefined) return '';
      
      // 真偽値を 'true'/'false' に変換
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      
      // オブジェクトや配列はJSON文字列に変換
      if (typeof value === 'object') return JSON.stringify(value);
      
      // それ以外はそのまま文字列化
      return String(value);
    }).join('\t');
  });
  
  // すべての行を結合
  return [headerRow, ...rows].join('\n');
}

// TSVをオブジェクトの配列へ変換
function tsvToArray(tsv) {
  if (!tsv || !tsv.trim()) return [];
  
  const lines = tsv.trim().split('\n');
  if (lines.length < 2) return []; // ヘッダーのみの場合は空配列を返す
  
  const headers = lines[0].split('\t');
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const obj = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // 空文字は値に応じて変換
      if (value === '') {
        obj[header] = '';
      }
      // 真偽値の変換
      else if (value === 'true') {
        obj[header] = true;
      }
      else if (value === 'false') {
        obj[header] = false;
      }
      // 数値の変換
      else if (/^-?\d+$/.test(value)) {
        obj[header] = parseInt(value, 10);
      }
      else if (/^-?\d+\.\d+$/.test(value)) {
        obj[header] = parseFloat(value);
      }
      // JSON文字列の検出と変換
      else if (value.startsWith('[') || value.startsWith('{')) {
        try {
          obj[header] = JSON.parse(value);
        } catch (e) {
          obj[header] = value;
        }
      }
      // その他の値はそのまま
      else {
        obj[header] = value;
      }
    });
    
    result.push(obj);
  }
  
  return result;
}

// YAMLをTSVに変換
function convertYamlToTsv() {
  try {
    ensureDirectoryExists(TSV_DIR);
    
    // 各YAMLファイルを処理
    for (const [key, filePath] of Object.entries(YAML_FILES)) {
      console.log(`${filePath} を変換中...`);
      
      // YAMLファイルの読み込み
      const yamlContent = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(yamlContent);
      
      if (!Array.isArray(data)) {
        throw new Error(`${filePath} の内容が配列ではありません`);
      }
      
      // TSVに変換
      const tsvContent = arrayToTsv(data);
      
      // TSVファイルの書き込み
      fs.writeFileSync(TSV_FILES[key], tsvContent);
      console.log(`${TSV_FILES[key]} に書き込みました`);
    }
    
    console.log('YAML→TSV変換が完了しました');
  } catch (err) {
    console.error('変換エラー:', err);
    console.error(err.stack);
  }
}

// TSVをYAMLに変換
function convertTsvToYaml() {
  try {
    // 各TSVファイルを処理
    for (const [key, filePath] of Object.entries(TSV_FILES)) {
      console.log(`${filePath} を変換中...`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`警告: ${filePath} が見つかりません。スキップします。`);
        continue;
      }
      
      // TSVファイルの読み込み
      const tsvContent = fs.readFileSync(filePath, 'utf8');
      const data = tsvToArray(tsvContent);
      
      // YAMLに変換
      const yamlContent = yaml.dump(data, {
        indent: 2,
        lineWidth: -1, // 行の折り返しなし
        noRefs: true, // 参照を使用しない
      });
      
      // YAMLファイルの書き込み
      fs.writeFileSync(YAML_FILES[key], yamlContent);
      console.log(`${YAML_FILES[key]} に書き込みました`);
    }
    
    console.log('TSV→YAML変換が完了しました');
  } catch (err) {
    console.error('変換エラー:', err);
    console.error(err.stack);
  }
}

// 元のTXTデータをYAMLに変換する関数

// ライブ情報の解析
function parseLiveHistory(content) {
  const lives = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  let skipHeader = false;
  if (lines.length > 0 && lines[0].includes('出演イベントID')) {
    skipHeader = true;
  }
  
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    
    if (parts.length >= 3) {
      const eventId = parts[0].trim();
      const date = parts[1].trim().replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/, (_, year, month, day) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      });
      const eventVenue = parts[2].trim();
      
      // "イベント名@会場名" を分割
      const match = eventVenue.match(/(.*?)@(.*)/);
      if (match) {
        const [, eventName, venueName] = match;
        
        lives.push({
          id: `live${String(eventId).padStart(3, '0')}`,
          eventId: parseInt(eventId),
          date,
          eventName: eventName.trim(),
          venueName: venueName.trim(),
          memo: parts[3] ? parts[3].trim() : ''
        });
      }
    }
  }
  
  return lives;
}

// セットリスト情報の解析
function parseSetlistHistory(content, lives) {
  const setlists = [];
  const songs = new Map(); // 曲名 -> 曲情報
  const lines = content.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  let skipHeader = false;
  if (lines.length > 0 && lines[0].includes('出演イベントID')) {
    skipHeader = true;
  }
  
  // イベントID -> ライブIDのマッピング
  const eventIdToLiveId = {};
  lives.forEach(live => {
    eventIdToLiveId[live.eventId] = live.id;
  });
  
  let nextSongId = 1;
  
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    
    if (parts.length >= 5) {
      const eventId = parts[0].trim();
      const songTitle = parts[2].trim();
      const order = parseInt(parts[3].trim());
      const type = parts[4].trim().toLowerCase() === 'メドレー' ? 'medley' : 'individual';
      
      // YouTube URL（存在する場合）
      const youtubeUrl = parts.length >= 6 ? parts[5].trim() : '';
      
      // ライブIDの取得
      const liveId = eventIdToLiveId[eventId];
      if (!liveId) {
        console.warn(`Warning: No matching live found for event ID ${eventId}`);
        continue;
      }
      
      // 曲情報の取得または作成
      let songId;
      if (!songs.has(songTitle)) {
        songId = `song${String(nextSongId).padStart(3, '0')}`;
        songs.set(songTitle, {
          id: songId,
          title: songTitle,
          album: '',  // 後で補完
          releaseDate: '',
          trackNumber: 0,
          isSingle: false
        });
        nextSongId++;
      } else {
        songId = songs.get(songTitle).id;
      }
      
      // セットリストアイテムの作成（YouTubeリンク情報を追加）
      setlists.push({
        liveId,
        songId,
        order,
        type,
        memo: type === 'medley' ? 'メドレー形式で演奏' : '',
        youtubeUrl: youtubeUrl || undefined
      });
    }
  }
  
  return { setlists, songs: Array.from(songs.values()) };
}

// ディスコグラフィ情報の解析
function parseDiscography(content) {
  const albums = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  let skipHeader = false;
  if (lines.length > 0 && lines[0].includes('カテゴリ')) {
    skipHeader = true;
  }
  
  let nextAlbumId = 1;
  
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    
    if (parts.length >= 4) {
      const category = parts[0].trim();
      const subCategory = parts[1].trim();
      const title = parts[2].trim();
      const releaseDate = parts[3].trim();
      
      const id = `album${String(nextAlbumId).padStart(3, '0')}`;
      nextAlbumId++;
      
      albums.push({
        id,
        title,
        category,
        subCategory,
        releaseDate
      });
    }
  }
  
  return albums;
}

// 収録曲情報の解析
function parseTracks(content, albums, songs) {
  const albumTracks = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  let skipHeader = false;
  if (lines.length > 0 && lines[0].includes('ディスコグラフィ')) {
    skipHeader = true;
  }
  
  // アルバム名 -> アルバムIDのマッピング
  const albumTitleToId = {};
  albums.forEach(album => {
    albumTitleToId[album.title] = album.id;
  });
  
  // 曲名 -> 曲IDのマッピング
  const songTitleToId = {};
  songs.forEach(song => {
    songTitleToId[song.title] = song.id;
  });
  
  // 曲情報の補完用マップ
  const songInfo = new Map();
  
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    
    if (parts.length >= 3) {
      const albumTitle = parts[0].trim();
      const songTitle = parts[1].trim();
      const trackNumber = parseInt(parts[2].trim());
      
      // アルバムIDの取得
      const albumId = albumTitleToId[albumTitle];
      if (!albumId) {
        console.warn(`Warning: No matching album found for title "${albumTitle}"`);
        continue;
      }
      
      // 曲IDの取得
      const songId = songTitleToId[songTitle];
      if (!songId) {
        console.warn(`Warning: No matching song found for title "${songTitle}"`);
        continue;
      }
      
      // アルバムトラック情報の作成
      albumTracks.push({
        albumId,
        songId,
        trackNumber
      });
      
      // 曲情報を収集（後で曲情報を補完するため）
      if (!songInfo.has(songId)) {
        songInfo.set(songId, {
          albumId,
          trackNumber,
          releaseDate: albums.find(a => a.id === albumId)?.releaseDate || '',
          isSingle: albums.find(a => a.id === albumId)?.category === 'シングル'
        });
      }
    }
  }
  
  // 曲情報の補完
  songs.forEach(song => {
    const info = songInfo.get(song.id);
    if (info) {
      song.album = albums.find(a => a.id === info.albumId)?.title || '';
      song.releaseDate = info.releaseDate;
      song.trackNumber = info.trackNumber;
      song.isSingle = info.isSingle;
    }
  });
  
  return albumTracks;
}

// コマンドライン引数に基づいて処理を分岐
const args = process.argv.slice(2);
const mode = args[0];

switch (mode) {
  case 'to-tsv':
    convertYamlToTsv();
    break;
    
  case 'to-yaml':
    convertTsvToYaml();
    break;
    
  case 'from-txt':
    // テキストファイルから直接YAMLを生成する処理（必要に応じて実装）
    console.log('Not implemented yet: Converting TXT to YAML');
    break;
    
  default:
    console.log('使用方法:');
    console.log('  node yaml-tsv-converter.js to-tsv  - YAMLファイルをTSVに変換');
    console.log('  node yaml-tsv-converter.js to-yaml - TSVファイルをYAMLに変換');
    console.log('  node yaml-tsv-converter.js from-txt - TXTファイルからYAMLに変換 (未実装)');
    break;
}