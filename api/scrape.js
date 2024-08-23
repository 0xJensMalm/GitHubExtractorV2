const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("isomorphic-git/http/node");
const git = require("isomorphic-git");
const { fs: memfs } = require("memfs");

const scrapeRepo = async (
  repoUrl,
  fileTypes,
  addFolderStructure,
  excludeNonCodeFiles
) => {
  const tempDir = path.join(os.tmpdir(), `repo-${Date.now()}`);

  try {
    await git.clone({
      fs: memfs,
      http,
      dir: tempDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
    });

    const excludedFiles = [
      "package-lock.json",
      "package.json",
      ".gitignore",
      "README.md",
      "yarn.lock",
      ".env",
      ".editorconfig",
      "docker-compose.yml",
      "Dockerfile",
    ];
    const excludedDirs = ["node_modules", ".git", "venv", "__pycache__"];

    let output = "";
    let folderStructure = {};

    const walkSync = (dir, filelist = []) => {
      const items = memfs.readdirSync(dir);

      items.forEach((item) => {
        const itemPath = path.join(dir, item);
        const stat = memfs.statSync(itemPath);

        if (stat.isDirectory()) {
          if (!excludedDirs.includes(item)) {
            filelist = walkSync(itemPath, filelist);
          }
        } else {
          const ext = path.extname(item).slice(1);
          if (
            (fileTypes.length === 0 || fileTypes.includes(ext)) &&
            (!excludeNonCodeFiles || !excludedFiles.includes(item))
          ) {
            const relativePath = path.relative(tempDir, itemPath);
            const directory = path.dirname(relativePath);
            if (!folderStructure[directory]) {
              folderStructure[directory] = [];
            }
            folderStructure[directory].push(item);
            filelist.push(relativePath);
          }
        }
      });

      return filelist;
    };

    const fileList = walkSync(tempDir);

    if (addFolderStructure) {
      output += "Folder structure:\n";
      Object.keys(folderStructure).forEach((directory) => {
        output += `${directory}/\n`;
        folderStructure[directory].forEach((file) => {
          output += `  - ${file}\n`;
        });
      });
      output += "\n";
    }

    output += "Code:\n\n";
    fileList.forEach((file) => {
      output += `${file}:\n`;
      output += memfs.readFileSync(path.join(tempDir, file), "utf8");
      output += "\n\n";
    });

    return output;
  } catch (error) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
};

module.exports = async (req, res) => {
  const {
    repoUrl,
    fileTypes = [],
    addFolderStructure = false,
    aiPromptText = "",
    excludeNonCodeFiles = false,
  } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "GitHub repository URL is required" });
  }

  try {
    let output = await scrapeRepo(
      repoUrl,
      fileTypes,
      addFolderStructure,
      excludeNonCodeFiles
    );
    if (aiPromptText) {
      output = aiPromptText + "\n\n" + output;
    }
    res.json({ output });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};
