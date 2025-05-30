import {
  Building2,
  MapPin,
  ExternalLink,
  Clock,
  Bookmark,
  Share2,
} from "lucide-react";
import { useState } from "react";

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

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: job.job_title,
        text: `Check out this job at ${job.company_name}`,
        url: job.apply_link,
      });
    } else {
      navigator.clipboard.writeText(job.apply_link);
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm    p-6 border border-gray-100  relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight pr-4">
              {job.job_title}
            </h3>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-700">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold">{job.company_name}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <span>{job.job_location}</span>
            </div>

            {job.createdAt && (
              <div className="flex items-center text-gray-500">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm">{formatDate(job.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed line-clamp-3">
          {job.description.substring(0, 280)}
          {job.description.length > 280 && "..."}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {job.source && (
            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs font-medium rounded-full">
              {job.source}
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium rounded-full">
            New
          </span>
        </div>

        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Apply Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>


    </div>
  );
}
