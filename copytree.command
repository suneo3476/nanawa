#!/bin/bash

# Set color variables
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print script start message
echo -e "${YELLOW}Starting directory copy and tree display...${NC}"

# Display directory structure excluding specified folders and save to tree.txt
echo -e "\n${GREEN}Saving directory structure to tree.txt${NC}"
tree -I 'node_modules|.next|.git' > tree.txt

# Create copy directory
echo -e "\n${GREEN}Creating ./copy directory and copying files...${NC}"
mkdir -p ./copy

# Copy files excluding specified folders
find . -type f \( ! -path '*/node_modules/*' ! -path '*/.next/*' ! -path '*/.git/*' \) -exec cp -p {} ./copy/ \;

# Count copied files
COPIED_FILES=$(find ./copy -type f | wc -l)

# Print completion message
echo -e "\n${GREEN}Copy complete!${NC}"
echo -e "${YELLOW}Total files copied: ${COPIED_FILES}${NC}"

# Optional: Show contents of copy directory
echo -e "\n${GREEN}Contents of ./copy directory:${NC}"
ls -1 ./copy

# Confirm tree.txt creation
echo -e "\n${GREEN}Directory structure saved to tree.txt${NC}"