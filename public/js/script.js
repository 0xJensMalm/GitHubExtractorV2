document.getElementById("go-btn").addEventListener("click", function () {
  const repoUrl = document.getElementById("repo-url").value;

  if (!repoUrl) {
    alert("Please enter a valid GitHub repository URL.");
    return;
  }

  fetch("/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repoUrl, fileTypes: [], addFolderStructure: true }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        document.getElementById("output").value = data.output;
        document.getElementById("page1").style.display = "none";
        document.getElementById("page2").style.display = "block";
      }
    })
    .catch((error) => console.error("Error:", error));
});

function updateOutput() {
  const repoUrl = document.getElementById("repo-url").value;
  const fileTypes = Array.from(
    document.querySelectorAll('input[name="file_type"]:checked')
  ).map((cb) => cb.value);
  const addFolderStructure = document.getElementById(
    "show-folder-structure"
  ).checked;
  const includeAiPrompt = document.getElementById("include-ai-prompt").checked;
  const aiPromptText = includeAiPrompt
    ? document.getElementById("ai-prompt-text").value
    : "";
  const excludeNonCodeFiles =
    document.getElementById("exclude-non-code").checked;

  fetch("/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repoUrl,
      fileTypes,
      addFolderStructure,
      aiPromptText,
      excludeNonCodeFiles,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        document.getElementById("output").value = data.output;
      }
    })
    .catch((error) => console.error("Error:", error));
}

document
  .getElementById("extract-code-btn")
  .addEventListener("click", function () {
    updateOutput();
    document.getElementById("copy-to-clipboard-btn").style.display =
      "inline-block";
  });

document
  .getElementById("copy-to-clipboard-btn")
  .addEventListener("click", function () {
    const outputText = document.getElementById("output").value;
    navigator.clipboard.writeText(outputText).then(
      function () {
        const copyButton = document.getElementById("copy-to-clipboard-btn");
        copyButton.textContent = "Success!";
        setTimeout(() => {
          copyButton.textContent = "Copy to Clipboard";
        }, 3000);
      },
      function (err) {
        console.error("Could not copy text: ", err);
      }
    );
  });

document
  .getElementById("include-ai-prompt")
  .addEventListener("change", function () {
    const aiPromptGroup = document.getElementById("ai-prompt-group");
    aiPromptGroup.style.display = this.checked ? "block" : "none";
    updateOutput(); // Update the output when AI prompt checkbox is toggled
  });

Array.from(document.querySelectorAll('input[name="file_type"]')).forEach(
  function (checkbox) {
    checkbox.addEventListener("change", updateOutput);
  }
);

document
  .getElementById("show-folder-structure")
  .addEventListener("change", updateOutput);
document
  .getElementById("exclude-non-code")
  .addEventListener("change", updateOutput);
