'use client';

import { 
  BarChart2, 
  FilePlus, 
  Mail, 
  Users,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeText: string;
  isPositive: boolean;
  icon: React.ElementType;
}

interface ContentRowProps {
  title: string;
  status: string;
  date: string;
  views: number;
}

function StatsCard({ title, value, change, changeText, isPositive, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 text-gray-400" />
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {change}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">{value}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{changeText}</p>
    </div>
  );
}

function ContentRow({ title, status, date, views }: ContentRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
          status === 'published'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : status === 'scheduled'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{date}</td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{views}</td>
      <td className="px-6 py-4">
        <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export default function DashboardContent() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the Admin Platform</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage your content, members, and platform settings</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => router.push('/admin-platform/content')}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Content
            </button>
            <button 
              onClick={() => router.push('/admin-platform/analytics')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              View Analytics
              <BarChart2 className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Content" 
          value="24" 
          change="+3" 
          changeText="from last month"
          isPositive={true} 
          icon={FilePlus}
        />
        <StatsCard 
          title="Total Members" 
          value="158" 
          change="+12" 
          changeText="from last month"
          isPositive={true} 
          icon={Users}
        />
        <StatsCard 
          title="Email Opens" 
          value="65%" 
          change="-2%" 
          changeText="from last campaign"
          isPositive={false} 
          icon={Mail}
        />
        <StatsCard 
          title="Avg. Engagement" 
          value="4.8m" 
          change="+1.2m" 
          changeText="from last week"
          isPositive={true} 
          icon={Eye}
        />
      </div>

      {/* Recent content preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Content</h3>
          <button
            onClick={() => router.push('/admin-platform/content')}
            className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center"
          >
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Title</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 font-medium">Published</th>
                <th scope="col" className="px-6 py-3 font-medium">Views</th>
                <th scope="col" className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <ContentRow
                title="Getting Started with Crypto" 
                status="published" 
                date="2023-12-10" 
                views={342}
              />
              <ContentRow
                title="Ultimate Beginners Guide" 
                status="published" 
                date="2023-12-05" 
                views={219}
              />
              <ContentRow
                title="Advanced Trading Strategies" 
                status="draft" 
                date="--" 
                views={0}
              />
              <ContentRow
                title="Security Best Practices" 
                status="scheduled" 
                date="2023-12-20" 
                views={0}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 