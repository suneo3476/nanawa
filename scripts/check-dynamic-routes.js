/**
 * 動的ルートの確認スクリプト
 * Next.jsアプリの動的ルートをチェックし、generateStaticParamsの実装状況を確認
 */
const fs = require('fs');
const path = require('path');

// プロジェクトルートパスの取得
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'src', 'app');

// 動的ルートを検索する関数（角括弧[...]を含むディレクトリ）
function findDynamicRoutes(dir, routes = []) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping.`);
    return routes;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // 動的ルートディレクトリを検出（[param]形式）
      if (item.name.startsWith('[') && item.name.endsWith(']')) {
        routes.push({
          path: itemPath.replace(rootDir, ''),
          name: item.name,
          hasPage: false,
          hasGenerateStaticParams: false
        });
      }
      
      // 再帰的に検索
      findDynamicRoutes(itemPath, routes);
    }
  }
  
  return routes;
}

// ページファイルとgenerateStaticParamsの存在を確認
function checkGenerateStaticParams(routes) {
  for (const route of routes) {
    const routeDir = path.join(rootDir, route.path);
    const possiblePageFiles = [
      path.join(routeDir, 'page.js'),
      path.join(routeDir, 'page.jsx'),
      path.join(routeDir, 'page.ts'),
      path.join(routeDir, 'page.tsx')
    ];
    
    // ページファイルの存在を確認
    for (const pageFile of possiblePageFiles) {
      if (fs.existsSync(pageFile)) {
        route.hasPage = true;
        route.pageFile = pageFile;
        
        // ファイル内容を読み取り、generateStaticParamsの存在を確認
        const content = fs.readFileSync(pageFile, 'utf-8');
        if (content.includes('generateStaticParams')) {
          route.hasGenerateStaticParams = true;
        }
        
        break;
      }
    }
  }
  
  return routes;
}

// メイン処理
try {
  console.log('=== 動的ルートの確認 ===');
  
  // 動的ルートを検索
  const dynamicRoutes = findDynamicRoutes(appDir);
  
  if (dynamicRoutes.length === 0) {
    console.log('動的ルートは見つかりませんでした。');
    process.exit(0);
  }
  
  // 各ルートのgenerateStaticParamsを確認
  const checkedRoutes = checkGenerateStaticParams(dynamicRoutes);
  
  // 結果を表示
  console.log(`\n${checkedRoutes.length}個の動的ルートが見つかりました：\n`);
  
  const issueRoutes = [];
  
  checkedRoutes.forEach((route, index) => {
    console.log(`${index + 1}. ${route.path}`);
    console.log(`   ページファイル: ${route.hasPage ? '✓ 存在します' : '✗ 見つかりません'}`);
    if (route.hasPage) {
      console.log(`   generateStaticParams: ${route.hasGenerateStaticParams ? '✓ 実装済み' : '✗ 未実装'}`);
      
      if (!route.hasGenerateStaticParams) {
        issueRoutes.push(route);
      }
    }
    console.log('');
  });
  
  // 問題のあるルートがある場合、解決方法を示す
  if (issueRoutes.length > 0) {
    console.log('=== 静的エクスポートで問題となる可能性のあるルート ===');
    issueRoutes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.path} - generateStaticParams()が必要です`);
    });
    
    console.log('\n解決策:');
    console.log('1. 各ルートのページファイルにgenerateStaticParams()関数を追加する');
    console.log('2. または、一時的にこれらのルートを無効化することで問題を回避する');
  } else {
    console.log('すべての動的ルートは静的エクスポートに対応しています。');
  }
  
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}
