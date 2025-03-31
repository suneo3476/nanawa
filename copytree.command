#!/bin/bash

# 色の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# コピーモードを取得
MODE=${1:-"core"}

# 共通のコピー先ディレクトリ
COPY_DIR="./knowledge"

# フラットにコピーする関数
flat_copy() {
  local src="$1"
  local dst="$2"
  
  # ファイル名を取得
  local filename=$(basename "$src")
  
  # 元のパスを構造情報として保存
  local original_path=$(echo "$src" | sed 's/^\.\///')
  
  # 同名ファイルがある場合は、パス情報をファイル名に付与
  if [ -f "${dst}/${filename}" ]; then
    # パスからディレクトリ名を抽出し、区切り文字を_に変換
    local path_part=$(dirname "$original_path" | tr '/' '_')
    local new_filename="${path_part}_${filename}"
    echo "Duplicate file renamed: $filename -> $new_filename"
    cp "$src" "${dst}/${new_filename}"
  else
    cp "$src" "${dst}/"
  fi
  
  # 元のパス情報をファイルリストに追加
  echo "$original_path" >> "${dst}/_file_paths.txt"
}

# コピー先ディレクトリが存在しなければ作成
mkdir -p "${COPY_DIR}"

echo -e "${YELLOW}Running in ${MODE} mode...${NC}"

