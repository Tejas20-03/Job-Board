"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Search,
  Upload,
  TrendingUp,
  Sparkles,
  Briefcase,
  MapPin,
  Building2,
  ExternalLink,
  Eye,
  X,
  Target,
  Award,
} from "lucide-react";
import JobCard from "@/components/JobCard";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Job {
  _id: string;
  job_title: string;
  company_name: string;
  job_location: string;
  apply_link: string;
  description: string;
  source?: string;
  createdAt?: string;
}

interface Keyword {
  _id: string;
  term: string;
  count: number;
}

interface RoleMatch {
  role: string;
  score: number;
  matchedKeywords: string[];
}

export default function JobBoard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [trendingKeywords, setTrendingKeywords] = useState<Keyword[]>([]);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
  const [suggestedRoles, setSuggestedRoles] = useState<RoleMatch[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isUsingKeywords, setIsUsingKeywords] = useState(false);

  const searchJobs = useCallback(async (query: string, keywords?: string[]) => {
    if (!query.trim() && (!keywords || keywords.length === 0)) {
      setJobs([]);
      return;
    }

    setLoading(true);
    try {
      // Track keyword for single query searches
      if (query.trim() && !keywords) {
        await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ term: query }),
        });
      }

      // Search jobs with either query or keywords
      let searchUrl = "/api/jobs?";
      if (keywords && keywords.length > 0) {
        searchUrl += `keywords=${encodeURIComponent(keywords.join(","))}`;
        setIsUsingKeywords(true);
      } else {
        searchUrl += `query=${encodeURIComponent(query)}`;
        setIsUsingKeywords(false);
      }

      const response = await fetch(searchUrl);
      const data = await response.json();
      setJobs(data.jobs || []);

      console.log(
        `Found ${data.jobs?.length || 0} jobs using ${data.searchType} search`
      );
      if (data.keywordsUsed) {
        console.log(`Used ${data.keywordsUsed} keywords for search`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingKeywords = useCallback(async () => {
    try {
      const response = await fetch("/api/keywords");
      const data = await response.json();
      setTrendingKeywords(data.keywords || []);
    } catch (error) {
      console.error("Error fetching trending keywords:", error);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Use extracted keywords if available, otherwise use search query
    if (extractedKeywords.length > 0) {
      searchJobs(searchQuery, extractedKeywords);
    } else {
      searchJobs(searchQuery);
    }
    setShowRoleSuggestions(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setResumeFile(file);
    const previewUrl = URL.createObjectURL(file);
    setResumePreviewUrl(previewUrl);
    setPredicting(true);
    setSuggestedRoles([]);
    setShowRoleSuggestions(false);
    setExtractedKeywords([]);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.role) {
        setSearchQuery(data.role);

        // Set extracted keywords for broader job search
        if (data.keywords && data.keywords.length > 0) {
          setExtractedKeywords(data.keywords);
          console.log(
            `Extracted ${data.keywords.length} keywords from resume:`,
            data.keywords
          );
        }

        // Set suggested roles if available
        if (data.topSuggestions && data.topSuggestions.length > 0) {
          setSuggestedRoles(data.topSuggestions);
          setShowRoleSuggestions(true);
        }

        // Search jobs using all extracted keywords
        await searchJobs(data.role, data.keywords);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error("Resume prediction error:", error);
      alert("Failed to process resume. Please try again.");
    } finally {
      setPredicting(false);
    }
  };

  const handleRoleSuggestionClick = (role: string) => {
    setSearchQuery(role);
    // Use extracted keywords if available for broader search
    if (extractedKeywords.length > 0) {
      searchJobs(role, extractedKeywords);
    } else {
      searchJobs(role);
    }
    setShowRoleSuggestions(false);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setSuggestedRoles([]);
    setShowRoleSuggestions(false);
    setExtractedKeywords([]);
    setIsUsingKeywords(false);
    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
      setResumePreviewUrl(null);
    }
    // Reset file input
    const fileInput = document.getElementById(
      "resume-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const openResumePreview = () => {
    setShowResumePreview(true);
  };

  const closeResumePreview = () => {
    setShowResumePreview(false);
  };

  useEffect(() => {
    return () => {
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
      }
    };
  }, [resumePreviewUrl]);

  const handleTrendingClick = (keyword: string) => {
    setSearchQuery(keyword);
    searchJobs(keyword);
    setShowRoleSuggestions(false);
  };

  // Load trending keywords on component mount
  useEffect(() => {
    fetchTrendingKeywords();
  }, [fetchTrendingKeywords]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <Briefcase className="w-10 h-10 text-indigo-600 mr-3" />
                <Sparkles className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                JobBoard AI
              </h1>
            </div>
            <p className="text-slate-600 text-lg md:text-xl font-medium">
              Discover your dream career with AI-powered precision
            </p>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Search and Upload Section */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 md:p-8 mb-8 md:mb-12">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
            {/* Search Bar */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-indigo-600" />
                <label className="text-sm font-semibold text-slate-700">
                  Search Dream Jobs
                </label>
                {isUsingKeywords && (
                  <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    AI-Enhanced Search
                  </div>
                )}
              </div>
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Software Engineer, Data Scientist, Product Manager..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm text-slate-700 placeholder-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    "Search Jobs"
                  )}
                </button>
              </form>

              {/* Keywords Display */}
              {extractedKeywords.length > 0 && (
                <div className="mt-4 p-4 bg-green-50/80 border border-green-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Sparkles className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm font-semibold text-green-800">
                      AI-Detected Skills & Keywords ({extractedKeywords.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {extractedKeywords.slice(0, 15).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200"
                      >
                        {keyword}
                      </span>
                    ))}
                    {extractedKeywords.length > 15 && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                        +{extractedKeywords.length - 15} more
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    These keywords are being used to find the most relevant jobs
                    for you
                  </p>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <label className="text-sm font-semibold text-slate-700">
                  AI Resume Matching
                </label>
              </div>
              {!resumeFile ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={predicting}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`flex items-center justify-center w-full py-4 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                      predicting
                        ? "border-purple-300 bg-purple-50/50 cursor-not-allowed"
                        : "border-slate-300 hover:border-purple-400 hover:bg-purple-50/50 bg-white/50"
                    }`}
                  >
                    <Upload
                      className={`w-5 h-5 mr-3 ${
                        predicting
                          ? "text-purple-500 animate-bounce"
                          : "text-slate-400"
                      }`}
                    />
                    <span className="text-slate-600 font-medium">
                      {predicting
                        ? "Analyzing resume..."
                        : "Upload your resume (PDF)"}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="bg-white/80 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 truncate max-w-[200px]">
                          {resumeFile.name}
                        </p>
                        <p className="text-sm text-green-600">
                          Resume uploaded successfully
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={openResumePreview}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                        title="Preview Resume"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleRemoveResume}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                        title="Remove Resume"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {predicting && (
                    <div className="mt-3 flex items-center">
                      <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mr-2"></div>
                      <span className="text-sm text-purple-600">
                        AI is analyzing your resume and extracting keywords...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Role Suggestions */}
          {showRoleSuggestions && suggestedRoles.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-purple-500 mr-2" />
                <span className="text-sm font-semibold text-slate-700">
                  AI-Detected Career Matches
                </span>
                <div className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  Based on your resume
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestedRoles.map((roleMatch, index) => (
                  <button
                    key={index}
                    onClick={() => handleRoleSuggestionClick(roleMatch.role)}
                    className="group p-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-left transform hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {roleMatch.role}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600">
                          {Math.round(roleMatch.score * 10)}% match
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roleMatch.matchedKeywords
                        .slice(0, 3)
                        .map((keyword, kidx) => (
                          <span
                            key={kidx}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      {roleMatch.matchedKeywords.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          +{roleMatch.matchedKeywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowRoleSuggestions(false)}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Hide suggestions
                </button>
              </div>
            </div>
          )}

          {/* Trending Keywords */}
          {trendingKeywords.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200/50">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500 mr-2" />
                <span className="text-sm font-semibold text-slate-700">
                  Trending Searches
                </span>
                <div className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                  Hot
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingKeywords.slice(0, 8).map((keyword) => (
                  <button
                    key={keyword._id}
                    onClick={() => handleTrendingClick(keyword.term)}
                    className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-indigo-100 hover:to-purple-100 text-slate-700 hover:text-indigo-700 rounded-full text-sm transition-all duration-200 font-medium border border-slate-200 hover:border-indigo-300 transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {keyword.term}
                    <span className="ml-1 text-xs opacity-70">
                      ({keyword.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                {isUsingKeywords
                  ? `Finding matches using ${extractedKeywords.length} AI-detected keywords...`
                  : "Finding perfect matches..."}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                  {jobs.length} Perfect Match{jobs.length !== 1 ? "es" : ""}{" "}
                  Found
                </h2>
                <p className="text-slate-600">
                  {isUsingKeywords ? (
                    <>
                      Showing AI-enhanced results using{" "}
                      <span className="font-semibold text-purple-600">
                        {extractedKeywords.length} keywords
                      </span>{" "}
                      from your resume
                    </>
                  ) : (
                    <>
                      Showing results for{" "}
                      <span className="font-semibold text-indigo-600">
                        "{searchQuery}"
                      </span>
                    </>
                  )}
                </p>
                {suggestedRoles.length > 0 && !showRoleSuggestions && (
                  <button
                    onClick={() => setShowRoleSuggestions(true)}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Show other AI-detected roles ({suggestedRoles.length})
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white/50 px-4 py-2 rounded-lg">
                <Briefcase className="w-4 h-4" />
                <span>
                  {isUsingKeywords
                    ? `AI-Enhanced Search (${Math.min(
                        jobs.length,
                        50
                      )} results)`
                    : `Top ${Math.min(jobs.length, 50)} opportunities`}
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {jobs.map((job, index) => (
                <div
                  key={job._id}
                  className="transform transition-all duration-200 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          jobs.length === 0 &&
          (searchQuery || extractedKeywords.length > 0) && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {isUsingKeywords
                  ? `No matches found using AI-detected keywords`
                  : `No matches found for "${searchQuery}"`}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {isUsingKeywords
                  ? "Try adjusting your search or upload a different resume for new keyword analysis."
                  : "Don't worry! Try different keywords, check your spelling, or upload your resume for AI-powered suggestions."}
              </p>

              {/* Show extracted keywords if available */}
              {extractedKeywords.length > 0 && (
                <div className="mb-8">
                  <p className="text-slate-600 mb-4">
                    We searched using these keywords from your resume:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                    {extractedKeywords.slice(0, 10).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                    {extractedKeywords.length > 10 && (
                      <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-sm">
                        +{extractedKeywords.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Show alternative role suggestions if available */}
              {suggestedRoles.length > 1 && (
                <div className="mb-8">
                  <p className="text-slate-600 mb-4">
                    Try searching for these AI-detected roles instead:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedRoles.slice(1, 4).map((roleMatch, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleRoleSuggestionClick(roleMatch.role)
                        }
                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-700 rounded-full text-sm font-medium transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        {roleMatch.role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setJobs([]);
                    setShowRoleSuggestions(false);
                    setExtractedKeywords([]);
                    setIsUsingKeywords(false);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 font-medium"
                >
                  Clear Search
                </button>
                <label
                  htmlFor="resume-upload"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium cursor-pointer"
                >
                  Try AI Matching
                </label>
              </div>
            </div>
          )}

        {/* Welcome State */}
        {!loading &&
          jobs.length === 0 &&
          !searchQuery &&
          extractedKeywords.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="mb-16">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
                    Your Dream Job Awaits
                  </h2>
                  <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Harness the power of AI to discover opportunities that
                    perfectly match your skills, experience, and career
                    aspirations. Our advanced algorithm analyzes your resume to
                    extract multiple keywords and find relevant career paths.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <button
                      onClick={() => {
                        const searchInput = document.querySelector(
                          'input[type="text"]'
                        ) as HTMLInputElement;
                        searchInput?.focus();
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Start Job Search
                    </button>
                    <label
                      htmlFor="resume-upload"
                      className="px-8 py-4 bg-white/70 backdrop-blur-sm text-slate-700 rounded-xl hover:bg-white/90 transition-all duration-200 font-semibold border-2 border-slate-200 hover:border-indigo-300 cursor-pointer transform hover:-translate-y-0.5"
                    >
                      Upload Resume for AI Analysis
                    </label>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 text-left">
                  <div className="group bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">
                      Multi-Keyword Search
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      Advanced algorithms extract multiple keywords from your
                      resume and search across all relevant skills, delivering
                      highly targeted job matches across{" "}
                      {trendingKeywords.length}+ trending roles.
                    </p>
                  </div>

                  <div className="group bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">
                      AI Keyword Extraction
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      Upload your resume and let our AI extract all relevant
                      keywords, skills, and technologies to identify multiple
                      career paths and opportunities you might not have
                      considered.
                    </p>
                  </div>

                  <div className="group bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">
                      Enhanced Matching
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      Stay ahead with comprehensive keyword-based matching that
                      finds opportunities across diverse industries, roles, and
                      skill sets for maximum career potential.
                    </p>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
                      50+
                    </div>
                    <div className="text-slate-600 font-medium">
                      Keywords Extracted
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                      10K+
                    </div>
                    <div className="text-slate-600 font-medium">
                      Active Jobs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-2">
                      95%
                    </div>
                    <div className="text-slate-600 font-medium">
                      Match Accuracy
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                      24/7
                    </div>
                    <div className="text-slate-600 font-medium">AI Support</div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>

      {showResumePreview && resumePreviewUrl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    Resume Preview
                  </h3>
                  <p className="text-sm text-slate-600">{resumeFile?.name}</p>
                </div>
              </div>
              <button
                onClick={closeResumePreview}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-6">
              <iframe
                src={resumePreviewUrl}
                className="w-full h-[70vh] border border-slate-200 rounded-lg"
                title="Resume Preview"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={closeResumePreview}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
              <a
                href={resumePreviewUrl}
                download={resumeFile?.name}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative bg-slate-900 text-white py-16 mt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <Briefcase className="w-8 h-8 text-indigo-400 mr-3" />
                <h3 className="text-2xl font-bold">JobBoard AI</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed max-w-md">
                Revolutionizing job discovery with cutting-edge AI technology.
                Connect with opportunities that truly match your potential and
                aspirations across multiple career paths using advanced keyword
                extraction.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-indigo-600 transition-colors cursor-pointer">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Job Seekers */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">
                For Job Seekers
              </h4>
              <ul className="space-y-3">
                {[
                  "Multi-Keyword Extraction",
                  "AI Resume Analysis",
                  "Career Path Discovery",
                  "Skill Matching",
                  "Interview Prep",
                  "Salary Insights",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-300 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-3 group-hover:bg-indigo-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Employers */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">
                For Employers
              </h4>
              <ul className="space-y-3">
                {[
                  "Post Jobs",
                  "Find Diverse Talent",
                  "AI Candidate Screening",
                  "Analytics Dashboard",
                  "Bulk Hiring Solutions",
                  "Enterprise Integration",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-slate-300 hover:text-indigo-400 transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-3 group-hover:bg-indigo-300"></span>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 JobBoard AI. All rights reserved. Powered by advanced
              machine learning and multi-keyword extraction technology.
            </p>
            <div className="flex space-x-6 text-sm">
              <a
                href="#"
                className="text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
