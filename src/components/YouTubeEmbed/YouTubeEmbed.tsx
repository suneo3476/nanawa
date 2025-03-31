// src/components/YouTubeEmbed/YouTubeEmbed.tsx

'use client';

import React, { useState } from 'react';
import { Youtube, ExternalLink, PlayCircle } from 'lucide-react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  autoEmbed?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  url,
  title = '動画を再生',
  autoEmbed = false,
}) => {
  const [isEmbedded, setIsEmbedded] = useState(autoEmbed);

  // YouTubeのURLからvideo IDとタイムスタンプを抽出
  const extractVideoInfo = (url: string) => {
    try {
      const videoUrl = new URL(url);
      
      // youtu.be形式のURLからIDを抽出
      if (videoUrl.hostname === 'youtu.be') {
        const videoId = videoUrl.pathname.substring(1);
        const startTime = videoUrl.searchParams.get('t') || 
                          videoUrl.searchParams.get('start') || '0';
        return { videoId, startTime };
      }
      
      // youtube.com形式のURLからIDを抽出
      if (videoUrl.hostname.includes('youtube.com')) {
        const videoId = videoUrl.searchParams.get('v');
        
        // 時間パラメータの抽出（t=123形式またはstart=123形式）
        let startTime = videoUrl.searchParams.get('t') || 
                        videoUrl.searchParams.get('start') || '0';
                        
        // ?si=xxxx&t=123 形式への対応
        if (url.includes('&t=')) {
          const tMatch = url.match(/&t=(\d+)/);
          if (tMatch && tMatch[1]) {
            startTime = tMatch[1];
          }
        }
        
        return { videoId, startTime };
      }
      
      // 対応していないURL形式
      return { videoId: null, startTime: '0' };
    } catch (error) {
      console.error('Invalid YouTube URL:', error);
      return { videoId: null, startTime: '0' };
    }
  };

  const { videoId, startTime } = extractVideoInfo(url);

  if (!videoId) {
    return (
      <div className="text-red-500 text-sm">
        無効なYouTube URL: {url}
      </div>
    );
  }

  // 埋め込みモードでなければ、再生ボタンのみ表示
  if (!isEmbedded) {
    return (
      <div className="mt-2">
        <button
          onClick={() => setIsEmbedded(true)}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          aria-label={`${title}を埋め込みモードで再生`}
        >
          <PlayCircle size={16} />
          <Youtube size={16} />
          <span>{title}</span>
        </button>
      </div>
    );
  }

  // 埋め込み用のURLを生成
  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}&rel=0`;

  return (
    <div className="mt-3 mb-5">
      <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-lg bg-gray-100">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <button
          onClick={() => setIsEmbedded(false)}
          className="text-gray-600 hover:text-gray-800"
          aria-label="埋め込み動画を閉じる"
        >
          埋め込み動画を閉じる
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          aria-label="YouTubeで視聴"
        >
          <ExternalLink size={14} />
          YouTubeで視聴
        </a>
      </div>
    </div>
  );
};