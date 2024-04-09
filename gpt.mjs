import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";

dotenv.config();

async function generate_letter(resume, job_description) {
  // Create a new Date object for the current date
  const currentDate = new Date();

  // Format the date as YYYY-MM-DD
  // You can adjust the format as needed
  const formattedDate = currentDate.toISOString().split("T")[0];

  //Create Model
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    openAIApiKey: process.env.GPT_KEY,
  });

  //Create Prompt Template - both do same thing functionally
  /* from template */
  const prompt = ChatPromptTemplate.fromTemplate(
    "You produce cover letters based upon the current user/`s resume and the job description. " +
      "Make sure to keep the cover letter down to one page with 3 to 4 sentences per paragraph." +
      "Do not include a template holder for the users address and phone number. " +
      "Do not include the template holder for the company address. " +
      "Do not surround the applicant's name, email and email address in square brackets. " +
      "Do not surround date in square brackets. " +
      "Include the user's full name and email address in the contact information. " +
      "Also make sure to include today's date, and format it like MM/DD/YYYY. " +
      "Resume: {resume}, Job Description: {job_description}, Today's Date:{date}"
  );

  /* from messages */
  const prompt2 = ChatPromptTemplate.fromMessages([
    ["system", "Generate a joke based upon a word provided by the user"],
    ["human", "{input}"],
  ]);
  //console.log(await prompt.format({ input: "chicken" }));

  //Create Chain
  const chain = prompt.pipe(model);

  //Call Chain
  const res = await chain.invoke({
    resume: resume,
    job_description: job_description,
    date: formattedDate,
  });
  return res;
}

function formatText(text) {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/\n/g, "\\n") // Escape newlines
    .replace(/\r/g, "\\r") // Escape carriage returns
    .replace(/\t/g, "\\t"); // Escape tabs
}

export { generate_letter, formatText };
