'use client';

import { 
  BarChart2, 
  FilePlus, 
  Mail, 
  Tag, 
  Users,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  Eye,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPlatformDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the Admin Platform</h2>
            <p className="text-gray-600 dark:text-gray-300">Manage your content, members, and platform settings</p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
              <FilePlus className="w-4 h-4 mr-2" />
              New Content
            </button>
            <Link 
              href="/admin-platform/analytics" 
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              View Analytics
              <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Stats overview - redesigned with cleaner look */}
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
      
      {/* Quick actions - redesigned as features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          title="Content Management" 
          description="Create, edit and manage your learning content"
          href="/admin-platform/content" 
          icon={FilePlus} 
          color="bg-blue-600" 
          actions={['New Article', 'Manage Content']}
        />
        <FeatureCard 
          title="User Administration" 
          description="Manage user accounts and permissions"
          href="/admin-platform/members" 
          icon={Users} 
          color="bg-amber-600" 
          actions={['View Members', 'Roles & Access']}
        />
        <FeatureCard 
          title="Email Campaigns" 
          description="Create and send email campaigns to your audience"
          href="/admin-platform/emails" 
          icon={Mail} 
          color="bg-green-600" 
          actions={['New Campaign', 'View Analytics']}
        />
      </div>
      
      {/* Recent content - redesigned with modern look */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Content</h3>
          <Link href="/admin-platform/content" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
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
      
      {/* Analytics overview - redesigned with placeholder for chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h3>
          <Link href="/admin-platform/analytics" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center">
            View details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
            <BarChart2 className="h-12 w-12 mb-3" />
            <p className="text-base">Analytics visualization would display here</p>
            <p className="text-xs mt-2">Integration with your preferred analytics platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  title, 
  description,
  href, 
  icon: Icon, 
  color,
  actions
}: { 
  title: string;
  description: string;
  href: string; 
  icon: React.ElementType; 
  color: string;
  actions: string[];
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
        <div className="flex flex-col space-y-2">
          {actions.map((action, index) => (
            <Link 
              key={index}
              href={href} 
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              {action}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  change,
  changeText,
  isPositive,
  icon: Icon
}: { 
  title: string; 
  value: string; 
  change: string;
  changeText: string;
  isPositive: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex justify-between mb-2">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center mt-2">
        <div className={`flex items-center ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span className="text-sm font-medium">{change}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{changeText}</span>
      </div>
    </div>
  );
}

function ContentRow({ 
  title, 
  status, 
  date, 
  views 
}: { 
  title: string; 
  status: 'published' | 'draft' | 'scheduled'; 
  date: string; 
  views: number;
}) {
  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
        {title}
      </th>
      <td className="px-6 py-4">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
        {date === '--' ? (
          <span className="text-gray-400 dark:text-gray-500">--</span>
        ) : (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
            {date}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
        {views === 0 ? (
          <span className="text-gray-400 dark:text-gray-500">--</span>
        ) : (
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1.5 text-gray-400" />
            {views.toLocaleString()}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <button className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">
            Edit
          </button>
          <button className="text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">
            View
          </button>
        </div>
      </td>
    </tr>
  );
} 