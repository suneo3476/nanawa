/**
 * 無効化された動的ルートを復元するスクリプト
 * ビルド後に無効化されたルートを元に戻す
 */
const fs = require('fs');
const path = require('path');

// プロジェクトルートパスの取得
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'src', 'app');
const logFile = path.join(rootDir, '.disabled-routes.json');

// 無効化されたルートを復元する関数
function restoreDisabledRoutes() {
  // 記録ファイルが存在するか確認
  if (!fs.existsSync(logFile)) {
    console.log('無効化されたルートの記録が見つかりません');
    return;
  }
  
  // 無効化されたルートのリストを読み込む
  const disabledRoutes = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  
  if (disabledRoutes.length === 0) {
    console.log('復元するルートはありません');
    return;
  }
  
  console.log(`${disabledRoutes.length}個のルートを復元します`);
  
  // 各ルートを復元
  for (const route of disabledRoutes) {
    const fullPath = path.join(appDir, route);
    const disabledPath = `${fullPath}_disabled`;
    
    if (fs.existsSync(disabledPath)) {
      console.log(`復元: ${route}`);
      fs.renameSync(disabledPath, fullPath);
    } else {
      console.log(`無効化されたディレクトリが見つかりません: ${disabledPath}`);
    }
  }
  
  // 記録ファイルを削除
  fs.unlinkSync(logFile);
  console.log('復元完了: 記録ファイルを削除しました');
}

// メイン処理
try {
  console.log('=== 動的ルートの復元 ===');
  restoreDisabledRoutes();
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}