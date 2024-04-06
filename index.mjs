import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import pdf2json from "pdf2json"; // Replace pdf-parse with pdf2json
import { generate_letter, formatText } from "./gpt.mjs";
import { promisify } from "util";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(cors());

// Utility to delete files asynchronously
const unlinkAsync = promisify(fs.unlink);

app.post(
  "/gen-letter",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "job_description", maxCount: 1 },
  ]),
  async (req, res) => {
    const resumeFile = req.files["resume"] ? req.files["resume"][0] : null;
    const jobDescriptionFile = req.files["job_description"]
      ? req.files["job_description"][0]
      : null;

    try {
      if (!resumeFile || resumeFile.mimetype !== "application/pdf") {
        throw new Error("Resume must be a PDF file.");
      }
      if (!jobDescriptionFile || jobDescriptionFile.mimetype !== "text/plain") {
        throw new Error("Job description must be a text file.");
      }

      // Using pdf2json to extract text from PDF
      const resumeText = await extractTextFromPDF(resumeFile.buffer);
      const jobDescriptionText = jobDescriptionFile.buffer.toString("utf8");

      const formattedResume = formatText(resumeText);
      const formattedJobDescription = formatText(jobDescriptionText);

      const letterContent = await generate_letter(
        formattedResume,
        formattedJobDescription
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=cover_letter.pdf`
      );

      const doc = new PDFDocument();
      doc.font("./Times.ttf").fontSize(12).text(letterContent.content, {
        align: "justify",
        lineGap: 2.5,
      });
      doc.pipe(res);
      doc.end();
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).send(error.message);
    }
  }
);

// Function to extract text from PDF using pdf2json
async function extractTextFromPDF(pdfBuffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new pdf2json.PdfParser();
    pdfParser.on("pdfParser_dataError", reject);
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const textContent = pdfData.formImage.Pages.map((page) =>
        page.Texts.map((text) =>
          Buffer.from(text.R[0].T, "base64").toString("utf8")
        ).join(" ")
      ).join(" ");
      resolve(textContent);
    });
    pdfParser.parseBuffer(pdfBuffer);
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
