#!/bin/zsh

# Function to add filename comment to various file types
add_filename_comment() {
    local file="$1"
    local base_dir="$2"
    
    # Get relative path from base directory
    local relpath=$(realpath --relative-to="$base_dir" "$file")

    # Directories to skip
    if [[ "$file" == *"/node_modules/"* || 
          "$file" == *"/.next/"* || 
          "$file" == *"/.git/"* || 
          "$file" == *"/build/"* || 
          "$file" == *"/dist/"* ]]; then
        return
    fi

    # Determine file type and add appropriate comment
    case "$file" in
        *.tsx | *.ts | *.js | *.jsx)
            # For TypeScript/JavaScript files
            if ! grep -q "// $relpath" "$file"; then
                sed -i '' "1i\\
// $relpath" "$file"
                echo "Added comment to $relpath"
            fi
            ;;
        
        *.css | *.scss)
            # For CSS files
            if ! grep -q "/* $relpath */" "$file"; then
                sed -i '' "1i\\
/* $relpath */" "$file"
                echo "Added comment to $relpath"
            fi
            ;;
        
        *.md)
            # For Markdown files
            if ! grep -q "<!-- $relpath -->" "$file"; then
                sed -i '' "1i\\
<!-- $relpath -->" "$file"
                echo "Added comment to $relpath"
            fi
            ;;
        
        *.json | *.config.js | *.config.ts)
            # For JSON and configuration files
            if ! grep -q "// $relpath" "$file"; then
                sed -i '' "1i\\
// $relpath" "$file"
                echo "Added comment to $relpath"
            fi
            ;;
        
        *)
            echo "Skipping $relpath - unsupported file type"
            ;;
    esac
}

# Check if a directory is provided, otherwise use current directory
if [ $# -eq 0 ]; then
    dir="."
else
    dir="$1"
fi

# Get absolute path of the base directory
base_dir=$(realpath "$dir")

# Find and process files, explicitly excluding node_modules and other directories
find "$dir" \( \
    -path "*/node_modules" -prune -o \
    -path "*/.next" -prune -o \
    -path "*/.git" -prune -o \
    -path "*/build" -prune -o \
    -path "*/dist" -prune -o \
    \( \
        -name "*.tsx" -o \
        -name "*.ts" -o \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.css" -o \
        -name "*.scss" -o \
        -name "*.md" -o \
        -name "*.json" -o \
        -name "*.config.js" -o \
        -name "*.config.ts" \
    \) -print0 \) | while IFS= read -r -d '' file; do
    add_filename_comment "$file" "$base_dir"
done

echo "Filename comment addition complete."