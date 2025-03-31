#!/usr/bin/env node

/**
 * 七輪アーカイブ - 完全なデータ変換スクリプト
 * テキストファイルからYAML形式への変換を行う
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ディレクトリ設定
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const YAML_DIR = path.join(ROOT_DIR, 'data_yaml');

// ファイルパス
const INPUT_FILES = {
  liveHistory: path.join(DATA_DIR, 'live_history.txt'),
  setlistHistory: path.join(DATA_DIR, 'setlist_history.txt'),
  discography: path.join(DATA_DIR, 'discography.txt'),
  tracks: path.join(DATA_DIR, 'tracks.txt')
};

const OUTPUT_FILES = {
  lives: path.join(YAML_DIR, 'lives.yml'),
  songs: path.join(YAML_DIR, 'songs.yml'),
  setlists: path.join(YAML_DIR, 'setlists.yml'),
  albums: path.join(YAML_DIR, 'albums.yml'),
  albumTracks: path.join(YAML_DIR, 'album_tracks.yml')
};

// ユーティリティ関数
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

function writeYamlFile(filePath, data) {
  try {
    const yamlContent = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    fs.writeFileSync(filePath, yamlContent);
    console.log(`YAML file written to ${filePath}`);
  } catch (error) {
    console.error(`Error writing YAML file ${filePath}:`, error);
  }
}

// 1. ライブ情報の解析
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

// 2. セットリスト情報の解析
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
      const youtubeUrl = parts.length > 5 ? parts[5].trim() : undefined;
      
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
      
      // セットリストアイテムの作成
      setlists.push({
        liveId,
        songId,
        order,
        type,
        memo: type === 'medley' ? 'メドレー形式で演奏' : '',
        youtubeUrl
      });
    }
  }
  
  return { setlists, songs: Array.from(songs.values()) };
}

// 3. ディスコグラフィ情報の解析
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

// 4. 収録曲情報の解析
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

// エントリーポイント: すべてのデータを変換
async function convertAllData() {
  try {
    console.log('七輪アーカイブ - データ変換を開始します');
    
    // 出力ディレクトリを作成
    ensureDirectoryExists(YAML_DIR);
    
    // 1. ライブ情報の読み込みと変換
    console.log('ライブ情報を読み込んでいます...');
    const liveHistoryText = readTextFile(INPUT_FILES.liveHistory);
    const lives = parseLiveHistory(liveHistoryText);
    console.log(`${lives.length}件のライブ情報を読み込みました`);
    
    // 2. セットリスト情報の読み込みと変換
    console.log('セットリスト情報を読み込んでいます...');
    const setlistHistoryText = readTextFile(INPUT_FILES.setlistHistory);
    const { setlists, songs } = parseSetlistHistory(setlistHistoryText, lives);
    console.log(`${setlists.length}件のセットリスト情報を読み込みました`);
    console.log(`${songs.length}曲の楽曲情報を抽出しました`);
    
    // 3. ディスコグラフィ情報の読み込みと変換
    console.log('ディスコグラフィ情報を読み込んでいます...');
    const discographyText = readTextFile(INPUT_FILES.discography);
    const albums = parseDiscography(discographyText);
    console.log(`${albums.length}件のアルバム情報を読み込みました`);
    
    // 4. 収録曲情報の読み込みと変換
    console.log('収録曲情報を読み込んでいます...');
    const tracksText = readTextFile(INPUT_FILES.tracks);
    const albumTracks = parseTracks(tracksText, albums, songs);
    console.log(`${albumTracks.length}件のアルバム収録曲情報を読み込みました`);
    
    // 5. 欠落しているセットリスト情報の確認 (ID 1-60)
    const liveIdsWithSetlists = new Set(setlists.map(item => item.liveId));
    const livesWithoutSetlists = lives.filter(live => !liveIdsWithSetlists.has(live.id));
    
    console.log(`セットリスト情報がないライブ: ${livesWithoutSetlists.length}件`);
    
    // YAMLファイルに書き込み
    console.log('YAMLファイルを出力しています...');
    writeYamlFile(OUTPUT_FILES.lives, lives);
    writeYamlFile(OUTPUT_FILES.songs, songs);
    writeYamlFile(OUTPUT_FILES.setlists, setlists);
    writeYamlFile(OUTPUT_FILES.albums, albums);
    writeYamlFile(OUTPUT_FILES.albumTracks, albumTracks);
    
    console.log('データ変換が完了しました');
    
    // 統計情報を表示
    console.log('\n===== 変換統計 =====');
    console.log(`ライブ数: ${lives.length}`);
    console.log(`楽曲数: ${songs.length}`);
    console.log(`セットリスト項目数: ${setlists.length}`);
    console.log(`アルバム数: ${albums.length}`);
    console.log(`アルバム収録曲数: ${albumTracks.length}`);
    console.log(`セットリスト情報がないライブ: ${livesWithoutSetlists.length}`);
    
    // セットリスト情報がないライブのリスト
    if (livesWithoutSetlists.length > 0) {
      console.log('\n===== セットリスト情報がないライブ =====');
      livesWithoutSetlists.forEach(live => {
        console.log(`${live.id}: ${live.date} ${live.eventName} @ ${live.venueName}`);
      });
    }
    
  } catch (error) {
    console.error('データ変換中にエラーが発生しました:', error);
    console.error(error.stack);
  }
}

// スクリプト実行
convertAllData();