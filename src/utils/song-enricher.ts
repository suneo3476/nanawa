// src/utils/song-enricher.ts

import fs from 'fs/promises';
import path from 'path';
import type { Song } from '@/types/song';

/**
 * aikoディスコグラフィと収録曲データを使用して楽曲情報を充実させる
 */
export async function enrichSongData(songs: Song[]): Promise<Song[]> {
  try {
    // 1. ディスコグラフィと収録曲データを読み込む
    const discographyPath = path.join(process.cwd(), 'data', 'discography.txt');
    const tracksPath = path.join(process.cwd(), 'data', 'tracks.txt');
    
    const [discographyText, tracksText] = await Promise.all([
      fs.readFile(discographyPath, 'utf8'),
      fs.readFile(tracksPath, 'utf8')
    ]);
    
    // 2. ディスコグラフィデータの解析
    const albums = parseDiscography(discographyText);
    
    // 3. 収録曲データの解析
    const tracks = parseTracks(tracksText);
    
    // 4. 解析したデータを使って曲情報を豊かにする
    const enrichedSongs = songs.map(song => {
      // 曲名で検索
      const trackInfo = tracks.find(track => track.title === song.title);
      
      if (trackInfo) {
        // アルバム情報を取得
        const albumInfo = albums.find(album => album.title === trackInfo.album);
        
        return {
          ...song,
          album: trackInfo.album || song.album,
          releaseDate: albumInfo?.releaseDate || song.releaseDate,
          trackNumber: trackInfo.trackNumber,
          // アルバムカテゴリを追加（シングル/アルバム/ベスト）
          albumCategory: albumInfo?.category || '',
          // 楽曲の種類を追加（シングル曲/アルバム曲）
          isSingle: albumInfo?.category === 'シングル'
        };
      }
      
      return song;
    });
    
    return enrichedSongs;
  } catch (error) {
    console.error('Song enrichment failed:', error);
    // エラーが発生した場合は元のデータを返す
    return songs;
  }
}

/**
 * ディスコグラフィデータを解析
 */
function parseDiscography(data: string): Array<{
  category: string;
  subCategory: string;
  title: string;
  releaseDate: string;
}> {
  const result = [];
  const lines = data.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 4) {
      result.push({
        category: parts[0].trim(),
        subCategory: parts[1].trim(),
        title: parts[2].trim(),
        releaseDate: parts[3].trim()
      });
    }
  }
  
  return result;
}

/**
 * 収録曲データを解析
 */
function parseTracks(data: string): Array<{
  album: string;
  title: string;
  trackNumber: number;
}> {
  const result = [];
  const lines = data.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 3) {
      result.push({
        album: parts[0].trim(),
        title: parts[1].trim(),
        trackNumber: parseInt(parts[2].trim(), 10)
      });
    }
  }
  
  return result;
}

/**
 * 曲情報をさらに分析して最初のリリース情報を特定
 * （同じ曲名が複数のアルバムに収録されている場合に対応）
 */
export async function analyzeSongReleaseHistory(songs: Song[]): Promise<Song[]> {
  try {
    // 収録曲データとディスコグラフィデータを読み込む
    const tracksText = await fs.readFile(path.join(process.cwd(), 'data', 'tracks.txt'), 'utf8');
    const discographyText = await fs.readFile(path.join(process.cwd(), 'data', 'discography.txt'), 'utf8');
    
    const tracks = parseTracks(tracksText);
    const albums = parseDiscography(discographyText);
    
    return songs.map(song => {
      // この曲名が含まれる全トラック
      const songTracks = tracks.filter(track => track.title === song.title);
      
      if (songTracks.length === 0) {
        return song;
      }

      // 各トラックのアルバム情報とリリース日を取得
      const trackDetails = songTracks.map(track => {
        const albumInfo = albums.find(album => album.title === track.album);
        return {
          album: track.album,
          releaseDate: albumInfo?.releaseDate || '',
          releaseYear: albumInfo?.releaseDate ? 
            new Date(albumInfo.releaseDate).getFullYear() : 9999,
          category: albumInfo?.category || '',
          subCategory: albumInfo?.subCategory || ''
        };
      });

      // まず同じ年のリリースがあるか確認
      const uniqueYears = [...new Set(trackDetails
        .filter(t => t.releaseYear !== 9999)
        .map(t => t.releaseYear))];

      let firstRelease;

      if (uniqueYears.length > 0) {
        // 最も古い年を取得
        const earliestYear = Math.min(...uniqueYears);
        
        // その年のリリースをフィルタリング
        const releasesInEarliestYear = trackDetails.filter(t => 
          t.releaseYear === earliestYear
        );
        
        // 同じ年にシングルとアルバムがある場合は、シングルを優先
        const singlesInEarliestYear = releasesInEarliestYear.filter(t => 
          t.category === 'シングル'
        );
        
        if (singlesInEarliestYear.length > 0) {
          // シングルの中で最初のものを選択
          firstRelease = singlesInEarliestYear[0];
        } else {
          // シングルがなければそのまま最初のリリースを使用
          firstRelease = releasesInEarliestYear[0];
        }
      } else {
        // 年の情報がない場合は単純に最初のリリースを使用
        firstRelease = trackDetails[0];
      }

      // すべての収録作品のリスト（重複除去）
      const appearsOn = Array.from(new Set(trackDetails.map(t => t.album)));

      // シングル曲かどうかの判定
      const isSingle = trackDetails.some(t => t.category === 'シングル');

      return {
        ...song,
        // 初リリース情報を優先して設定
        album: firstRelease.album,
        releaseDate: firstRelease.releaseDate,
        
        // 追加情報
        firstRelease: firstRelease,
        isSingle: isSingle,
        appearsOn: appearsOn
      };
    });
  } catch (error) {
    console.error('Song release history analysis failed:', error);
    return songs;
  }
}

/**
 * 曲の収録作品リストをフォーマットする
 * リリース年の古い順にソートし、カテゴリ情報を括弧で追加
 */
export function formatSongAppearances(song: Song, albums: any[]): string[] {
  if (!song.appearsOn || song.appearsOn.length === 0) {
    return [];
  }

  // 曲が収録されている全アルバム情報を取得
  const appearances = song.appearsOn.map(albumTitle => {
    const albumInfo = albums.find(a => a.title === albumTitle);
    if (!albumInfo) {
      return {
        title: albumTitle,
        formattedTitle: albumTitle,
        releaseDate: '',
        releaseYear: 9999 // 不明な場合は最後にソート
      };
    }

    // フォーマットされたタイトル
    const formattedTitle = `${albumTitle} (${albumInfo.subCategory}・${albumInfo.category})`;
    
    // リリース年を抽出
    const releaseYear = albumInfo.releaseDate ? 
      parseInt(albumInfo.releaseDate.split('-')[0]) : 9999;
    
    return {
      title: albumTitle,
      formattedTitle: formattedTitle,
      releaseDate: albumInfo.releaseDate || '',
      releaseYear: releaseYear
    };
  });
  
  // リリース年の古い順（若い順）でソート
  appearances.sort((a, b) => a.releaseYear - b.releaseYear);
  
  // フォーマットされたタイトルの配列を返す
  return appearances.map(item => item.formattedTitle);
}