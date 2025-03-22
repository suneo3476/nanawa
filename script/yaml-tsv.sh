#!/bin/bash

# 七輪アーカイブ - YAML⇔TSV変換スクリプト実行用シェルスクリプト

# 色の設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ディレクトリ設定 - スクリプトが./script/にある場合を想定
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "${SCRIPT_DIR}/.." && pwd )"
YAML_DIR="${ROOT_DIR}/data_yaml"
TSV_DIR="${ROOT_DIR}/data_tsv"

# 必要なディレクトリの作成
mkdir -p ${YAML_DIR}
mkdir -p ${TSV_DIR}

# js-yamlパッケージがインストールされているか確認
echo -e "${YELLOW}必要なパッケージを確認しています...${NC}"
if ! npm list js-yaml > /dev/null 2>&1; then
  echo -e "${YELLOW}js-yamlパッケージをインストールしています...${NC}"
  npm install js-yaml
fi

# yaml-tsv-converter.jsが実行可能かチェック
if [ ! -x "${SCRIPT_DIR}/yaml-tsv-converter.js" ]; then
  echo -e "${YELLOW}yaml-tsv-converter.jsに実行権限を付与します...${NC}"
  chmod +x "${SCRIPT_DIR}/yaml-tsv-converter.js"
fi

# 引数に応じて処理を分岐
case "$1" in
  "to-tsv")
    # YAMLファイルの存在チェック
    if [ ! -f "${YAML_DIR}/lives.yml" ] || [ ! -f "${YAML_DIR}/songs.yml" ] || [ ! -f "${YAML_DIR}/setlists.yml" ]; then
      echo -e "${RED}エラー: 必要なYAMLファイルが見つかりません${NC}"
      echo -e "${YELLOW}まずTSV→YAML変換を実行してください:${NC}"
      exit 1
    fi

    # YAMLからTSVへの変換を実行
    echo -e "${GREEN}YAMLデータをTSV形式に変換しています...${NC}"
    node "${SCRIPT_DIR}/yaml-tsv-converter.js" to-tsv
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}変換に成功しました。${NC}"
      echo -e "${YELLOW}TSV形式のデータは以下に保存されました:${NC}"
      echo "${TSV_DIR}/"
      
      # 作成されたTSVファイルの一覧を表示
      ls -la ${TSV_DIR}/*.tsv
      echo ""
      echo -e "${YELLOW}次のステップ:${NC}"
      echo -e "1. TSVファイルをスプレッドシートで編集できます"
      echo -e "2. 編集後、TSVファイルを${TSV_DIR}/に保存してください"
      echo -e "3. './script/yaml-tsv.sh to-yaml'コマンドで編集内容をYAMLに反映できます"
    else
      echo -e "${RED}変換に失敗しました。エラーメッセージを確認してください。${NC}"
    fi
    ;;
    
  "to-yaml")
    # TSVファイルの存在チェック
    if [ ! -d "${TSV_DIR}" ] || [ ! "$(ls -A ${TSV_DIR} 2>/dev/null)" ]; then
      echo -e "${RED}エラー: TSVファイルが見つかりません${NC}"
      echo -e "${YELLOW}先にto-tsvコマンドを実行してTSVファイルを生成してください${NC}"
      echo "./script/yaml-tsv.sh to-tsv"
      exit 1
    fi

    # TSVからYAMLへの変換を実行
    echo -e "${GREEN}TSVデータをYAML形式に変換しています...${NC}"
    node "${SCRIPT_DIR}/yaml-tsv-converter.js" to-yaml
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}変換に成功しました。${NC}"
      echo -e "${YELLOW}YAML形式のデータが更新されました:${NC}"
      echo "${YAML_DIR}/"
      
      # 更新されたYAMLファイルの一覧を表示
      ls -la ${YAML_DIR}/*.yml
    else
      echo -e "${RED}変換に失敗しました。エラーメッセージを確認してください。${NC}"
    fi
    ;;
    
  *)
    echo -e "${YELLOW}使用方法:${NC}"
    echo "  ./script/yaml-tsv.sh to-tsv  - YAMLデータをTSV形式に変換します (スプレッドシート編集用)"
    echo "  ./script/yaml-tsv.sh to-yaml - TSVデータをYAML形式に変換します (編集内容の反映)"
    echo ""
    echo -e "${YELLOW}推奨ワークフロー:${NC}"
    echo "1. TSVファイルからYAMLへの変換
    echo "2. YAMLからTSVへの変換:            ./script/yaml-tsv.sh to-tsv"
    echo "3. スプレッドシートでのTSV編集"
    echo "4. TSVからYAMLへの変換:            ./script/yaml-tsv.sh to-yaml"
    ;;
esac