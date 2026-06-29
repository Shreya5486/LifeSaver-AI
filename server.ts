import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client on the server with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_NAME = "gemini-3.5-flash";

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 2. Chat with context-aware companion
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, tasks, habits, goals } = req.body;

    const systemInstruction = `You are "Life Saver", an incredibly supportive, calming, and highly strategic AI productivity coach. 
Your goal is to help students, entrepreneurs, and professionals who are overwhelmed, procrastinating, or facing last-minute panics.
Keep your tone warm, reassuring, grounded, and focused on immediate action. Never sound scolding or overly hyper-cheerful.

Context:
- Current Date/Time: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
- Active Tasks: ${JSON.stringify(tasks || [])}
- Active Habits: ${JSON.stringify(habits || [])}
- Active Goals: ${JSON.stringify(goals || [])}

Instructions:
1. Provide highly practical, small, actionable steps.
2. If the user asks for scheduling, prioritising, or planning, refer directly to their current tasks.
3. Be concise and write in elegant markdown formatting. Avoid walls of text. Break advice into bullet points.
4. Help reduce stress. Use phrases like "Let's tackle this step-by-step" or "We can absolutely get this done."`;

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Add system instruction and user input
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// 3. Generate detailed execution plan (checklist + content drafts) for a task
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    const prompt = `Create an actionable execution plan to complete this task and beat procrastination.
Task Details:
- Title: ${task.title}
- Description: ${task.description || "No description provided."}
- Priority: ${task.priority}
- Estimated Duration: ${task.duration} mins
- Deadline: ${task.deadline}

Generate:
1. Steps: A list of 4-7 tiny, granular, and realistic subtasks. The first step should be extremely easy (takes less than 2 minutes) to break inertia.
2. Drafts: At least 1 (max 3) pre-written starter assets to help them start. For example, if it's an email task, draft the email; if it's a presentation, draft a slide outline; if it's coding, draft a pseudocode stub or directory structure; if it's a study task, draft a high-level summary list of core concepts. Make these drafts rich, realistic, and highly supportive.`;

    const planSchema = {
      type: Type.OBJECT,
      properties: {
        steps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Granular, action-oriented, micro-steps starting with an incredibly simple, low-effort action."
        },
        drafts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the helper draft (e.g. 'Email Outline', 'Starter Template', 'Step-by-step Guideline')" },
              content: { type: Type.STRING, description: "The actual copyable content/draft written to high standards of detail." }
            },
            required: ["title", "content"]
          },
          description: "Helpful writing starter drafts, email templates, outlines, or checklists."
        }
      },
      required: ["steps", "drafts"]
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
        temperature: 0.2,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/generate-plan:", error);
    res.status(500).json({ error: error.message || "Failed to generate execution plan" });
  }
});

// 4. Auto-Schedule unscheduled tasks into open timeline slots
app.post("/api/auto-schedule", async (req, res) => {
  try {
    const { tasks, slots } = req.body;
    
    if (!tasks || !slots) {
      return res.status(400).json({ error: "Tasks and slots are required" });
    }

    const prompt = `I need to schedule my upcoming tasks into available calendar blocks.
Unscheduled Tasks: ${JSON.stringify(tasks.filter((t: any) => !t.scheduledSlot))}
Available Calendar Slots: ${JSON.stringify(slots.filter((s: any) => !s.taskId))}

Intelligently assign the most critical, urgent, and high-priority tasks to the most suitable calendar slots based on their estimated duration and deadline.
Return a list of assignments mapping taskIds to slotIds.`;

    const scheduleSchema = {
      type: Type.OBJECT,
      properties: {
        assignments: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING, description: "The ID of the task being scheduled." },
              slotId: { type: Type.STRING, description: "The ID of the slot to assign this task to." }
            },
            required: ["taskId", "slotId"]
          },
          description: "List of assignments of tasks to slots."
        }
      },
      required: ["assignments"]
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
        temperature: 0.1,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/auto-schedule:", error);
    res.status(500).json({ error: error.message || "Failed to auto-schedule tasks" });
  }
});

