import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resume, setResume] = useState(null); // State for storing the resume file
  const [jobDescription, setJobDescription] = useState(""); // State for the job description text

  // Function to handle resume file selection
  const handleResumeChange = (e) => {
    setResume(e.target.files[0]);
  };

  // Function to handle job description change
  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  // Function to send data to the server
  const handleSubmit = async () => {
    if (!resume || !jobDescription) {
      alert("Please upload a resume and enter a job description.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append(
      "job_description",
      new Blob([jobDescription], { type: "text/plain" })
    );

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + "/gen-letter",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob", // Important for receiving the PDF file back
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "cover_letter.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error generating cover letter.");
    }
  };

  return (
    <div className="flex flex-col w-[20rem] h-[18rem] items-center bg-[#FDF5E6]">
      {/* Existing content remains unchanged */}

      {/* Modified section for uploading resume and entering job description */}
      <section className="mt-8 flex flex-col justify-center">
        <h3 className="text-lg font-semibold">Resume</h3>
        <input
          type="file"
          onChange={handleResumeChange}
          accept=".pdf"
          className=""
        />

        <h3 className="text-lg font-semibold">Job Description</h3>
        <textarea
          className="bg-slate-100 border-4 border-black rounded-md"
          value={jobDescription}
          onChange={handleJobDescriptionChange}
        />

        <div className="flex flex-row py-4">
          <button
            onClick={handleSubmit}
            className="bg-[#F9AA33] rounded-md p-2 font-semibold border"
          >
            Generate Cover Letter!
          </button>
        </div>

        {/* You can display the cover letter text here if you modify the backend to return text instead of a PDF */}
      </section>

      {/* Footer remains unchanged */}
    </div>
  );
}

export default App;
