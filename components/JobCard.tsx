import { Building2, MapPin, ExternalLink, Clock } from "lucide-react";

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
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
            {job.job_title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <Building2 className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-medium">{job.company_name}</span>
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-2 text-green-500" />
            <span>{job.job_location}</span>
          </div>
          {job.createdAt && (
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <Clock className="w-4 h-4 mr-2" />
              <span>Posted {formatDate(job.createdAt)}</span>
            </div>
          )}
        </div>
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          Apply Now
          <ExternalLink className="w-4 h-4 ml-2" />
        </a>
      </div>

      <div className="text-gray-700 mb-4">
        <p className="line-clamp-3 leading-relaxed">
          {job.description.substring(0, 300)}
          {job.description.length > 300 && "..."}
        </p>
      </div>

      {job.source && (
        <div className="pt-4 border-t border-gray-200">
          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
            Source: {job.source}
          </span>
        </div>
      )}
    </div>
  );
}
