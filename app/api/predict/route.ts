import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

interface RoleMatch {
  role: string;
  score: number;
  matchedKeywords: string[];
}

function extractMultipleRolesFromText(text: string): RoleMatch[] {
  const keywords: {
    [key: string]: { primary: string[]; secondary: string[]; weight: number };
  } = {
    // Software Development
    "Frontend Developer": {
      primary: [
        "frontend",
        "front-end",
        "ui developer",
        "react developer",
        "vue developer",
        "angular developer",
      ],
      secondary: [
        "react",
        "vue",
        "angular",
        "javascript",
        "typescript",
        "css",
        "html",
        "sass",
        "webpack",
        "next.js",
      ],
      weight: 1,
    },
    "Backend Developer": {
      primary: [
        "backend",
        "back-end",
        "server-side",
        "api developer",
        "backend engineer",
      ],
      secondary: [
        "node.js",
        "express",
        "fastapi",
        "spring",
        "django",
        "flask",
        "rest api",
        "graphql",
      ],
      weight: 1,
    },
    "Full Stack Developer": {
      primary: [
        "full stack",
        "fullstack",
        "full-stack",
        "mern",
        "mean",
        "end-to-end developer",
      ],
      secondary: [
        "frontend and backend",
        "web development",
        "javascript",
        "python",
        "java",
      ],
      weight: 1.2,
    },
    "Software Engineer": {
      primary: [
        "software engineer",
        "software developer",
        "programmer",
        "coding",
      ],
      secondary: [
        "algorithms",
        "data structures",
        "software design",
        "programming",
      ],
      weight: 0.9,
    },
    "Mobile Developer": {
      primary: [
        "mobile developer",
        "android developer",
        "ios developer",
        "mobile app",
      ],
      secondary: [
        "react native",
        "flutter",
        "swift",
        "kotlin",
        "xamarin",
        "mobile development",
      ],
      weight: 1,
    },

    // Data & AI
    "Data Scientist": {
      primary: [
        "data scientist",
        "data science",
        "machine learning engineer",
        "ml engineer",
      ],
      secondary: [
        "python",
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
        "jupyter",
        "statistics",
      ],
      weight: 1,
    },
    "Data Engineer": {
      primary: [
        "data engineer",
        "data engineering",
        "etl developer",
        "data pipeline",
      ],
      secondary: [
        "spark",
        "hadoop",
        "airflow",
        "kafka",
        "snowflake",
        "data warehouse",
      ],
      weight: 1,
    },
    "AI Engineer": {
      primary: [
        "ai engineer",
        "artificial intelligence",
        "machine learning",
        "deep learning",
      ],
      secondary: [
        "tensorflow",
        "pytorch",
        "opencv",
        "nlp",
        "computer vision",
        "neural networks",
      ],
      weight: 1,
    },
    "Data Analyst": {
      primary: ["data analyst", "business analyst", "data analysis"],
      secondary: [
        "excel",
        "sql",
        "tableau",
        "power bi",
        "analytics",
        "reporting",
      ],
      weight: 1,
    },

    // DevOps & Infrastructure
    "DevOps Engineer": {
      primary: [
        "devops",
        "devops engineer",
        "site reliability",
        "infrastructure engineer",
      ],
      secondary: [
        "docker",
        "kubernetes",
        "aws",
        "azure",
        "jenkins",
        "terraform",
        "ansible",
        "ci/cd",
      ],
      weight: 1,
    },
    "Cloud Engineer": {
      primary: [
        "cloud engineer",
        "cloud architect",
        "aws engineer",
        "azure engineer",
      ],
      secondary: [
        "aws",
        "azure",
        "gcp",
        "cloud computing",
        "serverless",
        "lambda",
      ],
      weight: 1,
    },
    "System Administrator": {
      primary: ["system administrator", "sysadmin", "infrastructure admin"],
      secondary: [
        "linux",
        "windows server",
        "networking",
        "monitoring",
        "backup",
      ],
      weight: 1,
    },

    // Specialized Tech Roles
    "Database Administrator": {
      primary: ["database administrator", "dba", "database engineer"],
      secondary: [
        "sql server",
        "mysql",
        "postgresql",
        "oracle",
        "mongodb",
        "database",
      ],
      weight: 1,
    },
    "Cyber Security Engineer": {
      primary: [
        "cybersecurity",
        "security engineer",
        "information security",
        "cyber security",
      ],
      secondary: [
        "penetration testing",
        "vulnerability",
        "firewall",
        "encryption",
        "security audit",
      ],
      weight: 1,
    },
    "Network Engineer": {
      primary: [
        "network engineer",
        "network administrator",
        "network architect",
      ],
      secondary: [
        "cisco",
        "routing",
        "switching",
        "vpn",
        "firewall",
        "networking",
      ],
      weight: 1,
    },
    "QA Engineer": {
      primary: [
        "qa engineer",
        "quality assurance",
        "test engineer",
        "qa analyst",
      ],
      secondary: [
        "testing",
        "automation",
        "selenium",
        "manual testing",
        "test cases",
      ],
      weight: 1,
    },

    // Design & Creative
    "UI/UX Designer": {
      primary: [
        "ui designer",
        "ux designer",
        "ui/ux",
        "user experience",
        "user interface",
      ],
      secondary: [
        "figma",
        "sketch",
        "adobe",
        "prototyping",
        "wireframes",
        "design",
      ],
      weight: 1,
    },
    "Graphic Designer": {
      primary: ["graphic designer", "visual designer", "creative designer"],
      secondary: [
        "photoshop",
        "illustrator",
        "indesign",
        "branding",
        "logo design",
      ],
      weight: 1,
    },

    // Business & Management
    "Product Manager": {
      primary: ["product manager", "product owner", "product management"],
      secondary: ["roadmap", "agile", "scrum", "stakeholder", "requirements"],
      weight: 1,
    },
    "Project Manager": {
      primary: ["project manager", "project management", "program manager"],
      secondary: ["pmp", "agile", "scrum", "waterfall", "project planning"],
      weight: 1,
    },
    "Business Analyst": {
      primary: ["business analyst", "ba", "business analysis"],
      secondary: [
        "requirements",
        "process improvement",
        "stakeholder",
        "documentation",
      ],
      weight: 1,
    },
    "Technical Lead": {
      primary: ["tech lead", "technical lead", "team lead", "lead developer"],
      secondary: ["leadership", "mentoring", "architecture", "code review"],
      weight: 1,
    },

    // Marketing & Sales
    "Digital Marketing Specialist": {
      primary: [
        "digital marketing",
        "marketing specialist",
        "online marketing",
      ],
      secondary: [
        "seo",
        "sem",
        "social media",
        "google ads",
        "facebook ads",
        "content marketing",
      ],
      weight: 1,
    },
    "SEO Specialist": {
      primary: ["seo specialist", "search engine optimization", "seo analyst"],
      secondary: [
        "google analytics",
        "keyword research",
        "link building",
        "content optimization",
      ],
      weight: 1,
    },
    "Content Writer": {
      primary: ["content writer", "copywriter", "content creator"],
      secondary: [
        "writing",
        "blogging",
        "content strategy",
        "social media content",
      ],
      weight: 1,
    },
    "Sales Executive": {
      primary: ["sales executive", "sales representative", "account manager"],
      secondary: [
        "crm",
        "lead generation",
        "client relationship",
        "sales targets",
      ],
      weight: 1,
    },

    // Finance & Accounting
    "Financial Analyst": {
      primary: ["financial analyst", "finance analyst", "investment analyst"],
      secondary: [
        "excel",
        "financial modeling",
        "valuation",
        "budgeting",
        "forecasting",
      ],
      weight: 1,
    },
    Accountant: {
      primary: ["accountant", "accounting", "bookkeeper"],
      secondary: [
        "quickbooks",
        "tally",
        "gst",
        "taxation",
        "financial statements",
      ],
      weight: 1,
    },
    "Risk Analyst": {
      primary: ["risk analyst", "risk management", "compliance analyst"],
      secondary: ["risk assessment", "compliance", "audit", "regulatory"],
      weight: 1,
    },

    // Healthcare & Science
    "Biomedical Engineer": {
      primary: ["biomedical engineer", "bioengineering", "medical device"],
      secondary: [
        "matlab",
        "medical equipment",
        "fda",
        "clinical",
        "biotechnology",
      ],
      weight: 1,
    },
    "Research Scientist": {
      primary: ["research scientist", "researcher", "research fellow"],
      secondary: [
        "publications",
        "laboratory",
        "experiments",
        "analysis",
        "phd",
      ],
      weight: 1,
    },
    "Lab Technician": {
      primary: [
        "lab technician",
        "laboratory technician",
        "medical technician",
      ],
      secondary: ["laboratory", "testing", "equipment", "samples", "protocols"],
      weight: 1,
    },

    // Operations & Support
    "Technical Support": {
      primary: [
        "technical support",
        "customer support",
        "help desk",
        "it support",
      ],
      secondary: [
        "troubleshooting",
        "customer service",
        "ticketing",
        "remote support",
      ],
      weight: 1,
    },
    "Operations Manager": {
      primary: ["operations manager", "ops manager", "operational excellence"],
      secondary: [
        "process improvement",
        "efficiency",
        "logistics",
        "supply chain",
      ],
      weight: 1,
    },
    "HR Specialist": {
      primary: ["hr specialist", "human resources", "hr manager", "recruiter"],
      secondary: ["recruitment", "employee relations", "payroll", "benefits"],
      weight: 1,
    },

    // Engineering (Non-Software)
    "Civil Engineer": {
      primary: [
        "civil engineer",
        "structural engineer",
        "construction engineer",
      ],
      secondary: [
        "autocad",
        "civil engineering",
        "construction",
        "infrastructure",
        "surveying",
      ],
      weight: 1,
    },
    "Mechanical Engineer": {
      primary: [
        "mechanical engineer",
        "design engineer",
        "manufacturing engineer",
      ],
      secondary: [
        "solidworks",
        "autocad",
        "manufacturing",
        "design",
        "mechanical",
      ],
      weight: 1,
    },
    "Electrical Engineer": {
      primary: [
        "electrical engineer",
        "electronics engineer",
        "power engineer",
      ],
      secondary: [
        "circuit design",
        "power systems",
        "electronics",
        "embedded systems",
      ],
      weight: 1,
    },

    // Internships & Entry Level
    "Software Intern": {
      primary: ["software intern", "developer intern", "engineering intern"],
      secondary: ["internship", "student", "fresher", "entry level"],
      weight: 0.8,
    },
    "Data Science Intern": {
      primary: ["data science intern", "ml intern", "analytics intern"],
      secondary: ["internship", "python", "data analysis", "machine learning"],
      weight: 0.8,
    },
    "Marketing Intern": {
      primary: ["marketing intern", "digital marketing intern"],
      secondary: ["internship", "social media", "content", "campaigns"],
      weight: 0.8,
    },
  };

  const lowerText = text.toLowerCase();
  const roleMatches: RoleMatch[] = [];

  // Calculate scores for each role
  for (const [role, { primary, secondary, weight }] of Object.entries(
    keywords
  )) {
    let primaryMatches = 0;
    let secondaryMatches = 0;
    const matchedKeywords: string[] = [];

    // Count primary keyword matches (higher weight)
    primary.forEach((term) => {
      if (lowerText.includes(term.toLowerCase())) {
        primaryMatches += 1;
        matchedKeywords.push(term);
      }
    });

    // Count secondary keyword matches (lower weight)
    secondary.forEach((term) => {
      if (lowerText.includes(term.toLowerCase())) {
        secondaryMatches += 0.5;
        matchedKeywords.push(term);
      }
    });

    // Calculate total score with role weight
    const score = (primaryMatches * 3 + secondaryMatches) * weight;

    if (score > 0.5) {
      // Only include roles with meaningful matches
      roleMatches.push({
        role,
        score,
        matchedKeywords,
      });
    }
  }

  // Sort by score descending
  return roleMatches.sort((a, b) => b.score - a.score);
}

