// // src/app/timeline/page.tsx

import { redirect } from 'next/navigation';

// タイムライン単独ページへのアクセスをリダイレクト
export default function TimelinePage() {
  // LiveViewIntegratedコンポーネントに処理を一元化するためリダイレクト
  // タイムラインモードを指定するクエリパラメータを付与
  redirect('/lives?view=timeline');
}