/**
 * 動的ルートを一時的に無効化するスクリプト
 * 静的ビルド時に問題となる動的ルートをリネームして回避
 */
const fs = require('fs');
const path = require('path');

// プロジェクトルートパスの取得
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'src', 'app');

// 無効化する動的ルートのリスト（パスをsrc/appからの相対パスで指定）
const routesToDisable = [
  'songs/[songId]',
  // 他に問題のあるルートがあれば追加
];

// ディレクトリを一時的にリネームする関数
function disableRoute(routePath) {
  const fullPath = path.join(appDir, routePath);
  const disabledPath = `${fullPath}_disabled`;
  
  if (fs.existsSync(fullPath)) {
    console.log(`無効化: ${routePath}`);
    fs.renameSync(fullPath, disabledPath);
    return true;
  } else {
    console.log(`ルートが見つかりません: ${routePath}`);
    return false;
  }
}

// 無効化されたルートを記録
function saveDisabledRoutes(routes) {
  const logFile = path.join(rootDir, '.disabled-routes.json');
  fs.writeFileSync(logFile, JSON.stringify(routes, null, 2));
  console.log(`無効化されたルートを記録: ${logFile}`);
}

// メイン処理
try {
  console.log('=== 動的ルートの一時的無効化 ===');
  
  const disabledRoutes = [];
  
  for (const route of routesToDisable) {
    if (disableRoute(route)) {
      disabledRoutes.push(route);
    }
  }
  
  if (disabledRoutes.length > 0) {
    saveDisabledRoutes(disabledRoutes);
    console.log(`${disabledRoutes.length}個のルートを無効化しました`);
  } else {
    console.log('無効化するルートはありませんでした');
  }
  
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}