// New function to extract all unique keywords from matched roles
function extractAllKeywords(roleMatches: RoleMatch[]): string[] {
  const allKeywords = new Set<string>();
  
  // Add all matched keywords from all roles
  roleMatches.forEach(roleMatch => {
    roleMatch.matchedKeywords.forEach(keyword => {
      allKeywords.add(keyword.toLowerCase().trim());
    });
  });

  // Also add the role names themselves as keywords
  roleMatches.forEach(roleMatch => {
    allKeywords.add(roleMatch.role.toLowerCase().trim());
  });

  return Array.from(allKeywords);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No resume file uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File size too large. Please upload a file smaller than 10MB",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: "Invalid file content" },
        { status: 400 }
      );
    }

    // Parse PDF
    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      return NextResponse.json(
        {
          error:
            "Failed to parse PDF. Please ensure the file is not corrupted or password-protected.",
        },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "No text content found in the PDF. Please upload a resume with readable text.",
        },
        { status: 400 }
      );
    }

    console.log("Extracted text preview:", pdfData.text.substring(0, 500));

    const roleMatches = extractMultipleRolesFromText(pdfData.text);

    // Extract all keywords from the resume analysis
    const allKeywords = extractAllKeywords(roleMatches);

    console.log("All role matches:", roleMatches);
    console.log("All extracted keywords:", allKeywords);

    // Get the top role for primary search, but return all matches
    const primaryRole =
      roleMatches.length > 0 ? roleMatches[0].role : "Software Engineer";

    // Get top 5 roles for suggestions
    const topRoles = roleMatches.slice(0, 5);

    return NextResponse.json({
      role: primaryRole, // Primary role for search
      allMatches: roleMatches, // All matching roles with scores
      topSuggestions: topRoles, // Top 5 suggestions
      keywords: allKeywords, // All extracted keywords for job search
      success: true,
      debug: {
        textLength: pdfData.text.length,
        preview: pdfData.text.substring(0, 200),
        totalMatches: roleMatches.length,
        totalKeywords: allKeywords.length,
      },
    });
  } catch (error) {
    console.error("Prediction error:", error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        return NextResponse.json(
          { error: "Invalid PDF file format" },
          { status: 400 }
        );
      }
      if (error.message.includes("File too large")) {
        return NextResponse.json(
          { error: "File size exceeds limit" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Failed to process resume. Please try again with a different file.",
      },
      { status: 500 }
    );
  }
}
