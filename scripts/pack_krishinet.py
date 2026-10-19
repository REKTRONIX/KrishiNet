import os
import zipfile

def pack_krishinet():
    output_filename = "krishinet-precision-agro-agent.zip"
    public_output = os.path.join("public", "krishinet-app.zip")
    
    os.makedirs("public", exist_ok=True)
    
    # Excluded directories and file patterns
    exclude_dirs = {"node_modules", ".git", ".cache", "dist", ".npm", "__pycache__"}
    exclude_extensions = {".zip", ".tar.gz", ".tgz"}
    exclude_files = {"package-lock.json", ".DS_Store"}

    files_to_pack = []
    
    for root, dirs, files in os.walk("."):
        # Prune unwanted directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]
        
        for file in files:
            if file in exclude_files:
                continue
            if any(file.endswith(ext) for ext in exclude_extensions):
                continue
            
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, ".")
            
            # Avoid packing output zip files
            if rel_path.endswith(".zip"):
                continue
                
            files_to_pack.append((full_path, rel_path))

    print(f"Found {len(files_to_pack)} files to package into zip archive.")
    
    # Create the zip in both the root and in public directory for direct HTTP access
    for target in [output_filename, public_output]:
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zipf:
            for full_path, rel_path in files_to_pack:
                # Store with clean folder prefix "krishinet/"
                archive_name = os.path.join("krishinet", rel_path)
                zipf.write(full_path, archive_name)
        
        size_kb = os.path.getsize(target) / 1024
        print(f"Successfully created: {target} ({size_kb:.2f} KB)")

if __name__ == "__main__":
    pack_krishinet()
