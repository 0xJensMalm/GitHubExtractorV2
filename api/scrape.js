const fs = require("fs");
const path = require("path");
const os = require("os");
const simpleGit = require("simple-git");

const scrapeRepo = async (
  repoUrl,
  fileTypes,
  addFolderStructure,
  excludeNonCodeFiles
) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "repo-"));

  try {
    const git = simpleGit();
    await git.clone(repoUrl, tempDir);

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
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          if (!excludedDirs.includes(file)) {
            filelist = walkSync(filePath, filelist);
          }
        } else {
          const ext = path.extname(file).slice(1);
          if (
            (fileTypes.length === 0 || fileTypes.includes(ext)) &&
            (!excludeNonCodeFiles || !excludedFiles.includes(file))
          ) {
            const relativePath = path.relative(tempDir, filePath);
            const directory = path.dirname(relativePath);
            if (!folderStructure[directory]) {
              folderStructure[directory] = [];
            }
            folderStructure[directory].push(file);
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
      output += fs.readFileSync(path.join(tempDir, file), "utf8");
      output += "\n\n";
    });

    return output;
  } finally {
    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
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
