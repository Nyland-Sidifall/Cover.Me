import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { generate_letter, formatText } from "./gpt.mjs";
import { promisify } from "util";
import pdf from "pdf-parse"; // Import pdf-parse

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

      // Use pdf-parse to extract text from the PDF file
      const data = await pdf(resumeFile.buffer);
      const resumeText = data.text;
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
      doc.pipe(res);
      doc.font("./Times.ttf").fontSize(12).text(letterContent.content, {
        align: "justify",
        lineGap: 2.5,
      });
      doc.end();
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).send(error.message);
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
