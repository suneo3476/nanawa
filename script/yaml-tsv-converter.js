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
    
  default:
    console.log('使用方法:');
    console.log('  node yaml-tsv-converter.js to-tsv  - YAMLファイルをTSVに変換');
    console.log('  node yaml-tsv-converter.js to-yaml - TSVファイルをYAMLに変換');
    break;
}