'use client';

import { useState } from 'react';
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
  Calendar,
  FileText,
  Settings,
  Image,
  Tags,
  Construction
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import ContentDisplay from '@/components/admin/content/ContentDisplay';
import { useAdmin } from './layout';

// Tab configuration
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function ComingSoonSection({ title }: { title: string }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-brand-50 dark:bg-brand-900/20 rounded-full p-4 mb-6">
        <Construction className="w-8 h-8 text-brand-600 dark:text-brand-400" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {title} Coming Soon
      </h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-md">
        We're working hard to bring you an amazing {title.toLowerCase()} experience. 
        Stay tuned for updates!
      </p>
      <div className="w-24 h-1 bg-brand-600/20 dark:bg-brand-400/20 rounded-full mt-8" />
    </div>
  );
}

export default function AdminPlatformDashboard() {
  const { activeTab, setActiveTab } = useAdmin();

  const renderContent = () => {
    switch (activeTab) {
      case 'content':
        return <ContentDisplay />;
      case 'dashboard':
        return <DashboardContent />;
      case 'categories':
        return <ComingSoonSection title="Categories" />;
      case 'tags':
        return <ComingSoonSection title="Tags" />;
      case 'media':
        return <ComingSoonSection title="Media Library" />;
      case 'members':
        return <ComingSoonSection title="Member Management" />;
      case 'emails':
        return <ComingSoonSection title="Email System" />;
      case 'analytics':
        return <ComingSoonSection title="Analytics Dashboard" />;
      case 'settings':
        return <ComingSoonSection title="Platform Settings" />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {renderContent()}
    </div>
  );
}

// Original dashboard content moved to a separate component
function DashboardContent() {
  const { setActiveTab } = useAdmin();

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
              onClick={() => setActiveTab('content')}
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              New Content
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              View Analytics
              <ArrowUpRight className="w-4 h-4 ml-2" />
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
            onClick={() => setActiveTab('content')}
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
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
        {date === '--' ? (
          <span className="text-gray-400 dark:text-gray-500">--</span>
        ) : (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
            {date}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
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
        <button className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
          <ChevronRight className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
} 