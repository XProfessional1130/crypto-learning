'use client';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  Heading1,
  Heading2
} from 'lucide-react';

interface ContentEditorProps {
  initialContent?: ContentData;
  onSave: (data: ContentData) => Promise<void>;
  isSaving?: boolean;
}

interface ContentData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  status: 'draft' | 'published' | 'scheduled';
  publishDate?: Date;
  seo: {
    title: string;
    description: string;
    ogImage: string;
    canonical: string;
  };
  visibility: 'public' | 'members' | 'paid';
}

export function ContentEditor({ initialContent, onSave, isSaving = false }: ContentEditorProps) {
  const [content, setContent] = useState<ContentData>({
    title: initialContent?.title || '',
    slug: initialContent?.slug || '',
    content: initialContent?.content || '',
    excerpt: initialContent?.excerpt || '',
    type: initialContent?.type || 'article',
    status: initialContent?.status || 'draft',
    publishDate: initialContent?.publishDate || new Date(),
    seo: {
      title: initialContent?.seo?.title || '',
      description: initialContent?.seo?.description || '',
      ogImage: initialContent?.seo?.ogImage || '',
      canonical: initialContent?.seo?.canonical || '',
    },
    visibility: initialContent?.visibility || 'public',
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content.content,
    onUpdate: ({ editor }) => {
      setContent(prev => ({
        ...prev,
        content: editor.getHTML(),
      }));
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setContent(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug || generateSlug(newTitle),
      seo: {
        ...prev.seo,
        title: prev.seo.title || newTitle,
      }
    }));
  };

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newExcerpt = e.target.value;
    setContent(prev => ({
      ...prev,
      excerpt: newExcerpt,
      seo: {
        ...prev.seo,
        description: prev.seo.description || newExcerpt,
      }
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value;
    setContent(prev => ({
      ...prev,
      slug: generateSlug(newSlug),
    }));
  };

  const handleSeoChange = (key: keyof ContentData['seo'], value: string) => {
    setContent(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [key]: value,
      }
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        {/* Content editor main area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <input
            type="text"
            placeholder="Title"
            className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 mb-6 text-gray-900 dark:text-white"
            value={content.title}
            onChange={handleTitleChange}
          />

          <div className="border-t border-gray-200 dark:border-gray-700 my-6" />
          
          {/* TipTap toolbar */}
          {editor && (
            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Bold"
              >
                <Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Italic"
              >
                <Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Bullet List"
              >
                <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Ordered List"
              >
                <ListOrdered className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => {
                  const url = window.prompt('Enter URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-600' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                title="Link"
              >
                <LinkIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          )}
          
          {/* TipTap editor */}
          <div className="prose dark:prose-invert max-w-none min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        </div>
        
        {/* Excerpt */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Excerpt</h3>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            placeholder="Write a short excerpt (used for previews and SEO)"
            value={content.excerpt}
            onChange={handleExcerptChange}
          />
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Publication settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Publication</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                value={content.status}
                onChange={(e) => setContent({...content, status: e.target.value as ContentData['status']})}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibility
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                value={content.visibility}
                onChange={(e) => setContent({...content, visibility: e.target.value as ContentData['visibility']})}
              >
                <option value="public">Public</option>
                <option value="members">Members Only</option>
                <option value="paid">Paid Members Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content Type
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                value={content.type}
                onChange={(e) => setContent({...content, type: e.target.value})}
              >
                <option value="article">Article</option>
                <option value="guide">Guide</option>
                <option value="tutorial">Tutorial</option>
                <option value="course">Course</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-1">/</span>
                <input
                  type="text"
                  className="flex-grow border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                  placeholder="url-slug"
                  value={content.slug}
                  onChange={handleSlugChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* SEO settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">SEO</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SEO Title
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                placeholder="SEO title (defaults to content title)"
                value={content.seo.title}
                onChange={(e) => handleSeoChange('title', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.seo.title.length} / 60 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                rows={3}
                placeholder="Meta description (defaults to excerpt)"
                value={content.seo.description}
                onChange={(e) => handleSeoChange('description', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.seo.description.length} / 160 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Image URL
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                placeholder="https://example.com/image.jpg"
                value={content.seo.ogImage}
                onChange={(e) => handleSeoChange('ogImage', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
                placeholder="https://example.com/canonical-url"
                value={content.seo.canonical}
                onChange={(e) => handleSeoChange('canonical', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* SEO Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">SEO Preview</h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <div className="text-green-700 dark:text-green-500 text-sm truncate">
              {`https://yoursite.com/${content.slug}`}
            </div>
            <div className="text-blue-600 dark:text-blue-400 font-medium text-xl mt-1 truncate">
              {content.seo.title || content.title}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
              {content.seo.description || content.excerpt}
            </div>
          </div>
        </div>
        
        {/* Save button */}
        <button
          onClick={() => onSave(content)}
          disabled={isSaving || !content.title}
          className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : content.status === 'published' ? 'Publish' : 'Save'}
        </button>
      </div>
    </div>
  );
} 