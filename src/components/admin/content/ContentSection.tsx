'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/api/supabase';
import { FilePlus, ChevronRight, Search } from 'lucide-react';
import ContentEditor from '@/components/admin/content/ContentEditor';
import { useSearchParams, useRouter } from 'next/navigation';

interface Content {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: 'draft' | 'published' | 'scheduled';
  visibility: 'public' | 'members' | 'paid';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  view_count: number;
}

export default function ContentSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  
  // Get the content ID from the URL instead of local state
  const selectedContentId = searchParams.get('edit');

  // Update URL when filters change
  const updateFilters = (newSearch: string, newStatus: string, newType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set('search', newSearch);
    else params.delete('search');
    if (newStatus !== 'all') params.set('status', newStatus);
    else params.delete('status');
    if (newType !== 'all') params.set('type', newType);
    else params.delete('type');
    
    router.push(`/admin-platform/content?${params.toString()}`, { scroll: false });
  };

  const { data: content, isLoading } = useQuery<Content[]>({
    queryKey: ['admin-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredContent = content?.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleContentClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('edit', id);
    router.push(`/admin-platform/content?${params.toString()}`, { scroll: false });
  };

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('edit');
    router.push(`/admin-platform/content?${params.toString()}`, { scroll: false });
  };

  if (selectedContentId) {
    return (
      <ContentEditor
        contentId={selectedContentId}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => handleContentClick('new')}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
            >
              <div className="flex items-center">
                <FilePlus className="w-5 h-5 text-brand-600 dark:text-brand-400 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">New Content</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Content list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Content</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={search}
                  onChange={(e) => {
                    const newSearch = e.target.value;
                    setSearch(newSearch);
                    updateFilters(newSearch, statusFilter, typeFilter);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  setStatusFilter(newStatus);
                  updateFilters(search, newStatus, typeFilter);
                }}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => {
                  const newType = e.target.value;
                  setTypeFilter(newType);
                  updateFilters(search, statusFilter, newType);
                }}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="article">Article</option>
                <option value="guide">Guide</option>
                <option value="tutorial">Tutorial</option>
                <option value="course">Course</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Views</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase">Updated</th>
                <th scope="col" className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredContent?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No content found
                  </td>
                </tr>
              ) : (
                filteredContent?.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => handleContentClick(item.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{item.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        item.status === 'published' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : item.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.view_count}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(item.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 