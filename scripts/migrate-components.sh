#!/bin/bash

# Script to migrate components from src/app/components to src/components
# according to the correct organization structure

# Create a log file
LOG_FILE="component-migration.log"
echo "Component Migration Log - $(date)" > $LOG_FILE

# Function to log messages
log_message() {
  echo "$1" | tee -a $LOG_FILE
}

log_message "Starting component migration..."

# 1. UI components
log_message "Migrating UI components..."
for file in src/app/components/ui/*.tsx; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    target="src/components/ui/$filename"
    
    # Check if files are identical
    if [ -f "$target" ] && cmp -s "$file" "$target"; then
      log_message "Identical: $filename - removing app version"
      rm "$file"
    elif [ -f "$target" ]; then
      log_message "Conflict: $filename exists in both locations - manual review needed"
      # Create a diff for manual review
      mkdir -p "migration-diffs"
      diff -u "$target" "$file" > "migration-diffs/$filename.diff"
    else
      log_message "Moving: $filename to components/ui"
      mv "$file" "$target"
    fi
  fi
done

# 2. Feature-specific components (auth, dashboard, home, membership)
for feature in auth dashboard home membership; do
  log_message "Migrating $feature components..."
  
  # Create target directory if it doesn't exist
  mkdir -p "src/components/features/$feature"
  
  if [ -d "src/app/components/$feature" ]; then
    for file in src/app/components/$feature/*.tsx; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        target="src/components/features/$feature/$filename"
        
        # Check if files are identical
        if [ -f "$target" ] && cmp -s "$file" "$target"; then
          log_message "Identical: $feature/$filename - removing app version"
          rm "$file"
        elif [ -f "$target" ]; then
          log_message "Conflict: $feature/$filename exists in both locations - manual review needed"
          # Create a diff for manual review
          mkdir -p "migration-diffs/$feature"
          diff -u "$target" "$file" > "migration-diffs/$feature/$filename.diff"
        else
          log_message "Moving: $feature/$filename to components/features/$feature"
          mv "$file" "$target"
        fi
      fi
    done
  fi
done

# 3. Atoms, molecules, organisms -> determine best placement
log_message "Migrating atomic design components..."

# Create directories if they don't exist
mkdir -p "src/components/ui/atoms"
mkdir -p "src/components/ui/molecules"
mkdir -p "src/components/ui/organisms"

# Process atoms
if [ -d "src/app/components/atoms" ]; then
  for file in src/app/components/atoms/*.tsx; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      log_message "Moving atom: $filename to components/ui/atoms"
      mv "$file" "src/components/ui/atoms/$filename"
    fi
  done
fi

# Process molecules
if [ -d "src/app/components/molecules" ]; then
  for file in src/app/components/molecules/*.tsx; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      target="src/components/molecules/$filename"
      
      if [ -f "$target" ] && cmp -s "$file" "$target"; then
        log_message "Identical: molecules/$filename - removing app version"
        rm "$file"
      elif [ -f "$target" ]; then
        log_message "Conflict: molecules/$filename exists in both locations - manual review needed"
        mkdir -p "migration-diffs/molecules"
        diff -u "$target" "$file" > "migration-diffs/molecules/$filename.diff"
      else
        log_message "Moving molecule: $filename to components/ui/molecules"
        mv "$file" "src/components/ui/molecules/$filename"
      fi
    fi
  done
fi

# Process organisms
if [ -d "src/app/components/organisms" ]; then
  for file in src/app/components/organisms/*.tsx; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      log_message "Moving organism: $filename to components/ui/organisms"
      mv "$file" "src/components/ui/organisms/$filename"
    fi
  done
fi

# 4. Modals -> components/features/modals
log_message "Migrating modals..."
mkdir -p "src/components/features/modals"

if [ -d "src/app/components/modals" ]; then
  for file in src/app/components/modals/*.tsx; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      log_message "Moving modal: $filename to components/features/modals"
      mv "$file" "src/components/features/modals/$filename"
    fi
  done
fi

# 5. Navigation
log_message "Migrating navigation components..."
mkdir -p "src/components/features/navigation"

if [ -d "src/app/components/navigation" ]; then
  for file in src/app/components/navigation/*.tsx; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")
      log_message "Moving navigation: $filename to components/features/navigation"
      mv "$file" "src/components/features/navigation/$filename"
    fi
  done
fi

# 6. Standalone components
log_message "Migrating standalone components..."
for file in src/app/components/*.tsx; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Determine appropriate location based on component name
    if [[ "$filename" == *"Background"* || "$filename" == *"Layout"* || "$filename" == *"Footer"* ]]; then
      log_message "Moving layout component: $filename to components/layouts"
      mkdir -p "src/components/layouts"
      mv "$file" "src/components/layouts/$filename"
    else
      log_message "Moving component: $filename to components/ui"
      mv "$file" "src/components/ui/$filename"
    fi
  fi
done

log_message "Component migration completed."
log_message "Please check migration-diffs directory for components that need manual review." 