// 5. Intelligent Task Prioritizer & Workload Diagnostic
app.post("/api/prioritize", async (req, res) => {
  try {
    const { tasks, goals } = req.body;

    if (!tasks) {
      return res.status(400).json({ error: "Tasks are required" });
    }

    const prompt = `Analyze this list of tasks and goals. Provide:
1. An ordered list of task IDs from most critical/urgent to least. Take deadlines, priorities, and estimated times into account.
2. A workload diagnostic summary (supportive, objective, reassuring, yet realistic).
3. 3 concrete, personalized productivity tips for their situation.
4. The ID of the SINGLE most critical task they should work on right now (suggestedFocusId).

Current Tasks: ${JSON.stringify(tasks)}
Goals: ${JSON.stringify(goals || [])}`;

    const prioritySchema = {
      type: Type.OBJECT,
      properties: {
        prioritizedTaskIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of task IDs ordered from highest priority/urgency to lowest."
        },
        summary: {
          type: Type.STRING,
          description: "A calming yet motivating 2-3 sentence overview of their workload."
        },
        advice: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 3 customized, ultra-specific productivity tips to beat procrastination on these tasks."
        },
        suggestedFocusId: {
          type: Type.STRING,
          description: "The single most important task ID to focus on right now. Must be one of the provided task IDs, or empty string if none."
        }
      },
      required: ["prioritizedTaskIds", "summary", "advice", "suggestedFocusId"]
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: prioritySchema,
        temperature: 0.1,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/prioritize:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks" });
  }
});

// 6. AI Crisis Emergency Rescue Mode
app.post("/api/rescue-mode", async (req, res) => {
  try {
    const { tasks, goals, timeRemaining } = req.body;

    if (!tasks) {
      return res.status(400).json({ error: "Tasks are required" });
    }

    const minutes = Number(timeRemaining) || 180;

    const prompt = `You are a high-level Crisis Productivity consultant in "AI Emergency Rescue Mode".
We have exactly ${minutes} minutes left before a hard submission/hackathon deadline.
Here are the remaining tasks and long-term goals:
Tasks: ${JSON.stringify(tasks)}
Goals: ${JSON.stringify(goals || [])}

Analyze the workload under this extreme emergency crunch:
1. Estimate how long each task will actually take.
2. Determine which tasks are critical and MUST be completed.
3. Recommend which tasks should be SKIPPED or POSTPONED to guarantee submission.
4. Create a sequential, minute-by-minute execution plan (minutePlan) fitting strictly within the ${minutes} minutes remaining, starting from now.
5. Calculate a Predicted Success Rate (0 to 100) of meeting the deadline based on remaining effort and provide an explanation of why (expectedFinishTime, mainBottlenecks, and riskLevel).
6. Explain your AI prioritization choices (explain why some tasks are chosen first, e.g. high dependency or blocks other tasks).
7. Return exactly the JSON format requested. Be highly strategic and realistic (suggest skipping low-impact formatting or minor features to save the core product).`;

    const rescueSchema = {
      type: Type.OBJECT,
      properties: {
        predictedSuccessRate: { type: Type.INTEGER, description: "Estimated probability (0 to 100) of completing key tasks before deadline." },
        riskLevel: { type: Type.STRING, description: "Risk classification: 'low', 'medium', 'high', or 'critical'." },
        expectedFinishTime: { type: Type.STRING, description: "Formatted time or duration when essential items will complete, e.g., '2 hours 15 mins'." },
        mainBottlenecks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of top 2-3 specific bottlenecks or high-friction risk elements."
        },
        skipOrPostpone: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific task titles, aspects or tags that should be skipped or postponed to save time."
        },
        minutePlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timeRange: { type: Type.STRING, description: "e.g., '0 - 25 min' or '10:00 - 10:25'" },
              taskTitle: { type: Type.STRING },
              duration: { type: Type.INTEGER, description: "Duration in minutes" },
              action: { type: Type.STRING, description: "Ultra-specific immediate micro-action, e.g., 'Draft documentation introduction' or 'Fix critical login bug'" },
              explanation: { type: Type.STRING, description: "The strategic reasoning of why this is prioritized first or structured here (Explain the AI Decision)." }
            },
            required: ["timeRange", "taskTitle", "duration", "action", "explanation"]
          },
          description: "Minute-by-minute action plan fitting within the remaining time."
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 3 customized stress mitigation, energy management or focus tactics."
        }
      },
      required: ["predictedSuccessRate", "riskLevel", "expectedFinishTime", "mainBottlenecks", "skipOrPostpone", "minutePlan", "recommendations"]
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: rescueSchema,
        temperature: 0.1,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/rescue-mode:", error);
    res.status(500).json({ error: error.message || "Failed to generate emergency rescue plan" });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