# モード別のコピー処理
case "${MODE}" in
  "clear")
    # knowledgeディレクトリをクリア
    echo -e "${YELLOW}Clearing ${COPY_DIR} directory...${NC}"
    rm -rf "${COPY_DIR}"
    mkdir -p "${COPY_DIR}"
    echo -e "${GREEN}${COPY_DIR} directory cleared successfully.${NC}"
    exit 0
    ;;

  "core")
    # コアファイル - 基本的な開発に必要な最小限のファイル
    echo -e "${GREEN}Copying core files...${NC}"
    
    # TypeScriptファイルをコピー
    for file in $(find ./src -type f \( -name "*.tsx" -o -name "*.ts" \)); do
      flat_copy "$file" "${COPY_DIR}"
    done
    
    # 設定ファイルをコピー
    flat_copy next.config.mjs "${COPY_DIR}"
    flat_copy tailwind.config.ts "${COPY_DIR}"
    flat_copy package.json "${COPY_DIR}"
    ;;
    
  "src")
    # src ディレクトリの全ファイルを再帰的にコピー
    echo -e "${GREEN}Copying all files from src directory...${NC}"
    
    for file in $(find ./src -type f); do
      flat_copy "$file" "${COPY_DIR}"
    done
    ;;
    
  "data")
    # データモデル関連ファイル
    echo -e "${GREEN}Copying data model files...${NC}"
    
    # 型定義ファイル
    for file in $(find ./src/types -type f); do
      flat_copy "$file" "${COPY_DIR}"
    done
    
    # データ関連ユーティリティ
    for file in $(find ./src/utils -name "*data*.ts"); do
      flat_copy "$file" "${COPY_DIR}"
    done
    
    # サンプルデータのみコピー
    flat_copy ./data_yaml/lives.yml "${COPY_DIR}"
    flat_copy ./data_yaml/songs.yml "${COPY_DIR}"
    flat_copy ./data_tsv/lives.tsv "${COPY_DIR}"
    flat_copy ./data_tsv/songs.tsv "${COPY_DIR}"
    flat_copy ./script/yaml-tsv-converter.js "${COPY_DIR}"
    flat_copy ./script/yaml-tsv.sh "${COPY_DIR}"
    ;;
    
  "docs")
    # ドキュメント関連ファイル
    echo -e "${GREEN}Copying documentation files...${NC}"
    
    # プロジェクトルートのマークダウンファイル
    for file in $(find . -maxdepth 1 -name "*.md"); do
      flat_copy "$file" "${COPY_DIR}"
    done
    
    # 実装進捗ファイル
    for file in $(find . -path "*/実装進捗*.md"); do
      flat_copy "$file" "${COPY_DIR}"
    done
    
    # docsディレクトリ内のすべてのファイルを再帰的にコピー
    if [ -d "./docs" ]; then
      echo -e "${GREEN}Copying files from docs directory...${NC}"
      for file in $(find ./docs -type f); do
        flat_copy "$file" "${COPY_DIR}"
      done
    fi
    ;;
    
  "all")
    # 全ファイル（gitignore対象外）
    echo -e "${GREEN}Copying all files (excluding node_modules, .next, etc.)...${NC}"
    
    for file in $(find . -type f \
      \( ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/.git/*' ! -path '*/out/*' \) \
      \( ! -name 'package-lock.json' \)); do
      
      flat_copy "$file" "${COPY_DIR}"
    done
    ;;
    
  "custom")
    # カスタムコピー - 特定の機能に関連するファイルのみ
    echo -e "${YELLOW}Please enter the feature name to copy (e.g. Heatmap, YouTube):${NC}"
    read FEATURE
    echo -e "${GREEN}Copying files related to ${FEATURE}...${NC}"
    
    # 関連ファイルを検索
    FEATURE_FILES=$(find ./src -type f -exec grep -l "${FEATURE}" {} \; 2>/dev/null)
    
    if [ -z "$FEATURE_FILES" ]; then
      echo -e "${YELLOW}No files found containing '${FEATURE}'${NC}"
    else
      # 見つかったファイルをコピー
      for file in $FEATURE_FILES; do
        flat_copy "$file" "${COPY_DIR}"
        
        # ファイル名から関連ファイルも探す
        BASENAME=$(basename "$file" | sed 's/\.[^.]*$//')
        if [ ! -z "$BASENAME" ]; then
          for related in $(find ./src -name "*${BASENAME}*" 2>/dev/null); do
            flat_copy "$related" "${COPY_DIR}"
          done
        fi
      done
    fi
    ;;
    
  *)
    echo -e "${RED}Unknown mode: ${MODE}${NC}"
    echo -e "${YELLOW}Available modes:${NC}"
    echo -e "  core   - Essential source code for development"
    echo -e "  src    - All files in src directory recursively"
    echo -e "  data   - Data models and sample data"
    echo -e "  docs   - Documentation files"
    echo -e "  custom - Custom selection based on feature name"
    echo -e "  all    - All non-ignored files"
    echo -e "  clear  - Clear the knowledge directory"
    exit 1
    ;;
esac

# コピーしたファイル数をカウント
FILE_COUNT=$(find "${COPY_DIR}" -type f | wc -l)

# 実行結果を表示
echo -e "\n${GREEN}Copy complete!${NC}"
echo -e "${YELLOW}Total files in knowledge: ${FILE_COUNT}${NC}"
echo -e "Files are available in: ${COPY_DIR}"

# プロジェクト構造を生成（毎回更新）
echo -e "${GREEN}Generating project structure information...${NC}"

# オリジナルのディレクトリ構造をtree.txtに保存
if command -v tree &> /dev/null; then
  tree -I 'node_modules|.next|.git|out|copy*|knowledge' > "${COPY_DIR}/tree.txt"
  echo -e "${GREEN}Project directory structure saved to ${COPY_DIR}/tree.txt${NC}"
else
  # tree コマンドがない場合は簡易的な構造を作成
  find . -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" -not -path "*/out/*" -not -path "*/copy*/*" -not -path "*/knowledge/*" | sort > "${COPY_DIR}/file_list.txt"
  echo -e "${YELLOW}tree command not found, simple file list saved to ${COPY_DIR}/file_list.txt${NC}"
fi

# JSON形式のディレクトリ構造も生成（Claude AIが理解しやすい形式）
echo -e "${GREEN}Generating JSON structure for better AI understanding...${NC}"

# JSON構造を作成するPythonスクリプトを生成
cat > "${COPY_DIR}/_generate_structure.py" << 'EOF'
#!/usr/bin/env python3
import os
import json
import sys

def build_tree(path, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = ['node_modules', '.next', '.git', 'out', 'copy_', 'knowledge']
    
    result = {}
    
    for item in os.listdir(path):
        # Skip excluded directories
        if any(ex in item for ex in exclude_dirs):
            continue
            
        item_path = os.path.join(path, item)
        
        if os.path.isdir(item_path):
            subtree = build_tree(item_path, exclude_dirs)
            if subtree:  # Only add non-empty directories
                result[item] = subtree
        else:
            # For files, store file extension for easy filtering
            _, ext = os.path.splitext(item)
            result[item] = {"type": "file", "extension": ext[1:] if ext else ""}
    
    return result

if __name__ == "__main__":
    root_dir = "." if len(sys.argv) < 2 else sys.argv[1]
    tree = {"root": build_tree(root_dir)}
    
    with open("project_structure.json", "w") as f:
        json.dump(tree, f, indent=2)
    
    print("Project structure saved as JSON")
EOF

# Pythonスクリプトを実行（可能な場合）
chmod +x "${COPY_DIR}/_generate_structure.py"
if command -v python3 &> /dev/null; then
  (cd "${COPY_DIR}" && python3 _generate_structure.py ..)
  echo -e "${GREEN}JSON structure saved to ${COPY_DIR}/project_structure.json${NC}"
elif command -v python &> /dev/null; then
  (cd "${COPY_DIR}" && python _generate_structure.py ..)
  echo -e "${GREEN}JSON structure saved to ${COPY_DIR}/project_structure.json${NC}"
else
  echo -e "${YELLOW}Python not found, skipping JSON structure generation${NC}"
fi

# 作業完了通知
echo -e "\n${GREEN}All work complete. Files added to knowledge directory.${NC}"