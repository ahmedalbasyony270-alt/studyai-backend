import express from "express";
import cors from "cors";
import multer from "multer";
import pdf from "pdf-parse";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

// ==========================
// 🔹 ضع هنا توكن HuggingFace
// ==========================
const HF_TOKEN = "PUT_YOUR_HF_TOKEN_HERE";

// ==========================
// تلخيص
// ==========================
async function summarize(text) {
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
    { inputs: text },
    {
      headers: { Authorization: `Bearer ${HF_TOKEN}` }
    }
  );
  return response.data[0].summary_text;
}

// ==========================
// ترجمة
// ==========================
async function translate(text, targetLang) {
  const model =
    targetLang === "ar"
      ? "Helsinki-NLP/opus-mt-en-ar"
      : "Helsinki-NLP/opus-mt-ar-en";

  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    { inputs: text },
    {
      headers: { Authorization: `Bearer ${HF_TOKEN}` }
    }
  );

  return response.data[0].translation_text;
}

// ==========================
// رفع PDF
// ==========================
app.post("/process-pdf", upload.single("file"), async (req, res) => {
  try {
    const data = await pdf(req.file.buffer);
    const text = data.text.substring(0, 3000); // limit مجاني

    const summary = await summarize(text);
    const translated = await translate(summary, req.body.lang);

    res.json({
      summary,
      translated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("StudyAI Backend Running 🚀");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
